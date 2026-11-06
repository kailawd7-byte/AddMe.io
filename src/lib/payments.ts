import { prisma } from "./prisma.ts";
import { recordLedgerTransaction } from "./ledger.ts";
import { POINT_PACKS, getPackById } from "./constants.ts";
import type { PointPack } from "./constants.ts";
import Stripe from "stripe";

// Instanciation conditionnelle du client Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const isRealStripeKey =
  stripeSecretKey.startsWith("sk_live_") ||
  (stripeSecretKey.startsWith("sk_test_") && !stripeSecretKey.includes("placeholder"));

export const stripe = isRealStripeKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27.acacia" as any,
    })
  : null;

export interface CreateCheckoutResult {
  url: string;
  sessionId: string;
  paymentId: string;
  pack: PointPack;
  isMock: boolean;
}

/**
 * Crée une session de paiement pour un pack de points (Stripe Checkout réel ou sandbox sécurisée)
 */
export async function createCheckoutSession(
  userId: string,
  packId: string,
  originUrl: string = "http://localhost:3000"
): Promise<CreateCheckoutResult> {
  const pack = getPackById(packId);
  if (!pack) {
    throw new Error(`Pack de points inconnu ou invalide : ${packId}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, status: true },
  });

  if (!user) {
    throw new Error("Utilisateur introuvable.");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Votre compte est suspendu ou restreint. Vous ne pouvez pas acheter de points.");
  }

  // Tenter de créer une session Stripe Checkout si la clé est valide
  if (stripe) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `AddMe.io — ${pack.name} (${pack.points} points)`,
                description: pack.description,
              },
              unit_amount: pack.priceInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: user.email,
        client_reference_id: user.id,
        metadata: {
          userId: user.id,
          packId: pack.id,
          pointsAmount: String(pack.points),
        },
        success_url: `${originUrl}/shop?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${originUrl}/shop?canceled=true`,
      });

      // Enregistrement du paiement en attente
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          packId: pack.id,
          pointsAmount: pack.points,
          amountInCents: pack.priceInCents,
          currency: "EUR",
          provider: "STRIPE",
          stripeSessionId: session.id,
          status: "PENDING",
        },
      });

      return {
        url: session.url || `${originUrl}/shop`,
        sessionId: session.id,
        paymentId: payment.id,
        pack,
        isMock: false,
      };
    } catch (err: any) {
      console.warn("Échec appel direct API Stripe (mode simulation activé) :", err.message);
    }
  }

  // Fallback élégant : Mode Simulation Sandbox (pour tests automatisés et environnement local)
  const mockSessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      packId: pack.id,
      pointsAmount: pack.points,
      amountInCents: pack.priceInCents,
      currency: "EUR",
      provider: "STRIPE",
      stripeSessionId: mockSessionId,
      status: "PENDING",
    },
  });

  const mockCheckoutUrl = `${originUrl}/shop?session_id=${mockSessionId}&pack_id=${pack.id}&simulated=true`;

  return {
    url: mockCheckoutUrl,
    sessionId: mockSessionId,
    paymentId: payment.id,
    pack,
    isMock: true,
  };
}

/**
 * Traite la confirmation d'un paiement Stripe de façon strictement atomique et idempotente.
 * Seule cette fonction crédite les points au Ledger après confirmation.
 */
export async function completePaymentConfirmation(
  sessionId: string,
  paymentIntentId?: string | null
) {
  // 1. Recherche du paiement en attente
  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId: sessionId },
    include: { user: true },
  });

  if (!payment) {
    throw new Error(`Paiement introuvable pour la session Stripe : ${sessionId}`);
  }

  // 2. Règle d'idempotence absolue : si déjà COMPLETED, on ne double jamais le crédit
  if (payment.status === "COMPLETED") {
    return {
      success: true,
      alreadyProcessed: true,
      paymentId: payment.id,
      pointsAmount: payment.pointsAmount,
      message: "Paiement déjà confirmé et points déjà crédités.",
    };
  }

  const pack = getPackById(payment.packId);
  const packName = pack ? pack.name : "Pack de points";
  const idempotencyKey = `stripe-payment-${payment.id}`;

  // 3. Transaction atomique : Validation du paiement + Écriture dans le Ledger
  const result = await prisma.$transaction(async (tx) => {
    // A. Écriture dans le Ledger (append-only)
    const ledgerTx = await recordLedgerTransaction(
      {
        userId: payment.userId,
        amount: payment.pointsAmount,
        type: "PACK_PURCHASE",
        referenceType: "PAYMENT",
        referenceId: payment.id,
        idempotencyKey,
        description: `Achat ${packName} (+${payment.pointsAmount} pts) pour ${(payment.amountInCents / 100).toFixed(2)} €`,
      },
      tx
    );

    // B. Mise à jour de l'état du paiement
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        stripePaymentIntentId: paymentIntentId || payment.stripePaymentIntentId || `pi_auto_${Date.now()}`,
        ledgerEntryId: ledgerTx.entry.id,
      },
    });

    // C. Journalisation d'audit
    await tx.auditLog.create({
      data: {
        actorId: payment.userId,
        targetId: payment.userId,
        action: "PACK_PURCHASE_COMPLETED",
        details: JSON.stringify({
          paymentId: payment.id,
          packId: payment.packId,
          pointsCredited: payment.pointsAmount,
          amountInCents: payment.amountInCents,
          stripeSessionId: sessionId,
          ledgerEntryId: ledgerTx.entry.id,
        }),
      },
    });

    return {
      payment: updatedPayment,
      ledgerEntry: ledgerTx.entry,
      newBalance: ledgerTx.balance,
    };
  });

  return {
    success: true,
    alreadyProcessed: false,
    paymentId: result.payment.id,
    pointsAmount: payment.pointsAmount,
    newBalance: result.newBalance,
    message: `Paiement confirmé avec succès ! +${payment.pointsAmount} points crédités à votre solde.`,
  };
}

/**
 * Traite un événement Webhook Stripe (réel ou test)
 */
export async function processStripeWebhookEvent(
  payloadString: string,
  signatureHeader: string | null
) {
  let event: Stripe.Event;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const isRealWebhookSecret =
    webhookSecret.startsWith("whsec_") && !webhookSecret.includes("placeholder");

  if (isRealWebhookSecret && stripe && signatureHeader) {
    try {
      event = stripe.webhooks.constructEvent(payloadString, signatureHeader, webhookSecret);
    } catch (err: any) {
      throw new Error(`Signature webhook Stripe invalide : ${err.message}`);
    }
  } else {
    // Mode dev / test / simulation
    try {
      event = JSON.parse(payloadString);
    } catch {
      throw new Error("Payload webhook JSON invalide.");
    }
  }

  // Traitement des types d'événements de confirmation
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    return await completePaymentConfirmation(sessionId, paymentIntentId);
  }

  return {
    success: true,
    unhandled: true,
    eventType: event.type,
  };
}

/**
 * Récupère l'historique complet des paiements d'un utilisateur
 */
export async function getUserPaymentHistory(userId: string) {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      ledgerEntry: {
        select: {
          id: true,
          amount: true,
          createdAt: true,
        },
      },
    },
  });

  return payments.map((p) => {
    const pack = getPackById(p.packId);
    return {
      id: p.id,
      packId: p.packId,
      packName: pack?.name || "Pack de points",
      pointsAmount: p.pointsAmount,
      amountFormatted: (p.amountInCents / 100).toFixed(2) + " €",
      currency: p.currency,
      provider: p.provider,
      status: p.status,
      stripeSessionId: p.stripeSessionId,
      createdAt: p.createdAt,
    };
  });
}
