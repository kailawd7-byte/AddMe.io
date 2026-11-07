import { prisma } from "./prisma.ts";
import { recordLedgerTransaction } from "./ledger.ts";
import { checkUserTaskEligibility, adjustReputationScore } from "./reputation.ts";
import { SYSTEM_DEFAULTS } from "./constants.ts";
import {
  captureBaselineSnapshot,
  encodeSnapshotMetadata,
  decodeSnapshotMetadata,
  verifyTaskActionWithBot,
} from "./action-verifier.ts";

export interface GetTasksFilter {
  platform?: "TIKTOK" | "YOUTUBE" | "INSTAGRAM";
  actionType?: "LIKE" | "COMMENT" | "SUBSCRIBE";
}

/**
 * Récupère les tâches disponibles pour un utilisateur, en excluant strictement ses propres publications,
 * les publications déjà effectuées (pour LIKE et SUBSCRIBE ; COMMENT autorisé plusieurs fois)
 * et renvoie également toute session IN_PROGRESS active pour restaurer le chronomètre de 10s.
 */
export async function getAvailableTasks(userId: string, filters: GetTasksFilter = {}) {
  // 0. Nettoyer automatiquement les sessions abandonnées depuis plus de 15 minutes
  await expireStaleTaskCompletions();

  // 1. Vérification de l'éligibilité de l'utilisateur
  const quota = await checkUserTaskEligibility(userId);
  if (!quota.isReputationHealthy) {
    throw new Error("Compte restreint : votre score de réputation est insuffisant (< 50) pour accomplir des tâches.");
  }

  // 1b. Récupérer la session en cours (IN_PROGRESS) de l'utilisateur s'il en a une
  const activeCompletion = await prisma.taskCompletion.findFirst({
    where: {
      workerUserId: userId,
      status: "IN_PROGRESS",
    },
    orderBy: { startedAt: "desc" },
    include: {
      task: {
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
      },
    },
  });

  let activeSession = null;
  if (activeCompletion && activeCompletion.task?.campaign) {
    const elapsedSeconds = Math.floor(
      (Date.now() - new Date(activeCompletion.startedAt).getTime()) / 1000
    );
    const secondsRemaining = Math.max(
      0,
      SYSTEM_DEFAULTS.MIN_TASK_DURATION_SECONDS - elapsedSeconds
    );

    activeSession = {
      completionId: activeCompletion.id,
      taskId: activeCompletion.taskId,
      campaignId: activeCompletion.task.campaignId,
      videoUrl: activeCompletion.task.campaign.videoUrl,
      platform: activeCompletion.task.campaign.platform,
      actionType: activeCompletion.task.campaign.actionType,
      commentTemplate: activeCompletion.task.campaign.commentTemplate,
      rewardPoints: activeCompletion.rewardPoints,
      targetHandle: activeCompletion.task.campaign.socialAccount.identifier,
      startedAt: activeCompletion.startedAt,
      minDurationSeconds: SYSTEM_DEFAULTS.MIN_TASK_DURATION_SECONDS,
      secondsRemaining,
      requiresScreenshot: activeCompletion.requiresScreenshot,
    };
  }

  // 2. Recherche des campagnes déjà complétées par l'utilisateur
  // - LIKE : 1 seule fois par publication (videoUrl / campaignId)
  // - SUBSCRIBE : 1 seule fois par compte/campagne (socialAccountId / campaignId)
  // - COMMENT : peut être effectué autant de fois qu'il reste des places disponibles
  const userCompletions = await prisma.taskCompletion.findMany({
    where: {
      workerUserId: userId,
      status: { in: ["PENDING_RETENTION", "APPROVED"] },
    },
    select: {
      task: {
        select: {
          campaignId: true,
          campaign: {
            select: {
              actionType: true,
              videoUrl: true,
              socialAccountId: true,
            },
          },
        },
      },
    },
  });

  const singleUseCampaignIds = new Set<string>();
  const likedVideoUrls = new Set<string>();
  const subscribedAccountIds = new Set<string>();

  for (const c of userCompletions) {
    const camp = c.task?.campaign;
    const campId = c.task?.campaignId;
    if (!camp || !campId) continue;

    if (camp.actionType === "LIKE") {
      singleUseCampaignIds.add(campId);
      if (camp.videoUrl) likedVideoUrls.add(camp.videoUrl);
    } else if (camp.actionType === "SUBSCRIBE") {
      singleUseCampaignIds.add(campId);
      if (camp.socialAccountId) subscribedAccountIds.add(camp.socialAccountId);
    }
    // Pour COMMENT : non ajouté à singleUseCampaignIds (peut être refait tant qu'il reste des places)
  }

  const alreadyParticipatedCampaignIds = Array.from(singleUseCampaignIds);

  // 3. Critères de sélection des tâches disponibles
  const whereClause: any = {
    status: "AVAILABLE",
    campaign: {
      status: "ACTIVE",
      userId: { not: userId }, // Interdiction formelle d'interagir avec ses propres publications
      ...(alreadyParticipatedCampaignIds.length > 0
        ? { id: { notIn: alreadyParticipatedCampaignIds } }
        : {}),
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
  // et appliquer l'unicité par videoUrl (LIKE) et socialAccountId (SUBSCRIBE)
  const filteredTasks = availableTasks.filter((t) => {
    if (t.campaign.deliveredToday >= t.campaign.dailyCap) return false;
    if (t.campaign.actionType === "LIKE" && likedVideoUrls.has(t.campaign.videoUrl)) {
      return false;
    }
    if (
      t.campaign.actionType === "SUBSCRIBE" &&
      subscribedAccountIds.has(t.campaign.socialAccountId)
    ) {
      return false;
    }
    return true;
  });

  // Dédoublonner par campagne pour afficher UNE SEULE carte par vidéo/publication
  const campaignsMap = new Map<string, (typeof availableTasks)[0] & { totalAvailableSlots: number }>();
  for (const t of filteredTasks) {
    if (!campaignsMap.has(t.campaignId)) {
      campaignsMap.set(t.campaignId, { ...t, totalAvailableSlots: 1 });
    } else {
      campaignsMap.get(t.campaignId)!.totalAvailableSlots += 1;
    }
  }

  const uniqueTasks = Array.from(campaignsMap.values());

  return {
    quota,
    activeSession,
    tasks: uniqueTasks.map((t) => ({
      taskId: t.id,
      campaignId: t.campaign.id,
      platform: t.campaign.platform,
      actionType: t.campaign.actionType,
      videoUrl: t.campaign.videoUrl,
      commentTemplate: t.campaign.commentTemplate,
      rewardPoints: t.campaign.rewardPerUnit,
      targetHandle: t.campaign.socialAccount.identifier,
      totalQuantity: t.campaign.totalQuantity,
      completedQuantity: t.campaign.completedQuantity,
      remainingSlots: t.totalAvailableSlots,
      createdAt: t.createdAt,
    })),
  };
}

/**
 * Démarre une tâche : réserve le slot, lance le chronomètre de 10 secondes.
 * Si l'utilisateur avait déjà la même tâche en cours, lui renvoie sa session active au lieu de bloquer.
 * S'il avait une autre tâche abandonnée en cours, libère l'ancienne et démarre la nouvelle.
 */
export async function startTask(
  taskId: string,
  userId: string,
  clientInfo: { ip?: string; userAgent?: string } = {}
) {
  await expireStaleTaskCompletions();

  const quota = await checkUserTaskEligibility(userId);
  if (!quota.canCompleteMoreTasks) {
    throw new Error(
      `Plafond quotidien atteint (${quota.dailyTasksCompleted}/${quota.dailyTaskLimit}). Revenez demain pour accomplir de nouvelles tâches.`
    );
  }

  let requestedTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      campaign: {
        include: {
          socialAccount: {
            select: { platform: true, identifier: true },
          },
        },
      },
    },
  });

  if (!requestedTask) {
    throw new Error("Cette tâche est introuvable.");
  }

  if (requestedTask.campaign.userId === userId) {
    throw new Error("Vous ne pouvez pas effectuer de tâche sur votre propre publication.");
  }

  if (requestedTask.campaign.status !== "ACTIVE") {
    throw new Error("La campagne associée à cette tâche n'est pas active.");
  }

  // Vérifier si l'utilisateur a déjà une tâche IN_PROGRESS
  const existingActiveCompletion = await prisma.taskCompletion.findFirst({
    where: {
      workerUserId: userId,
      status: "IN_PROGRESS",
    },
    include: {
      task: {
        include: {
          campaign: {
            include: {
              socialAccount: {
                select: { platform: true, identifier: true },
              },
            },
          },
        },
      },
    },
  });

  if (existingActiveCompletion) {
    // S'il reclique sur la même tâche ou la même campagne, on lui restaure directement son chronomètre !
    if (
      existingActiveCompletion.taskId === taskId ||
      existingActiveCompletion.task?.campaignId === requestedTask.campaignId
    ) {
      if (!decodeSnapshotMetadata(existingActiveCompletion.screenshotUrl)) {
        const snap = await captureBaselineSnapshot(
          existingActiveCompletion.task.campaign.platform,
          existingActiveCompletion.task.campaign.actionType,
          existingActiveCompletion.task.campaign.videoUrl,
          existingActiveCompletion.task.campaign.socialAccount.identifier
        );
        await prisma.taskCompletion.update({
          where: { id: existingActiveCompletion.id },
          data: { screenshotUrl: encodeSnapshotMetadata(snap) },
        });
      }

      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(existingActiveCompletion.startedAt).getTime()) / 1000
      );
      const secondsRemaining = Math.max(
        0,
        SYSTEM_DEFAULTS.MIN_TASK_DURATION_SECONDS - elapsedSeconds
      );

      return {
        completionId: existingActiveCompletion.id,
        taskId: existingActiveCompletion.taskId,
        campaignId: existingActiveCompletion.task.campaignId,
        videoUrl: existingActiveCompletion.task.campaign.videoUrl,
        platform: existingActiveCompletion.task.campaign.platform,
        actionType: existingActiveCompletion.task.campaign.actionType,
        commentTemplate: existingActiveCompletion.task.campaign.commentTemplate,
        rewardPoints: existingActiveCompletion.rewardPoints,
        targetHandle: existingActiveCompletion.task.campaign.socialAccount.identifier,
        startedAt: existingActiveCompletion.startedAt,
        minDurationSeconds: SYSTEM_DEFAULTS.MIN_TASK_DURATION_SECONDS,
        secondsRemaining,
        requiresScreenshot: existingActiveCompletion.requiresScreenshot,
      };
    }

    // S'il démarre une autre tâche, on libère automatiquement l'ancienne tâche abandonnée
    await prisma.$transaction(async (tx) => {
      await tx.taskCompletion.update({
        where: { id: existingActiveCompletion.id },
        data: { status: "REJECTED" },
      });
      await tx.task.update({
        where: { id: existingActiveCompletion.taskId },
        data: { status: "AVAILABLE" },
      });
    });
  }

  // Si le slot précis demandé a été pris entre-temps, chercher un autre slot disponible de la même campagne
  if (requestedTask.status !== "AVAILABLE") {
    const alternativeTask = await prisma.task.findFirst({
      where: {
        campaignId: requestedTask.campaignId,
        status: "AVAILABLE",
      },
      include: {
        campaign: {
          include: {
            socialAccount: {
              select: { platform: true, identifier: true },
            },
          },
        },
      },
    });

    if (!alternativeTask) {
      throw new Error("Cette tâche n'est plus disponible.");
    }
    requestedTask = alternativeTask;
  }

  const targetTask = requestedTask;
  const requiresScreenshot = false;

  // Capture par le Robot AddMe des compteurs en direct AVANT l'action (Likes, Commentaires, Abonnés)
  const baselineSnapshot = await captureBaselineSnapshot(
    targetTask.campaign.platform,
    targetTask.campaign.actionType,
    targetTask.campaign.videoUrl,
    targetTask.campaign.socialAccount.identifier
  );

  // Création atomique de la completion et réservation de la tâche
  const completion = await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: targetTask.id },
      data: { status: "IN_PROGRESS" },
    });

    return tx.taskCompletion.create({
      data: {
        taskId: targetTask.id,
        workerUserId: userId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        requiresScreenshot,
        screenshotUrl: encodeSnapshotMetadata(baselineSnapshot),
        rewardPoints: targetTask.campaign.rewardPerUnit,
        ipAddress: clientInfo.ip || null,
        userAgent: clientInfo.userAgent?.slice(0, 255) || null,
      },
    });
  });

  return {
    completionId: completion.id,
    taskId: targetTask.id,
    campaignId: targetTask.campaignId,
    videoUrl: targetTask.campaign.videoUrl,
    platform: targetTask.campaign.platform,
    actionType: targetTask.campaign.actionType,
    commentTemplate: targetTask.campaign.commentTemplate,
    rewardPoints: completion.rewardPoints,
    targetHandle: targetTask.campaign.socialAccount.identifier,
    startedAt: completion.startedAt,
    minDurationSeconds: SYSTEM_DEFAULTS.MIN_TASK_DURATION_SECONDS, // 20s
    secondsRemaining: SYSTEM_DEFAULTS.MIN_TASK_DURATION_SECONDS,
    requiresScreenshot,
  };
}

