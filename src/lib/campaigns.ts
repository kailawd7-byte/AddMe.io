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

  // 1. Quantité requise (minimum 1 personne par campagne)
  if (!totalQuantity || totalQuantity < 1) {
    throw new Error("Le nombre de personnes souhaitées doit être d'au moins 1.");
  }
  if (totalQuantity > 100000) {
    throw new Error("Le volume maximal par campagne est de 100 000 personnes.");
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
 * Modifie les paramètres d'une campagne active ou en pause (points par action, volume, rythme).
 * Ajuste atomiquement le Ledger (débit ou remboursement) et les tâches disponibles.
 */
export interface UpdateCampaignInput {
  rewardPerWorker?: number;
  totalQuantity?: number;
  dailyCap?: number;
  commentTemplate?: string;
}

export async function updateCampaign(
  campaignId: string,
  userId: string,
  input: UpdateCampaignInput
) {
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

  if (campaign.status === "COMPLETED" || campaign.status === "CANCELLED") {
    throw new Error(`Impossible de modifier une campagne ${campaign.status.toLowerCase()}.`);
  }

  const completedQuantity = campaign.completedQuantity || 0;
  const currentAvailableTasks = campaign.tasks.length;

  // Nouvelle quantité totale souhaitée (doit être >= completedQuantity et >= 1)
  const newTotalQuantity =
    input.totalQuantity !== undefined
      ? Math.max(completedQuantity, Math.max(1, input.totalQuantity))
      : campaign.totalQuantity;

  // Nouvelle rémunération par action (minimum 0.5 pt)
  const newRewardPerUnit =
    input.rewardPerWorker !== undefined && input.rewardPerWorker >= 0.5
      ? Number(input.rewardPerWorker.toFixed(1))
      : campaign.rewardPerUnit;

  // Actions restantes à exécuter
  const remainingQuantity = Math.max(0, newTotalQuantity - completedQuantity);
  const oldRemainingQuantity = Math.max(0, campaign.totalQuantity - completedQuantity);

  const oldRemainingCost = Number((oldRemainingQuantity * campaign.rewardPerUnit).toFixed(2));
  const newRemainingCost = Number((remainingQuantity * newRewardPerUnit).toFixed(2));
  const difference = Number((newRemainingCost - oldRemainingCost).toFixed(2));

  // Si différence positive, vérification préalable du solde de l'utilisateur
  if (difference > 0) {
    const userBalance = await getUserBalance(userId);
    if (userBalance < difference) {
      throw new Error(
        `SOLDE_INSUFFISANT: Solde actuel (${userBalance.toFixed(
          1
        )} pts) insuffisant pour couvrir l'augmentation de budget (+${difference} pts requis).`
      );
    }
  }

  const newDailyCap =
    input.dailyCap !== undefined
      ? Math.max(1, input.dailyCap)
      : campaign.dailyCap;

  const editIdempotencyKey = `campaign-edit-${campaignId}-${Date.now()}`;

  return prisma.$transaction(async (tx) => {
    // A. Ajustement financier
    if (difference > 0) {
      // Débit supplémentaire
      await recordLedgerTransaction(
        {
          userId,
          amount: -difference,
          type: "CAMPAIGN_DEBIT",
          referenceType: "CAMPAIGN",
          referenceId: campaignId,
          idempotencyKey: editIdempotencyKey,
          description: `Modification de campagne #${campaignId.slice(
            0,
            8
          )} : Augmentation du budget (+${difference} pts)`,
        },
        tx
      );
    } else if (difference < 0) {
      // Remboursement de la baisse de budget
      const refundAmount = Math.abs(difference);
      await recordLedgerTransaction(
        {
          userId,
          amount: refundAmount,
          type: "CAMPAIGN_REFUND",
          referenceType: "CAMPAIGN",
          referenceId: campaignId,
          idempotencyKey: editIdempotencyKey,
          description: `Modification de campagne #${campaignId.slice(
            0,
            8
          )} : Baisse de budget remboursée (+${refundAmount} pts)`,
        },
        tx
      );
    }

    // B. Ajustement du nombre de tâches disponibles
    if (remainingQuantity > currentAvailableTasks) {
      // Créer les tâches manquantes
      const neededTasksCount = remainingQuantity - currentAvailableTasks;
      const newTasksData = Array.from({ length: neededTasksCount }).map(() => ({
        campaignId,
        status: "AVAILABLE",
      }));
      await tx.task.createMany({ data: newTasksData });
    } else if (remainingQuantity < currentAvailableTasks) {
      // Annuler le surplus de tâches disponibles
      const excessCount = currentAvailableTasks - remainingQuantity;
      const tasksToCancel = campaign.tasks.slice(0, excessCount).map((t) => t.id);
      if (tasksToCancel.length > 0) {
        await tx.task.updateMany({
          where: { id: { in: tasksToCancel } },
          data: { status: "CANCELLED" },
        });
      }
    }

    // C. Mettre à jour la campagne
    const updatedCampaign = await tx.campaign.update({
      where: { id: campaignId },
      data: {
        totalQuantity: newTotalQuantity,
        rewardPerUnit: newRewardPerUnit,
        costPerUnit: newRewardPerUnit,
        totalCost: Number((campaign.totalCost + difference).toFixed(2)),
        dailyCap: newDailyCap,
        commentTemplate: input.commentTemplate ?? campaign.commentTemplate,
      },
      include: {
        socialAccount: true,
      },
    });

    return {
      campaign: updatedCampaign,
      difference,
    };
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

  return prisma.$transaction(async (tx) => {
    // 1. Compter et annuler strictement les tâches réellement disponibles (non engagées auprès d'un travailleur)
    const availableCount = await tx.task.count({
      where: {
        campaignId,
        status: "AVAILABLE",
      },
    });

    const unconsumedCount = availableCount;
    const refundAmount = Number((availableCount * campaign.costPerUnit).toFixed(2));
    const refundIdempotencyKey = `campaign-refund-${campaignId}`;

    // Annulation des tâches disponibles
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
          description: `Remboursement de campagne annulée : ${availableCount} action(s) non consommée(s) (${refundAmount} pts)`,
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
