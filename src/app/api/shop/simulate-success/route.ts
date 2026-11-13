import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { completePaymentConfirmation } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Identifiant de session manquant." },
        { status: 400 }
      );
    }

    // Sécurité : vérifier que la session appartient bien à cet utilisateur
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (!payment || payment.userId !== user.id) {
      return NextResponse.json(
        { error: "Session de paiement introuvable ou non autorisée." },
        { status: 404 }
      );
    }

    // Sécurité absolue : désactiver la simulation en production
    // Seul le paiement réel SasPay validé peut créditer des points
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const isLocalDev =
      process.env.NODE_ENV === "development" &&
      (appUrl.includes("localhost") || appUrl.includes("127.0.0.1"));

    if (!isLocalDev || process.env.ENABLE_MOCK_PAYMENT !== "true") {
      return NextResponse.json(
        {
          error:
            "La validation simulée est strictement désactivée. Veuillez finaliser votre règlement via la passerelle Mobile Money sécurisée.",
        },
        { status: 403 }
      );
    }

    const result = await completePaymentConfirmation(sessionId, `pi_mock_${Date.now()}`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erreur simulation paiement:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la validation simulée du paiement." },
      { status: 400 }
    );
  }
}

