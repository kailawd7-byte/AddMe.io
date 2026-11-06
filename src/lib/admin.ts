import { prisma } from "./prisma.ts";
import { recordLedgerTransaction, getUserBalance } from "./ledger.ts";
import { adjustReputationScore } from "./reputation.ts";
import { SYSTEM_DEFAULTS } from "./constants.ts";

/**
 * Récupère les métriques clés pour le tableau de bord d'administration
 */
export async function getAdminDashboardStats() {
  const [
    totalUsers,
    activeCampaigns,
    pendingSocialVerifications,
    pendingReports,
    totalLedgerEntries,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.socialAccount.count({ where: { status: "PENDING_VERIFICATION" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.ledgerEntry.count(),
  ]);

  // Volume global de points en circulation
  const pointsAggregate = await prisma.ledgerEntry.aggregate({
    _sum: { amount: true },
  });
  const circulatingPoints = pointsAggregate._sum.amount ?? 0;

  return {
    totalUsers,
    activeCampaigns,
    pendingSocialVerifications,
    pendingReports,
    totalLedgerEntries,
    circulatingPoints: Number(circulatingPoints.toFixed(1)),
  };
}

/**
 * Récupère la liste des utilisateurs avec leurs métriques
 */
export async function getAdminUsersList(options: { search?: string; status?: string } = {}) {
  const where: any = {};
  if (options.status) {
    where.status = options.status;
  }
  if (options.search) {
    where.email = { contains: options.search.toLowerCase() };
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      isEmailVerified: true,
      reputationScore: true,
      dailyTasksCompleted: true,
      createdAt: true,
      _count: {
        select: {
          campaigns: true,
          taskCompletions: true,
          socialAccounts: true,
        },
      },
    },
    take: 50,
  });

  // Calcul du solde pour chaque utilisateur
  const usersWithBalance = await Promise.all(
    users.map(async (u) => {
      const balance = await getUserBalance(u.id);
      return {
        ...u,
        balance,
      };
    })
  );

  return usersWithBalance;
}

/**
 * Modifie le statut d'un utilisateur (ACTIVE, SUSPENDED, BANNED)
 */
export async function updateAdminUserStatus(
  adminId: string,
  targetUserId: string,
  newStatus: "ACTIVE" | "SUSPENDED" | "BANNED",
  reason: string
) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    throw new Error("Utilisateur introuvable.");
  }

  if (user.role === "ADMIN" && newStatus !== "ACTIVE") {
    throw new Error("Impossible de restreindre le compte d'un administrateur.");
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: newStatus },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      targetId: targetUserId,
      action: `USER_STATUS_${newStatus}`,
      details: JSON.stringify({
        previousStatus: user.status,
        newStatus,
        reason,
      }),
    },
  });

  return updated;
}

/**
 * Ajuste manuellement les points d'un utilisateur avec traçabilité et journal d'audit
 */
export async function adjustUserPointsManually(
  adminId: string,
  targetUserId: string,
  amount: number,
  reason: string
) {
  if (!reason || reason.trim().length < 5) {
    throw new Error("Veuillez indiquer un motif précis d'au moins 5 caractères pour cet ajustement.");
  }

  if (amount === 0) {
    throw new Error("Le montant d'ajustement ne peut pas être nul.");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error("Utilisateur cible introuvable.");
  }

  const idempotencyKey = `admin-adjust-${targetUserId}-${Date.now()}`;

  const txResult = await prisma.$transaction(async (tx) => {
    // 1. Écriture atomique dans le ledger
    const ledgerTx = await recordLedgerTransaction(
      {
        userId: targetUserId,
        amount,
        type: "ADMIN_ADJUSTMENT",
        referenceType: "AUDIT",
        idempotencyKey,
        description: `Ajustement administratif : ${amount > 0 ? "+" : ""}${amount} pts (${reason})`,
      },
      tx
    );

    // 2. Journal d'audit
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        targetId: targetUserId,
        action: "ADMIN_POINTS_ADJUSTMENT",
        details: JSON.stringify({
          amount,
          reason,
          newBalance: ledgerTx.balance,
          ledgerEntryId: ledgerTx.entry.id,
        }),
      },
    });

    return ledgerTx;
  });

  return txResult;
}

/**
 * Récupère les comptes sociaux en attente de vérification
 */
export async function getPendingSocialAccounts() {
  return await prisma.socialAccount.findMany({
    where: { status: "PENDING_VERIFICATION" },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          reputationScore: true,
        },
      },
    },
  });
}

/**
 * Modère manuellement un compte social (Validation ou Rejet)
 */
