import { prisma } from "./prisma.ts";
import { getUserBalance, getActionRates, recordLedgerTransaction } from "./ledger.ts";
import { validateVideoPublicationUrl } from "./video-url-validator.ts";
import { generateSecureToken } from "./security.ts";

export interface CreateCampaignInput {
  userId: string;
  socialAccountId: string;
  actionType: "LIKE" | "COMMENT" | "SUBSCRIBE";
  videoUrl: string;
  commentTemplate?: string;
  totalQuantity: number;
  rewardPerWorker?: number;
  durationDays?: number;
  dailyCap?: number;
}

/**
 * Crée une campagne d'engagement avec débit atomique du ledger et création des tâches.
 */
export async function createCampaign(input: CreateCampaignInput) {
  const { userId, socialAccountId, actionType, videoUrl, commentTemplate, totalQuantity } = input;

  // 1. Quantité minimale requise
  if (!totalQuantity || totalQuantity < 1) {
    throw new Error("Le nombre de personnes souhaitées doit être d'au moins 1.");
  }

  // 2. Vérification du compte social associé
  const socialAccount = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
  });

  if (!socialAccount || socialAccount.userId !== userId) {
    throw new Error("Compte social introuvable ou non autorisé.");
  }

  // Seul le propriétaire vérifié d'un compte peut soumettre des publications de ce compte
  if (socialAccount.status !== "VERIFIED") {
    throw new Error(
      `Le compte ${socialAccount.platform} @${socialAccount.identifier} n'est pas encore vérifié. Veuillez d'abord valider votre propriété via le code en bio.`
    );
  }

  const platform = socialAccount.platform as "TIKTOK" | "YOUTUBE" | "INSTAGRAM";

  // 3. Validation stricte de l'URL de PUBLICATION (interdiction formelle des liens de profils)
  const urlValidation = validateVideoPublicationUrl(platform, videoUrl, socialAccount.identifier);
  if (!urlValidation.valid || !urlValidation.normalizedUrl) {
    throw new Error(urlValidation.error || "URL de publication invalide.");
  }
  const cleanVideoUrl = urlValidation.normalizedUrl;

  // 4. Calcul transparent des coûts (rémunération par action + frais de diffusion par durée)
  const defaultRates = await getActionRates(actionType);
  const rewardPerUnit =
    input.rewardPerWorker && input.rewardPerWorker >= 0.5
      ? Number(input.rewardPerWorker.toFixed(1))
      : defaultRates.reward;
  const costPerUnit = rewardPerUnit;

  const durationDays = input.durationDays ? Math.max(1, Math.min(input.durationDays, 60)) : 5;
  const durationFee = Number((durationDays * 0.5).toFixed(2)); // 0.5 pt par jour de diffusion
  const unitsCost = Number((totalQuantity * costPerUnit).toFixed(2));
  const totalCost = Number((unitsCost + durationFee).toFixed(2));

  // Répartition progressive automatique par jour
  const dailyCap = input.dailyCap
    ? Math.max(1, Math.min(input.dailyCap, 100))
    : Math.max(1, Math.ceil(totalQuantity / durationDays));

  // 5. Vérification préalable du solde de points disponible
  const currentBalance = await getUserBalance(userId);
  if (currentBalance < totalCost) {
    throw new Error(
      `SOLDE_INSUFFISANT: Solde actuel (${currentBalance.toFixed(1)} pts) insuffisant. Coût total de la campagne : ${totalCost.toFixed(1)} pts (${unitsCost} pts pour les ${totalQuantity} actions + ${durationFee} pts pour ${durationDays} jours de diffusion).`
    );
  }

  const campaignId = generateSecureToken(16);
  const idempotencyKey = `campaign-creation-${campaignId}`;

  // 6. Transaction atomique : Débit du ledger + Enregistrement de la campagne + Création des tâches
  return prisma.$transaction(async (tx) => {
    // A. Débit atomique du Ledger
    await recordLedgerTransaction(
      {
        userId,
        amount: -totalCost,
        type: "CAMPAIGN_DEBIT",
        referenceType: "CAMPAIGN",
        referenceId: campaignId,
        idempotencyKey,
        description: `Création de campagne : ${totalQuantity} ${actionType.toLowerCase()}s sur ${platform} (${costPerUnit} pts/u + ${durationFee} pts pour ${durationDays}j)`,
      },
      tx
    );

    // B. Création de la campagne
    const campaign = await tx.campaign.create({
      data: {
        id: campaignId,
        userId,
        socialAccountId,
        platform,
        actionType,
        videoUrl: cleanVideoUrl,
        commentTemplate: actionType === "COMMENT" ? commentTemplate?.trim() || null : null,
        totalQuantity,
        completedQuantity: 0,
        dailyCap,
        deliveredToday: 0,
        lastResetDailyCapAt: new Date(),
        costPerUnit,
        rewardPerUnit,
        totalCost,
        refundedPoints: 0.0,
        status: "ACTIVE",
      },
    });

    // C. Génération des slots de tâches associées
    const tasksData = Array.from({ length: totalQuantity }).map(() => ({
      campaignId: campaign.id,
      status: "AVAILABLE",
    }));

    await tx.task.createMany({
      data: tasksData,
    });

    // D. Journal d'audit
    await tx.auditLog.create({
      data: {
        actorId: userId,
        targetId: userId,
        action: "CAMPAIGN_CREATED",
        details: JSON.stringify({
          campaignId: campaign.id,
          platform,
          actionType,
          totalQuantity,
          totalCost,
          costPerUnit,
          dailyCap,
        }),
      },
    });

    return campaign;
  });
}

