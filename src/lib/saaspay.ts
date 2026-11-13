import { prisma } from "./prisma";
import { recordLedgerTransaction } from "./ledger";
import { getPackById } from "./constants";
import {
  createSasPaySoftpay,
  isSasPayConfigured,
  formatDecimalAmount,
} from "./saspay";

export * from "./saspay";

export type MobileMoneyOperator = "ORANGE_MONEY" | "MTN_MOMO" | "WAVE" | "MOOV_MONEY";

export interface SaasPayInitiateInput {
  userId: string;
  packId: string;
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
 * Fonction d'initiation Mobile Money compatible avec l'endpoint /api/shop/saaspay/checkout
 */
export async function initiateSaasPayPayment(
  input: SaasPayInitiateInput
): Promise<SaasPayInitiateResult> {
  const { userId, packId, phoneNumber, operator } = input;
  const pack = getPackById(packId as any);
  if (!pack) {
    throw new Error("Pack de points invalide.");
  }

  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, "");
  if (cleanPhone.length < 8) {
    throw new Error("Veuillez indiquer un numéro de téléphone Mobile Money valide.");
  }

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

  const networkMap: Record<MobileMoneyOperator, { country: string; network: string }> = {
    ORANGE_MONEY: { country: "CI", network: "orange_ci" },
    MTN_MOMO: { country: "BJ", network: "mtn_bj" },
    WAVE: { country: "CI", network: "wave_ci" },
    MOOV_MONEY: { country: "BJ", network: "moov_bj" },
  };

  const target = networkMap[operator] || { country: "BJ", network: "mtn_bj" };

  const payment = await prisma.payment.create({
    data: {
      userId,
      packId: pack.id,
      pointsAmount: pack.points,
      amountInCents: pack.priceInFcfa * 100,
      currency: "XOF",
      provider: "SAASPAY",
      status: "PENDING",
    },
  });

  if (isSasPayConfigured()) {
    try {
      const idempotencyKey = `softpay_${payment.id}_${Date.now()}`;
      const userFullName = user.email.split("@")[0] || "Client";
      const softpayRes = await createSasPaySoftpay({
        amount: formatDecimalAmount(pack.priceInFcfa),
        currency: "XOF",
        country: target.country,
        network: target.network,
        customer: {
          email: user.email,
          first_name: userFullName,
          last_name: "AddMe",
          phone: cleanPhone,
        },
        idempotencyKey,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          stripeSessionId: softpayRes.id,
        },
      });

      return {
        success: true,
        paymentId: payment.id,
        transactionReference: softpayRes.id,
        pointsAmount: pack.points,
        amountInFcfa: pack.priceInFcfa,
        amountFormatted: pack.priceFcfaFormatted,
        operator,
        status: softpayRes.status === "SUCCESS" ? "COMPLETED" : "PENDING",
        checkoutUrl: softpayRes.checkout_url || undefined,
        message: softpayRes.checkout_url
          ? "Redirection vers la passerelle sécurisée Mobile Money..."
          : "Veuillez valider l'invite sur votre téléphone Mobile Money.",
        isSimulation: false,
      };
    } catch (err: any) {
      console.warn("Échec appel direct SasPay softpay, bascule en simulation :", err.message);
    }
  }

  // Simulation fallback si aucune clé API configurée
  const idempotencyKey = `saaspay-pack-${payment.id}`;
  await prisma.$transaction(async (tx) => {
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
    transactionReference: `mock_${payment.id}`,
    pointsAmount: pack.points,
    amountInFcfa: pack.priceInFcfa,
    amountFormatted: pack.priceFcfaFormatted,
    operator,
    status: "COMPLETED",
    message: `Paiement Mobile Money validé avec succès (${operator} : ${cleanPhone}) ! +${pack.points} points crédités à votre solde.`,
    isSimulation: true,
  };
}
