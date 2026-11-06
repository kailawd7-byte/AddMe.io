import { prisma } from "./prisma.ts";
import { recordLedgerTransaction } from "./ledger.ts";
import { checkUserTaskEligibility, adjustReputationScore } from "./reputation.ts";
import { SYSTEM_DEFAULTS } from "./constants.ts";

export interface GetTasksFilter {
  platform?: "TIKTOK" | "YOUTUBE";
  actionType?: "LIKE" | "COMMENT" | "SUBSCRIBE";
}

/**
 * Récupère les tâches disponibles pour un utilisateur, en excluant strictement ses propres publications,
 * les publications déjà effectuées et en respectant les plafonds quotidiens.
 */
export async function getAvailableTasks(userId: string, filters: GetTasksFilter = {}) {
  // 1. Vérification de l'éligibilité de l'utilisateur
  const quota = await checkUserTaskEligibility(userId);
  if (!quota.isReputationHealthy) {
    throw new Error("Compte restreint : votre score de réputation est insuffisant (< 50) pour accomplir des tâches.");
  }

  // 2. Recherche des campagnes dont l'utilisateur a déjà complété ou démarré une tâche
  const userCompletions = await prisma.taskCompletion.findMany({
    where: {
      workerUserId: userId,
      status: { in: ["IN_PROGRESS", "PENDING_RETENTION", "APPROVED"] },
    },
    select: {
      task: {
        select: { campaignId: true },
      },
    },
  });

  const alreadyParticipatedCampaignIds = userCompletions
    .map((c) => c.task?.campaignId)
    .filter(Boolean) as string[];

  // 3. Critères de sélection des tâches disponibles
  const whereClause: any = {
    status: "AVAILABLE",
    campaign: {
      status: "ACTIVE",
      userId: { not: userId }, // Interdiction formelle d'interagir avec ses propres publications
      id: { notIn: alreadyParticipatedCampaignIds }, // Pas deux fois la même publication
    },
  };

  if (filters.platform) {
    whereClause.campaign.platform = filters.platform;
  }
  if (filters.actionType) {
    whereClause.campaign.actionType = filters.actionType;
  }

  // 4. Récupération des tâches
  const availableTasks = await prisma.task.findMany({
    where: whereClause,
    take: 40,
    orderBy: { createdAt: "desc" },
    include: {
      campaign: {
        include: {
          socialAccount: {
            select: {
              platform: true,
              identifier: true,
            },
          },
        },
      },
    },
  });

  // Filtrer celles dont le dailyCap de la campagne est déjà atteint aujourd'hui
  const filteredTasks = availableTasks.filter(
    (t) => t.campaign.deliveredToday < t.campaign.dailyCap
  );

  return {
    quota,
    tasks: filteredTasks.map((t) => ({
      taskId: t.id,
      campaignId: t.campaign.id,
      platform: t.campaign.platform,
      actionType: t.campaign.actionType,
      videoUrl: t.campaign.videoUrl,
      commentTemplate: t.campaign.commentTemplate,
      rewardPoints: t.campaign.rewardPerUnit,
      targetHandle: t.campaign.socialAccount.identifier,
      createdAt: t.createdAt,
    })),
  };
}

/**
 * Démarre une tâche : réserve le slot, lance le chronomètre et détermine si un contrôle aléatoire (10%) avec capture s'applique.
 */
export async function startTask(
  taskId: string,
  userId: string,
  clientInfo: { ip?: string; userAgent?: string } = {}
) {
  const quota = await checkUserTaskEligibility(userId);
  if (!quota.canCompleteMoreTasks) {
    throw new Error(
      `Plafond quotidien atteint (${quota.dailyTasksCompleted}/${quota.dailyTaskLimit}). Revenez demain pour accomplir de nouvelles tâches.`
    );
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { campaign: true },
  });

  if (!task || task.status !== "AVAILABLE") {
    throw new Error("Cette tâche n'est plus disponible.");
  }

  if (task.campaign.userId === userId) {
    throw new Error("Vous ne pouvez pas effectuer de tâche sur votre propre publication.");
  }

  if (task.campaign.status !== "ACTIVE") {
    throw new Error("La campagne associée à cette tâche n'est pas active.");
  }

  // Contrôle aléatoire : 10% des tâches requièrent une capture d'écran
  const requiresScreenshot = Math.random() < SYSTEM_DEFAULTS.RANDOM_AUDIT_SAMPLE_RATE;

  // Création atomique de la completion et réservation de la tâche
  const completion = await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS" },
    });

    return tx.taskCompletion.create({
      data: {
        taskId,
        workerUserId: userId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        requiresScreenshot,
        rewardPoints: task.campaign.rewardPerUnit,
        ipAddress: clientInfo.ip || null,
        userAgent: clientInfo.userAgent?.slice(0, 255) || null,
      },
    });
  });

  return {
    completionId: completion.id,
    taskId,
    videoUrl: task.campaign.videoUrl,
    platform: task.campaign.platform,
    actionType: task.campaign.actionType,
    commentTemplate: task.campaign.commentTemplate,
    rewardPoints: completion.rewardPoints,
    startedAt: completion.startedAt,
    minDurationSeconds: SYSTEM_DEFAULTS.MIN_TASK_DURATION_SECONDS, // 10s
    requiresScreenshot,
  };
}