/**
 * Met en pause ou réactive une campagne
 */
export async function toggleCampaignStatus(campaignId: string, userId: string, newStatus: "ACTIVE" | "PAUSED") {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign || campaign.userId !== userId) {
    throw new Error("Campagne introuvable ou accès refusé.");
  }

  if (campaign.status === "COMPLETED" || campaign.status === "CANCELLED") {
    throw new Error(`Impossible de modifier une campagne ${campaign.status.toLowerCase()}.`);
  }

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: newStatus },
  });

  return updated;
}

/**
 * Annule une campagne et rembourse intégralement les points des tâches non consommées
 */
export async function cancelCampaign(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      tasks: {
        where: { status: "AVAILABLE" },
      },
    },
  });

  if (!campaign || campaign.userId !== userId) {
    throw new Error("Campagne introuvable ou accès refusé.");
  }

  if (campaign.status === "CANCELLED") {
    throw new Error("Cette campagne est déjà annulée.");
  }

  if (campaign.status === "COMPLETED") {
    throw new Error("Cette campagne est déjà terminée, aucun remboursement possible.");
  }

  // Calcul des tâches non consommées à rembourser
  const unconsumedCount = campaign.totalQuantity - campaign.completedQuantity;
  const refundAmount = Number((Math.max(0, unconsumedCount) * campaign.costPerUnit).toFixed(2));
  const refundIdempotencyKey = `campaign-refund-${campaignId}`;

  return prisma.$transaction(async (tx) => {
    // 1. Annulation de toutes les tâches disponibles restantes
    await tx.task.updateMany({
      where: {
        campaignId,
        status: "AVAILABLE",
      },
      data: {
        status: "CANCELLED",
      },
    });

    // 2. Mise à jour du statut de la campagne
    const updatedCampaign = await tx.campaign.update({
      where: { id: campaignId },
      data: {
        status: "CANCELLED",
        refundedPoints: refundAmount,
      },
    });

    // 3. Remboursement atomique des points au créateur via le Ledger
    if (refundAmount > 0) {
      await recordLedgerTransaction(
        {
          userId,
          amount: refundAmount,
          type: "CAMPAIGN_REFUND",
          referenceType: "CAMPAIGN",
          referenceId: campaignId,
          idempotencyKey: refundIdempotencyKey,
          description: `Remboursement de campagne annulée : ${unconsumedCount} action(s) non consommée(s) (${refundAmount} pts)`,
        },
        tx
      );
    }

    // 4. Journal d'audit
    await tx.auditLog.create({
      data: {
        actorId: userId,
        targetId: userId,
        action: "CAMPAIGN_CANCELLED",
        details: JSON.stringify({
          campaignId,
          unconsumedCount,
          refundAmount,
          totalQuantity: campaign.totalQuantity,
          completedQuantity: campaign.completedQuantity,
        }),
      },
    });

    return {
      campaign: updatedCampaign,
      unconsumedCount,
      refundAmount,
    };
  });
}

/**
 * Job de distribution progressive : réinitialise le compteur quotidien si 24h se sont écoulées
 */
export async function resetDailyCapsIfNeeded() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.campaign.updateMany({
    where: {
      status: "ACTIVE",
      lastResetDailyCapAt: { lt: oneDayAgo },
    },
    data: {
      deliveredToday: 0,
      lastResetDailyCapAt: new Date(),
    },
  });

  return result.count;
}
