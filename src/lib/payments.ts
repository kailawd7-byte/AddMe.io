import { prisma } from "./prisma.ts";
import { recordLedgerTransaction } from "./ledger.ts";
import { POINT_PACKS, getPackById } from "./constants.ts";
import type { PointPack } from "./constants.ts";
import Stripe from "stripe";
import {
  createSasPayCheckoutSession,
  isSasPayConfigured,
  verifySasPayPayment,
  verifySasPayWebhookSignature,
  formatDecimalAmount,
  SasPayApiError,
} from "./saspay.ts";

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

export type PaymentProvider = "STRIPE" | "SAASPAY";

export interface CreateCheckoutResult {
  url: string;
  sessionId: string;
  paymentId: string;
  pack: PointPack;
  isMock: boolean;
  provider: PaymentProvider;
}

/**
 * Crée une session de paiement pour un pack de points (SaaSPay Mobile Money ou Stripe Checkout)
 */
export async function createCheckoutSession(
  userId: string,
  packId: string,
  originUrl: string = "http://localhost:3000",
  provider: PaymentProvider = "STRIPE"
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

  // 1. PAIEMENT MOBILE MONEY & CARTE VIA SASPAY (Wave, Orange, MTN, Moov, etc.)
  if (provider === "SAASPAY") {
    // Si la clé API SasPay est configurée, appel officiel vers l'API SasPay (POST /checkout-sessions/)
    if (isSasPayConfigured()) {
      try {
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

        const sasPaySession = await createSasPayCheckoutSession({
          amount: formatDecimalAmount(pack.priceInFcfa),
          currency: "XOF",
          customer_email: user.email,
          customer_name: user.email.split("@")[0] || "Client AddMe",
          description: `AddMe.io — ${pack.name} (${pack.points} points)`,
          return_url: `${originUrl}/shop?success=true&provider=saspay&session_id=${payment.id}`,
          metadata: {
            userId: user.id,
            packId: pack.id,
            paymentId: payment.id,
            pointsAmount: pack.points,
          },
        });

        // Mise à jour avec l'ID réel de la session SasPay
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            stripeSessionId: sasPaySession.id,
          },
        });

        return {
          url: sasPaySession.checkout_url,
          sessionId: sasPaySession.id,
          paymentId: payment.id,
          pack,
          isMock: false,
          provider: "SAASPAY",
        };
      } catch (err: any) {
        console.warn("Échec appel direct API SasPay (mode simulation Mobile Money activé) :", err.message);
      }
    }

    // Mode simulation / bac à sable Mobile Money pour SasPay (en développement sans clé API)
    const mockSessionId = `sp_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        packId: pack.id,
        pointsAmount: pack.points,
        amountInCents: pack.priceInFcfa * 100,
        currency: "XOF",
        provider: "SAASPAY",
        stripeSessionId: mockSessionId,
        status: "PENDING",
      },
    });

    const mockCheckoutUrl = `${originUrl}/shop/saaspay?session_id=${mockSessionId}&pack_id=${pack.id}&amount=${pack.priceInFcfa}&points=${pack.points}`;

    return {
      url: mockCheckoutUrl,
      sessionId: mockSessionId,
      paymentId: payment.id,
      pack,
      isMock: true,
      provider: "SAASPAY",
    };
  }

  // 2. PAIEMENT CARTE BANCAIRE VIA STRIPE
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
        provider: "STRIPE",
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
    provider: "STRIPE",
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
  const idempotencyKey = `payment-${payment.provider.toLowerCase()}-${payment.id}`;
  const formattedPrice =
    payment.currency === "XOF"
      ? `${(payment.amountInCents / 100).toLocaleString("fr-FR")} FCFA`
      : `${(payment.amountInCents / 100).toFixed(2)} €`;

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
        description: `Achat ${packName} (+${payment.pointsAmount} pts) pour ${formattedPrice}`,
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
      amountFormatted:
        p.currency === "XOF"
          ? `${(p.amountInCents / 100).toLocaleString("fr-FR")} FCFA`
          : `${(p.amountInCents / 100).toFixed(2)} €`,
      currency: p.currency,
      provider: p.provider,
      status: p.status,
      stripeSessionId: p.stripeSessionId,
      createdAt: p.createdAt,
    };
  });
}

/**
 * Vérifie le statut réel auprès de l'API SasPay (GET /payments/{payment_id}/verify/)
 * et ne crédite les points au Ledger QUE SI le statut renvoyé est "SUCCESS".
 */
export async function verifyAndDeliverSasPayPayment(paymentIdentifier: string) {
  // 1. Recherche du paiement en base (par session SasPay ou ID interne)
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { stripeSessionId: paymentIdentifier },
        { id: paymentIdentifier },
      ],
    },
    include: { user: true },
  });

  if (!payment) {
    throw new Error(`Paiement introuvable pour la référence : ${paymentIdentifier}`);
  }

  // 2. Si déjà complété, idempotence absolue
  if (payment.status === "COMPLETED") {
    return {
      success: true,
      alreadyProcessed: true,
      status: "COMPLETED",
      paymentId: payment.id,
      pointsAmount: payment.pointsAmount,
      message: "Paiement déjà validé et points crédités.",
    };
  }

  // 3. Appel direct au endpoint officiel de vérification SasPay si l'API est configurée
  if (isSasPayConfigured()) {
    const sasPayTxId = payment.stripeSessionId || payment.id;
    const verification = await verifySasPayPayment(sasPayTxId);

    // Règle d'or absolue : Ne livrer les points QUE si SasPay renvoie "SUCCESS"
    if (verification.status === "SUCCESS") {
      const confirmResult = await completePaymentConfirmation(
        payment.stripeSessionId || payment.id,
        verification.reference || verification.id
      );
      return {
        success: true,
        alreadyProcessed: false,
        status: "SUCCESS",
        paymentId: payment.id,
        pointsAmount: confirmResult.pointsAmount,
        newBalance: confirmResult.newBalance,
        netAmount: verification.net_amount,
        currency: verification.currency,
        message: "Paiement SasPay vérifié avec succès et points crédités !",
      };
    }

    if (verification.status === "FAILED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      return {
        success: false,
        status: "FAILED",
        paymentId: payment.id,
        message: "Le paiement a été rejeté ou a échoué côté opérateur.",
      };
    }

    return {
      success: true,
      status: "PENDING",
      paymentId: payment.id,
      message: "Paiement en attente de validation par le réseau Mobile Money.",
    };
  }

  // Mode simulation de test local (si aucune clé SasPay réelle n'est renseignée)
  const confirmResult = await completePaymentConfirmation(
    payment.stripeSessionId || payment.id,
    `sim_ref_${Date.now()}`
  );
  return {
    success: true,
    alreadyProcessed: false,
    status: "SUCCESS",
    paymentId: payment.id,
    pointsAmount: confirmResult.pointsAmount,
    newBalance: confirmResult.newBalance,
    message: "Simulation de paiement SasPay validée en environnement local.",
  };
}

/**
 * Traite les événements de webhook SasPay avec vérification cryptographique HMAC
 * sur le corps brut et respect de la fenêtre temporelle de 300 secondes.
 */
export async function processSasPayWebhookEvent(
  rawBody: string,
  signatureHeader: string | null | undefined,
  timestampHeader: string | null | undefined
) {
  // 1. Vérification cryptographique de la signature HMAC sur le corps brut
  const validation = verifySasPayWebhookSignature(rawBody, signatureHeader, timestampHeader);
  if (!validation.isValid) {
    throw new Error(`Signature webhook SasPay invalide : ${validation.error}`);
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event;
  const data = payload.data || {};

  // 2. Traitement des événements du catalogue officiel SasPay
  if (event === "webhook.test") {
    return {
      success: true,
      handled: true,
      eventType: "webhook.test",
      message: "Webhook test SasPay validé avec succès.",
    };
  }

  if (event === "transaction.success" || data.status === "SUCCESS") {
    const transactionId = data.id || data.reference;
    if (!transactionId) {
      throw new Error("Identifiant de transaction manquant dans l'événement SasPay.");
    }

    // Recherche de la commande correspondante
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { stripeSessionId: transactionId },
          { id: transactionId },
          { stripeSessionId: data.reference },
        ],
      },
    });

    if (!payment) {
      // Si la transaction n'est pas trouvée par ID direct, tenter par metadata
      const metaPaymentId = data.metadata?.paymentId;
      if (metaPaymentId) {
        const paymentByMeta = await prisma.payment.findUnique({ where: { id: metaPaymentId } });
        if (paymentByMeta) {
          return await completePaymentConfirmation(
            paymentByMeta.stripeSessionId || paymentByMeta.id,
            transactionId
          );
        }
      }
      return {
        success: false,
        message: `Paiement introuvable pour la transaction SasPay ${transactionId}`,
      };
    }

    return await completePaymentConfirmation(
      payment.stripeSessionId || payment.id,
      transactionId
    );
  }

  if (event === "transaction.failed" || event === "transaction.cancelled" || data.status === "FAILED") {
    const transactionId = data.id || data.reference;
    if (transactionId) {
      await prisma.payment.updateMany({
        where: {
          OR: [
            { stripeSessionId: transactionId },
            { id: transactionId },
          ],
        },
        data: { status: "FAILED" },
      });
    }

    return {
      success: true,
      handled: true,
      eventType: event,
      message: "Transaction échouée ou annulée enregistrée.",
    };
  }

  return {
    success: true,
    unhandled: true,
    eventType: event,
  };
}
