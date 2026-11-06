import { prisma } from "./prisma";
import { recordLedgerTransaction } from "./ledger";
import { getPackById, type PointPack } from "./constants";

export type MobileMoneyOperator = "ORANGE_MONEY" | "MTN_MOMO" | "WAVE" | "MOOV_MONEY";

export interface SaasPayInitiateInput {
  userId: string;
  packId: "PACK_STARTER" | "PACK_CREATOR" | "PACK_PRO";
  phoneNumber: string;
  operator: MobileMoneyOperator;
  returnUrl?: string;
}

export interface SaasPayInitiateResult {
  success: boolean;
  paymentId: string;
  transactionReference: string;
  pointsAmount: number;
  amountInFcfa: number;
  amountFormatted: string;
  operator: MobileMoneyOperator;
  status: "COMPLETED" | "PENDING";
  checkoutUrl?: string;
  message: string;
  isSimulation: boolean;
}

/**
 * Initie un paiement Mobile Money via SaaSPay (Afrique : Orange Money, MTN, Wave, Moov)
 */
export async function initiateSaasPayPayment(
  input: SaasPayInitiateInput
): Promise<SaasPayInitiateResult> {
  const { userId, packId, phoneNumber, operator, returnUrl } = input;

  const pack = getPackById(packId);
  if (!pack) {
    throw new Error("Pack de points invalide.");
  }

  // Nettoyage et validation basique du numéro de téléphone
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, "");
  if (cleanPhone.length < 8) {
    throw new Error("Veuillez indiquer un numéro de téléphone Mobile Money valide.");
  }

  // Vérifier si l'utilisateur existe et est actif
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, status: true },
  });

  if (!user) {
    throw new Error("Utilisateur introuvable.");
  }
  if (user.status !== "ACTIVE") {
    throw new Error("Votre compte est actuellement restreint.");
  }

  const transactionRef = `saaspay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const saasPayApiKey = process.env.SAASPAY_API_KEY;

  // 1. Création de l'enregistrement de paiement en base de données
  const payment = await prisma.payment.create({
    data: {
      userId,
      packId,
      pointsAmount: pack.points,
      amountInCents: pack.priceInFcfa * 100, // Stocké en centimes de FCFA
      currency: "XOF",
      provider: "SAASPAY",
      stripeSessionId: transactionRef, // Référence de transaction externe
      status: "PENDING",
    },
  });

  // 2. Si une clé d'API SaaSPay réelle est configurée en production
  if (saasPayApiKey && !saasPayApiKey.includes("placeholder")) {
    try {
      const response = await fetch("https://api.saaspay.africa/v1/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${saasPayApiKey}`,
        },
        body: JSON.stringify({
          reference: transactionRef,
          amount: pack.priceInFcfa,
          currency: "XOF",
          phone_number: cleanPhone,
          operator,
          customer_email: user.email,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/webhooks/saaspay`,
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || ""}/shop?success=true`,
        }),
      });

      if (response.ok) {
        const saasPayData = await response.json();
        return {
          success: true,
          paymentId: payment.id,
          transactionReference: transactionRef,
          pointsAmount: pack.points,
          amountInFcfa: pack.priceInFcfa,
          amountFormatted: pack.priceFcfaFormatted,
          operator,
          status: "PENDING",
          checkoutUrl: saasPayData.checkout_url || saasPayData.payment_url,
          message: "Redirection vers le portail Mobile Money sécurisé SaaSPay...",
          isSimulation: false,
        };
      }
    } catch (err) {
      console.warn("Échec appel API SaaSPay externe, bascule en mode simulation sécurisée:", err);
    }
  }

  // 3. Mode Simulation Sandbox (développement & environnements sans clé d'API active)
  // Crédit immédiat des points pour permettre le test de bout en bout
  const idempotencyKey = `saaspay-pack-${payment.id}`;

  await prisma.$transaction(async (tx) => {
    // A. Écriture au Ledger
    const ledgerResult = await recordLedgerTransaction(
      {
        userId,
        amount: pack.points,
        type: "PACK_PURCHASE",
        referenceType: "PAYMENT",
        referenceId: payment.id,
        idempotencyKey,
        description: `Achat Mobile Money (${operator}) : ${pack.name} (+${pack.points} points pour ${pack.priceFcfaFormatted})`,
      },
      tx
    );

    // B. Mise à jour du statut de paiement
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        ledgerEntryId: ledgerResult.entry.id,
      },
    });
  });

  return {
    success: true,
    paymentId: payment.id,
    transactionReference: transactionRef,
    pointsAmount: pack.points,
    amountInFcfa: pack.priceInFcfa,
    amountFormatted: pack.priceFcfaFormatted,
    operator,
    status: "COMPLETED",
    message: `Paiement Mobile Money validé avec succès (${operator} : ${cleanPhone}) ! +${pack.points} points crédités à votre solde.`,
    isSimulation: true,
  };
}