export async function moderateSocialAccount(
  adminId: string,
  socialAccountId: string,
  decision: "VERIFY" | "REJECT",
  notes?: string
) {
  const account = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
  });

  if (!account) {
    throw new Error("Compte social introuvable.");
  }

  const newStatus = decision === "VERIFY" ? "VERIFIED" : "REJECTED";

  const updated = await prisma.socialAccount.update({
    where: { id: socialAccountId },
    data: {
      status: newStatus,
      verifiedAt: decision === "VERIFY" ? new Date() : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      targetId: account.userId,
      action: `SOCIAL_ACCOUNT_${decision}ED`,
      details: JSON.stringify({
        socialAccountId,
        platform: account.platform,
        identifier: account.identifier,
        decision,
        notes: notes || null,
      }),
    },
  });

  return updated;
}

/**
 * Récupère la liste des signalements
 */
export async function getAdminReports(status: string = "PENDING") {
  return await prisma.report.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    include: {
      campaign: {
        select: {
          id: true,
          platform: true,
          actionType: true,
          videoUrl: true,
        },
      },
      taskCompletion: {
        select: {
          id: true,
          status: true,
          rewardPoints: true,
          screenshotUrl: true,
          submittedAt: true,
        },
      },
      reporterUser: {
        select: {
          id: true,
          email: true,
        },
      },
      reportedUser: {
        select: {
          id: true,
          email: true,
          reputationScore: true,
        },
      },
    },
  });
}

/**
 * Arbitrage d'un signalement par l'administrateur
 * - UPHELD : Signalement confirmé -> tâche rejetée, pénalité de réputation (-10) au travailleur indélicat
 * - DISMISSED : Signalement rejeté -> tâche approuvée, déblocage des points au travailleur
 */
export async function resolveAdminReport(
  adminId: string,
  reportId: string,
  resolution: "UPHELD" | "DISMISSED",
  adminNotes: string
) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      taskCompletion: true,
    },
  });

  if (!report || report.status !== "PENDING") {
    throw new Error("Signalement introuvable ou déjà arbitré.");
  }

  const completion = report.taskCompletion;

  await prisma.$transaction(async (tx) => {
    // 1. Mise à jour du rapport
    await tx.report.update({
      where: { id: reportId },
      data: {
        status: resolution,
        adminNotes: adminNotes || null,
        resolvedAt: new Date(),
      },
    });

    if (resolution === "UPHELD") {
      // Le travailleur a triché : tâche rejetée définitivement
      await tx.taskCompletion.update({
        where: { id: completion.id },
        data: { status: "REJECTED" },
      });

      // Pénalité de réputation au travailleur (-10 pts, auto-suspension si < 50)
      await adjustReputationScore(
        report.reportedUserId,
        -10,
        `Signalement ${reportId} confirmé par modération : tâche non effectuée`,
        tx
      );
    } else {
      // Signalement abusif / rejeté : approbation de la tâche et crédit des points
      await tx.taskCompletion.update({
        where: { id: completion.id },
        data: { status: "APPROVED" },
      });

      // Crédit atomique des points au travailleur
      await recordLedgerTransaction(
        {
          userId: report.reportedUserId,
          amount: completion.rewardPoints,
          type: "TASK_REWARD",
          referenceType: "TASK_COMPLETION",
          referenceId: completion.id,
          idempotencyKey: `arbitration-approved-${completion.id}`,
          description: `Arbitrage favorable tâche ${completion.id} : +${completion.rewardPoints} pts débloqués`,
        },
        tx
      );

      // Récompense de réputation (+0.2)
      await adjustReputationScore(
        report.reportedUserId,
        0.2,
        `Tâche ${completion.id} validée après arbitrage`,
        tx
      );
    }

    // Journal d'audit de l'arbitrage
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        targetId: report.reportedUserId,
        action: `REPORT_RESOLVED_${resolution}`,
        details: JSON.stringify({
          reportId,
          resolution,
          adminNotes,
          taskCompletionId: completion.id,
        }),
      },
    });
  });

  return { success: true, resolution };
}

/**
 * Récupère les paramètres système actuels
 */
export async function getSystemSettings() {
  const settings = await prisma.systemSetting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return map;
}

/**
 * Met à jour un paramètre système
 */
export async function updateSystemSetting(
  adminId: string,
  key: string,
  value: string,
  description?: string
) {
  const previous = await prisma.systemSetting.findUnique({ where: { key } });

  const updated = await prisma.systemSetting.upsert({
    where: { key },
    update: { value, description: description || undefined },
    create: { key, value, description: description || null },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      targetId: adminId,
      action: "SYSTEM_SETTING_UPDATED",
      details: JSON.stringify({
        key,
        previousValue: previous?.value || null,
        newValue: value,
      }),
    },
  });

  return updated;
}

/**
 * Récupère les journaux d'audit récents
 */
export async function getAuditLogs(limit: number = 50) {
  return await prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      actor: { select: { id: true, email: true, role: true } },
      target: { select: { id: true, email: true } },
    },
  });
}

