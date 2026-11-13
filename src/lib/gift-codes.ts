import { prisma } from "./prisma.ts";
import { recordLedgerTransaction } from "./ledger.ts";
import { SYSTEM_DEFAULTS, LEDGER_TYPES } from "./constants.ts";

export interface GiftCodeValidationResult {
  valid: boolean;
  code?: string;
  id?: string;
  multiplier?: number;
  bonusPoints?: number;
  influencerBonus?: number;
  influencerName?: string;
  message: string;
}

/**
 * Nettoie et normalise un code cadeau (MAJUSCULES, sans espaces).
 */
export function normalizeGiftCode(code: string): string {
  return (code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

/**
 * Valide un code cadeau en temps réel (pour l'inscription ou la vérification API).
 */
export async function validateGiftCode(rawCode: string): Promise<GiftCodeValidationResult> {
  const cleanCode = normalizeGiftCode(rawCode);

  if (!cleanCode || cleanCode.length < 3) {
    return {
      valid: false,
      message: "Veuillez saisir un code cadeau d'au moins 3 caractères.",
    };
  }

  const giftCode = await prisma.giftCode.findUnique({
    where: { code: cleanCode },
    include: {
      influencer: {
        select: {
          id: true,
          email: true,
          status: true,
        },
      },
    },
  });

  if (!giftCode) {
    return {
      valid: false,
      message: `Le code « ${cleanCode} » n'existe pas ou est erroné.`,
    };
  }

  if (!giftCode.isActive) {
    return {
      valid: false,
      message: `Le code « ${cleanCode} » est actuellement désactivé.`,
    };
  }

  if (giftCode.influencer.status !== "ACTIVE") {
    return {
      valid: false,
      message: `Ce code cadeau n'est plus éligible (compte partenaire inactif).`,
    };
  }

  if (giftCode.expiresAt && new Date(giftCode.expiresAt) < new Date()) {
    return {
      valid: false,
      message: `Le code « ${cleanCode} » a expiré le ${new Date(giftCode.expiresAt).toLocaleDateString("fr-FR")}.`,
    };
  }

  if (giftCode.maxUses !== null && giftCode.usesCount >= giftCode.maxUses) {
    return {
      valid: false,
      message: `Le quota d'utilisation du code « ${cleanCode} » a été atteint.`,
    };
  }

  const influencerDisplayName =
    giftCode.influencer.email.split("@")[0] || "Influenceur Partenaire";

  return {
    valid: true,
    id: giftCode.id,
    code: giftCode.code,
    multiplier: giftCode.multiplier,
    bonusPoints: giftCode.userBonusPoints,
    influencerBonus: giftCode.influencerBonus,
    influencerName: influencerDisplayName,
    message: `Code valide ! Vous bénéficiez de +${giftCode.userBonusPoints} points de bienvenue (Bonus x${giftCode.multiplier}) offerts par ${influencerDisplayName}.`,
  };
}

/**
 * Applique un code cadeau lors de l'inscription d'un nouvel utilisateur.
 * Crédite immédiatement le bonus x4 (200 pts) au nouvel inscrit dans le Ledger.
 */
export async function applyGiftCodeRegistration({
  userId,
  userEmail,
  rawCode,
  tx,
}: {
  userId: string;
  userEmail: string;
  rawCode: string;
  tx?: any;
}) {
  const client = tx || prisma;
  const validation = await validateGiftCode(rawCode);

  if (!validation.valid || !validation.id || !validation.code) {
    throw new Error(validation.message);
  }

  // 1. Enregistrement de l'utilisation du code
  const usage = await client.giftCodeUsage.create({
    data: {
      giftCodeId: validation.id,
      userId,
      userBonusGiven: validation.bonusPoints ?? SYSTEM_DEFAULTS.GIFT_CODE_BONUS_POINTS,
      isVerified: false,
      influencerRewarded: false,
      influencerPoints: validation.influencerBonus ?? SYSTEM_DEFAULTS.INFLUENCER_BONUS_PER_USER,
    },
  });

  // 2. Incrémentation du compteur d'utilisations du code
  await client.giftCode.update({
    where: { id: validation.id },
    data: {
      usesCount: { increment: 1 },
    },
  });

  // 3. Crédit du bonus x4 (200 points) au nouvel utilisateur dans le Grand Livre
  const bonusPoints = validation.bonusPoints ?? SYSTEM_DEFAULTS.GIFT_CODE_BONUS_POINTS;
  const idempotencyKey = `gift-code-user-${userId}`;

  await recordLedgerTransaction(
    {
      userId,
      amount: bonusPoints,
      type: LEDGER_TYPES.GIFT_CODE_BONUS,
      referenceType: "GIFT_CODE",
      referenceId: validation.id,
      idempotencyKey,
      description: `Bonus Code Cadeau (${validation.code}) : +${bonusPoints} points offerts (Bonus x${validation.multiplier})`,
    },
    client
  );

  return {
    success: true,
    usageId: usage.id,
    code: validation.code,
    bonusPoints,
  };
}

/**
 * Déclenche la récompense de 100 points pour l'influenceur dès que le compte filleul est vérifié.
 * Règle anti-fraude majeure : aucun point n'est versé à l'influenceur pour des comptes non vérifiés.
 */
export async function rewardInfluencerIfVerified({
  userId,
  tx,
}: {
  userId: string;
  tx?: any;
}) {
  const client = tx || prisma;

  // 1. Recherche d'une utilisation de code cadeau non encore récompensée pour cet utilisateur
  const usage = await client.giftCodeUsage.findUnique({
    where: { userId },
    include: {
      giftCode: {
        include: {
          influencer: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!usage || usage.influencerRewarded) {
    return { rewarded: false, reason: "already_rewarded_or_no_code" };
  }

  const { giftCode, user } = usage;
  const influencer = giftCode.influencer;
  const rewardAmount = usage.influencerPoints || giftCode.influencerBonus || 100.0;
  const idempotencyKey = `influencer-reward-${giftCode.id}-${user.id}`;

  // 2. Mise à jour de l'usage : marqué vérifié et récompensé
  await client.giftCodeUsage.update({
    where: { id: usage.id },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
      influencerRewarded: true,
    },
  });

  // 3. Incrémentation du compteur de vérifications sur le code cadeau
  await client.giftCode.update({
    where: { id: giftCode.id },
    data: {
      verifiedCount: { increment: 1 },
    },
  });

  // 4. Crédit des 100 points à l'influenceur dans le Grand Livre (Ledger)
  await recordLedgerTransaction(
    {
      userId: influencer.id,
      amount: rewardAmount,
      type: LEDGER_TYPES.INFLUENCER_REWARD,
      referenceType: "GIFT_CODE_REFERRAL",
      referenceId: giftCode.id,
      idempotencyKey,
      description: `Parrainage Influence (${giftCode.code}) : +${rewardAmount} points pour l'inscription vérifiée de ${user.email}`,
    },
    client
  );

  // 5. Journalisation d'audit
  await client.auditLog.create({
    data: {
      actorId: user.id,
      targetId: influencer.id,
      action: "INFLUENCER_REWARD_CREDITED",
      details: JSON.stringify({
        giftCodeId: giftCode.id,
        code: giftCode.code,
        invitedUserId: user.id,
        invitedUserEmail: user.email,
        influencerId: influencer.id,
        points: rewardAmount,
      }),
    },
  });

  return {
    rewarded: true,
    influencerId: influencer.id,
    influencerEmail: influencer.email,
    rewardAmount,
    code: giftCode.code,
  };
}

/**
 * ADMINISTRATION : Liste tous les codes cadeaux avec statistiques complètes.
 */
export async function listAllGiftCodes() {
  const codes = await prisma.giftCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      influencer: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          reputationScore: true,
          createdAt: true,
        },
      },
      usages: {
        select: {
          id: true,
          userId: true,
          userBonusGiven: true,
          isVerified: true,
          influencerRewarded: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              isEmailVerified: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return codes.map((c) => {
    const totalUserBonusPoints = c.usages.reduce((acc, u) => acc + u.userBonusGiven, 0);
    const totalInfluencerBonusPoints = c.usages
      .filter((u) => u.influencerRewarded)
      .reduce((acc) => acc + c.influencerBonus, 0);

    return {
      id: c.id,
      code: c.code,
      description: c.description,
      multiplier: c.multiplier,
      influencerBonus: c.influencerBonus,
      userBonusPoints: c.userBonusPoints,
      maxUses: c.maxUses,
      usesCount: c.usesCount,
      verifiedCount: c.verifiedCount,
      isActive: c.isActive,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      influencer: {
        id: c.influencer.id,
        email: c.influencer.email,
        name: c.influencer.email.split("@")[0],
        status: c.influencer.status,
      },
      stats: {
        totalSignups: c.usesCount,
        verifiedSignups: c.verifiedCount,
        conversionRate: c.usesCount > 0 ? ((c.verifiedCount / c.usesCount) * 100).toFixed(1) + "%" : "0%",
        totalPointsDistributed: totalUserBonusPoints + totalInfluencerBonusPoints,
      },
      recentUsages: c.usages.slice(0, 5).map((u) => ({
        id: u.id,
        userEmail: u.user.email,
        isVerified: u.isVerified,
        influencerRewarded: u.influencerRewarded,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  });
}

/**
 * ADMINISTRATION : Création d'un code cadeau avec liaison obligatoire à un compte utilisateur.
 */
export async function createGiftCodeAdmin({
  code,
  influencerEmail,
  description,
  multiplier = 4.0,
  influencerBonus = 100.0,
  maxUses = null,
  expiresAt = null,
  adminId,
}: {
  code: string;
  influencerEmail: string;
  description?: string;
  multiplier?: number;
  influencerBonus?: number;
  maxUses?: number | null;
  expiresAt?: string | null;
  adminId: string;
}) {
  const cleanCode = normalizeGiftCode(code);
  if (!cleanCode || cleanCode.length < 3) {
    throw new Error("Le code cadeau doit comporter au moins 3 caractères alphanumériques.");
  }

  // 1. Vérification stricte du compte utilisateur affilié (obligatoire)
  const cleanEmail = (influencerEmail || "").trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error("Veuillez renseigner l'adresse email de l'influenceur à affilier.");
  }

  const influencer = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!influencer) {
    throw new Error(`Aucun utilisateur trouvé avec l'email « ${cleanEmail} ». L'influenceur doit préalablement avoir un compte sur AddMe.io.`);
  }

  // 2. Vérification d'unicité du code
  const existingCode = await prisma.giftCode.findUnique({
    where: { code: cleanCode },
  });

  if (existingCode) {
    throw new Error(`Le code cadeau « ${cleanCode} » existe déjà. Veuillez en choisir un autre.`);
  }

  // 3. Calcul des points filleul (50 pts de base * multiplicateur, ex: 50 * 4 = 200 pts)
  const userBonusPoints = SYSTEM_DEFAULTS.WELCOME_BONUS_POINTS * multiplier;

  const newGiftCode = await prisma.giftCode.create({
    data: {
      code: cleanCode,
      influencerId: influencer.id,
      description: description?.trim() || null,
      multiplier,
      influencerBonus,
      userBonusPoints,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    },
    include: {
      influencer: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  // 4. Journal d'audit admin
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      targetId: influencer.id,
      action: "GIFT_CODE_CREATED",
      details: JSON.stringify({
        code: cleanCode,
        influencerId: influencer.id,
        influencerEmail: influencer.email,
        multiplier,
        userBonusPoints,
        influencerBonus,
      }),
    },
  });

  return newGiftCode;
}