/**
 * Valide l'accomplissement d'une tâche (contrôle du timer 10s, capture d'écran si requise, mise en séquestre 24h).
 */
export async function submitTaskCompletion(
  completionId: string,
  userId: string,
  payload: { screenshotUrl?: string } = {}
) {
  const completion = await prisma.taskCompletion.findUnique({
    where: { id: completionId },
    include: {
      task: {
        include: { campaign: true },
      },
    },
  });

  if (!completion || completion.workerUserId !== userId) {
    throw new Error("Session de tâche introuvable ou accès refusé.");
  }

  if (completion.status !== "IN_PROGRESS") {
    throw new Error(`Cette tâche a déjà été soumise (statut : ${completion.status}).`);
  }

  // 1. Contrôle strict de la durée minimale (10 secondes) côté serveur
  const elapsedMs = Date.now() - new Date(completion.startedAt).getTime();
  const minRequiredMs = (SYSTEM_DEFAULTS.MIN_TASK_DURATION_SECONDS - 0.5) * 1000; // Marge réseau de 500ms

  if (elapsedMs < minRequiredMs) {
    const elapsedSeconds = (elapsedMs / 1000).toFixed(1);
    throw new Error(
      `DURÉE_INSUFFISANTE: Vous devez visionner la publication au moins 10 secondes (temps écoulé : ${elapsedSeconds} s).`
    );
  }

  // 2. Contrôle de la capture d'écran si demandée
  if (completion.requiresScreenshot && !payload.screenshotUrl?.trim()) {
    throw new Error(
      "CAPTURE_REQUISE: Cette tâche fait l'objet d'un contrôle de conformité. Veuillez fournir une capture d'écran prouvant l'action effectuée."
    );
  }

  // 3. Calcul de la fin de la période de rétention (24 heures)
  const retentionHours = SYSTEM_DEFAULTS.RETENTION_PERIOD_HOURS; // 24
  const retentionEndsAt = new Date(Date.now() + retentionHours * 60 * 60 * 1000);

  // 4. Validation atomique en base de données
  const updated = await prisma.$transaction(async (tx) => {
    // A. Mise à jour de la completion
    const updatedComp = await tx.taskCompletion.update({
      where: { id: completionId },
      data: {
        status: "PENDING_RETENTION",
        submittedAt: new Date(),
        retentionEndsAt,
        screenshotUrl: payload.screenshotUrl?.trim() || null,
      },
    });

    // B. Finalisation de la tâche
    await tx.task.update({
      where: { id: completion.taskId },
      data: { status: "COMPLETED" },
    });

    // C. Incrémentation des compteurs de la campagne
    const campaign = completion.task.campaign;
    const newCompleted = campaign.completedQuantity + 1;
    const isCompleted = newCompleted >= campaign.totalQuantity;

    await tx.campaign.update({
      where: { id: campaign.id },
      data: {
        completedQuantity: { increment: 1 },
        deliveredToday: { increment: 1 },
        status: isCompleted ? "COMPLETED" : campaign.status,
      },
    });

    // D. Incrémentation du quota quotidien du travailleur
    await tx.user.update({
      where: { id: userId },
      data: {
        dailyTasksCompleted: { increment: 1 },
        lastTaskDate: new Date(),
      },
    });

    return updatedComp;
  });

  return {
    success: true,
    message: `Tâche validée avec succès ! ${completion.rewardPoints} points ont été placés en rétention pour 24 heures et seront crédités automatiquement à votre solde.`,
    status: updated.status,
    completionId: updated.id,
    retentionEndsAt,
    rewardPoints: completion.rewardPoints,
  };
}