/**
 * Annule une tâche en cours (IN_PROGRESS) et remet le slot en statut AVAILABLE
 */
export async function cancelTaskCompletion(completionId: string, userId: string) {
  const completion = await prisma.taskCompletion.findUnique({
    where: { id: completionId },
  });

  if (!completion || completion.workerUserId !== userId) {
    throw new Error("Session de tâche introuvable.");
  }

  if (completion.status !== "IN_PROGRESS") {
    return { cancelled: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.taskCompletion.update({
      where: { id: completionId },
      data: { status: "REJECTED" },
    });
    await tx.task.update({
      where: { id: completion.taskId },
      data: { status: "AVAILABLE" },
    });
  });

  return { cancelled: true };
}

/**
 * Valide l'accomplissement d'une tâche (contrôle du timer 20s + Robot de vérification d'action en direct).
 */
export async function submitTaskCompletion(
  completionId: string,
  userId: string,
  payload: { screenshotUrl?: string; externalTimeSpentSeconds?: number } = {}
) {
  const completion = await prisma.taskCompletion.findUnique({
    where: { id: completionId },
    include: {
      task: {
        include: {
          campaign: {
            include: {
              socialAccount: {
                select: { platform: true, identifier: true },
              },
            },
          },
        },
      },
    },
  });

  if (!completion || completion.workerUserId !== userId) {
    throw new Error("Session de tâche introuvable ou accès refusé.");
  }

  if (completion.status !== "IN_PROGRESS") {
    throw new Error(`Cette tâche a déjà été soumise (statut : ${completion.status}).`);
  }

  // 1. Contrôle strict de la durée minimale (20 secondes) côté serveur
  const elapsedMs = Date.now() - new Date(completion.startedAt).getTime();
  const minRequiredMs = (SYSTEM_DEFAULTS.MIN_TASK_DURATION_SECONDS - 0.5) * 1000; // Marge réseau de 500ms

  if (elapsedMs < minRequiredMs) {
    const elapsedSeconds = (elapsedMs / 1000).toFixed(1);
    throw new Error(
      `DURÉE_INSUFFISANTE: Vous devez rester sur la publication au moins ${SYSTEM_DEFAULTS.MIN_TASK_DURATION_SECONDS} secondes (temps écoulé : ${elapsedSeconds} s).`
    );
  }

  // 2. Contrôle de la capture d'écran si demandée
  if (completion.requiresScreenshot && !payload.screenshotUrl?.trim()) {
    throw new Error(
      "CAPTURE_REQUISE: Cette tâche fait l'objet d'un contrôle de conformité. Veuillez fournir une capture d'écran prouvant l'action effectuée."
    );
  }

  // 3. Vérification en temps réel par le Robot Anti-Fraude AddMe (comparaison des compteurs Avant / Après)
  const baselineSnapshot = decodeSnapshotMetadata(completion.screenshotUrl);
  const botVerification = await verifyTaskActionWithBot({
    platform: completion.task.campaign.platform,
    actionType: completion.task.campaign.actionType,
    videoUrl: completion.task.campaign.videoUrl,
    targetHandle: completion.task.campaign.socialAccount.identifier,
    baselineSnapshot,
    externalTimeSpentSeconds: payload.externalTimeSpentSeconds,
  });

  if (!botVerification.verified) {
    throw new Error(
      botVerification.reason ||
        "🤖 Robot de vérification AddMe : Action non détectée sur la publication. Veuillez réellement effectuer l'action avant de valider."
    );
  }

  // 4. Validation atomique et crédit direct en base de données
  const updated = await prisma.$transaction(async (tx) => {
    // A. Crédit direct des points au Ledger du travailleur (Idempotent)
    const idempotencyKey = `task-reward-${completion.id}`;
    await recordLedgerTransaction(
      {
        userId,
        amount: completion.rewardPoints,
        type: "TASK_REWARD",
        referenceType: "TASK_COMPLETION",
        referenceId: completion.id,
        idempotencyKey,
        description: `Récompense vérifiée par Robot : ${completion.task.campaign.actionType.toLowerCase()} sur ${completion.task.campaign.platform} (@${completion.task.campaign.socialAccount.identifier})`,
      },
      tx
    );

    // B. Mise à jour de la completion en statut APPROUVÉ (sans attente 24h)
    const updatedComp = await tx.taskCompletion.update({
      where: { id: completionId },
      data: {
        status: "APPROVED",
        submittedAt: new Date(),
        retentionEndsAt: new Date(),
        screenshotUrl:
          payload.screenshotUrl?.trim() ||
          `VERIFIED:${botVerification.source}:${botVerification.beforeCount ?? "?"}->${botVerification.afterCount ?? "ok"}`,
      },
    });

    // C. Finalisation de la tâche
    await tx.task.update({
      where: { id: completion.taskId },
      data: { status: "COMPLETED" },
    });

    // D. Incrémentation des compteurs de la campagne
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

    // E. Incrémentation du quota quotidien du travailleur
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
    message: `🤖 Action vérifiée par le robot ! +${completion.rewardPoints} points ont été directement crédités à votre solde !`,
    status: updated.status,
    completionId: updated.id,
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
