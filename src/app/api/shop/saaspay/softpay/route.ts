import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPackById } from "@/lib/constants";
import {
  createSasPaySoftpay,
  isSasPayConfigured,
  formatDecimalAmount,
} from "@/lib/saspay";
import crypto from "crypto";

/**
 * Endpoint Softpay SasPay : /api/shop/saaspay/softpay
 * Initie un paiement Mobile Money direct (push USSD ou redirection checkout_url).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Votre compte est restreint. Vous ne pouvez pas acheter de points." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      packId,
      phone,
      country = "BJ",
      network = "mtn_bj",
      firstName,
      lastName,
      otp,
    } = body;

    const pack = getPackById(packId);
    if (!pack) {
      return NextResponse.json({ error: "Pack de points inconnu ou invalide." }, { status: 400 });
    }

    const cleanPhone = (phone || "").trim().replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      return NextResponse.json(
        { error: "Veuillez renseigner un numéro de téléphone Mobile Money valide (ex: +22997505050)." },
        { status: 400 }
      );
    }

    const userFullName = user.email.split("@")[0] || "Client";
    const userFirst = firstName || userFullName.split(/[._-]/)[0] || "Client";
    const userLast = lastName || userFullName.split(/[._-]/).slice(1).join(" ") || "Client";

    // 1. Création de l'enregistrement de paiement en base (statut PENDING)
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        packId: pack.id,
        pointsAmount: pack.points,
        amountInCents: pack.priceInFcfa * 100,
        currency: "XOF",
        provider: "SAASPAY",
        status: "PENDING",
      },
    });

    // 2. Si l'API SasPay est configurée, appel officiel vers POST /payments/softpay/
    if (isSasPayConfigured()) {
      const idempotencyKey = crypto.randomUUID();

      const softpayResult = await createSasPaySoftpay({
        amount: formatDecimalAmount(pack.priceInFcfa),
        currency: "XOF",
        country: country.toUpperCase(),
        network: network.toLowerCase(),
        customer: {
          email: user.email,
          first_name: userFirst,
          last_name: userLast,
          phone: cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`,
        },
        description: `AddMe.io — ${pack.name} (${pack.points} points)`,
        metadata: {
          userId: user.id,
          packId: pack.id,
          paymentId: payment.id,
        },
        otp: otp || undefined,
        idempotencyKey,
      });

      // Liaison avec l'identifiant de paiement SasPay
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          stripeSessionId: softpayResult.id,
        },
      });

      // Règle d'or : Si checkout_url est non vide (Wave, Orange, Carte), rediriger obligatoirement
      const hasCheckoutUrl = Boolean(softpayResult.checkout_url && softpayResult.checkout_url.trim().length > 0);

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        sasPayTransactionId: softpayResult.id,
        status: softpayResult.status,
        redirect: hasCheckoutUrl,
        checkoutUrl: softpayResult.checkout_url || null,
        message: hasCheckoutUrl
          ? "Redirection vers la passerelle de paiement sécurisée..."
          : "Demande de paiement envoyée sur votre téléphone. Veuillez valider avec votre code secret Mobile Money.",
      });
    }

    // 3. Mode simulation en local (développement sans clé SasPay active)
    const simSessionId = `sp_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripeSessionId: simSessionId,
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      sasPayTransactionId: simSessionId,
      status: "PENDING",
      redirect: false,
      checkoutUrl: null,
      isSimulation: true,
      message: "Simulation : confirmation prête à être validée.",
    });
  } catch (error: any) {
    console.error("Erreur softpay SasPay :", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'initiation du paiement Mobile Money." },
      { status: 400 }
    );
  }
}