/**
 * Permet au propriétaire d'une campagne de signaler une tâche non effectuée ou frauduleuse
 */
export async function reportTaskCompletion(
  completionId: string,
  reporterUserId: string,
  reason: string
) {
  if (!reason || reason.trim().length < 5) {
    throw new Error("Veuillez indiquer un motif précis pour votre signalement (au moins 5 caractères).");
  }

  const completion = await prisma.taskCompletion.findUnique({
    where: { id: completionId },
    include: {
      task: {
        include: { campaign: true },
      },
    },
  });

  if (!completion) {
    throw new Error("Exécution de tâche introuvable.");
  }

  // Seul le propriétaire de la campagne ciblée peut émettre un signalement
  if (completion.task.campaign.userId !== reporterUserId) {
    throw new Error("Seul le créateur de la campagne est autorisé à signaler cette tâche.");
  }

  // Création du signalement et passage en statut FLAGGED
  return prisma.$transaction(async (tx) => {
    await tx.taskCompletion.update({
      where: { id: completionId },
      data: { status: "FLAGGED" },
    });

    const report = await tx.report.create({
      data: {
        campaignId: completion.task.campaign.id,
        taskCompletionId: completion.id,
        reporterUserId,
        reportedUserId: completion.workerUserId,
        reason: reason.trim(),
        status: "PENDING",
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: reporterUserId,
        targetId: completion.workerUserId,
        action: "TASK_REPORTED",
        details: JSON.stringify({
          completionId,
          campaignId: completion.task.campaign.id,
          reason,
        }),
      },
    });

    return report;
  });
}

/**
 * Job d'arrière-plan : Libère les points séquestrés après la période de rétention de 24h
 * si aucun litige n'est en cours.
 */
export async function processRetentionReleases() {
  const now = new Date();

  // Recherche des completions arrivées au terme des 24h sans signalement
  const eligibleCompletions = await prisma.taskCompletion.findMany({
    where: {
      status: "PENDING_RETENTION",
      retentionEndsAt: { lte: now },
      reports: {
        none: { status: "PENDING" }, // Aucun signalement en attente
      },
    },
    take: 100,
  });

  let creditedCount = 0;

  for (const comp of eligibleCompletions) {
    try {
      const idempotencyKey = `task-reward-${comp.id}`;

      await prisma.$transaction(async (tx) => {
        // 1. Passage au statut APPROVED
        await tx.taskCompletion.update({
          where: { id: comp.id },
          data: { status: "APPROVED" },
        });

        // 2. Crédit atomique des points au travailleur via le Ledger
        await recordLedgerTransaction(
          {
            userId: comp.workerUserId,
            amount: comp.rewardPoints,
            type: "TASK_REWARD",
            referenceType: "TASK_COMPLETION",
            referenceId: comp.id,
            idempotencyKey,
            description: `Gain de tâche validée : +${comp.rewardPoints} points débloqués post-rétention`,
          },
          tx
        );

        // 3. Récompense de conformité : +0.2 points de réputation
        await adjustReputationScore(
          comp.workerUserId,
          0.2,
          `Tâche ${comp.id} validée sans contestation`,
          tx
        );
      });

      creditedCount++;
    } catch (err) {
      console.error(`Erreur libération rétention completion ${comp.id}:`, err);
    }
  }

  return {
    releasedCount: creditedCount,
    releasedCompletions: eligibleCompletions.map((c) => ({
      completionId: c.id,
      workerUserId: c.workerUserId,
      rewardPoints: c.rewardPoints,
    })),
  };
}

/**
 * Job d'arrière-plan : Expire les tâches démarrées et abandonnées depuis plus de 15 minutes
 */
export async function expireStaleTaskCompletions() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const staleCompletions = await prisma.taskCompletion.findMany({
    where: {
      status: "IN_PROGRESS",
      startedAt: { lt: fifteenMinutesAgo },
    },
    select: { id: true, taskId: true },
  });

  let expiredCount = 0;

  for (const sc of staleCompletions) {
    try {
      await prisma.$transaction(async (tx) => {
        // Rejette l'assignation expirée
        await tx.taskCompletion.update({
          where: { id: sc.id },
          data: { status: "REJECTED" },
        });

        // Remet la tâche à disposition des autres utilisateurs
        await tx.task.update({
          where: { id: sc.taskId },
          data: { status: "AVAILABLE" },
        });
      });
      expiredCount++;
    } catch (err) {
      console.error(`Erreur expiration tâche ${sc.id}:`, err);
    }
  }

  return expiredCount;
}
