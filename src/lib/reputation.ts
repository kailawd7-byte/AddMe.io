import { prisma } from "./prisma.ts";
import { SYSTEM_DEFAULTS } from "./constants.ts";

export interface UserTaskQuotaInfo {
  dailyTasksCompleted: number;
  dailyTaskLimit: number;
  canCompleteMoreTasks: boolean;
  reputationScore: number;
  isReputationHealthy: boolean;
}

/**
 * Calcule le plafond quotidien de tâches pour un utilisateur.
 * Le plafond de base est de 20 tâches et augmente avec l'ancienneté du compte.
 */
export function calculateDailyTaskLimit(createdAtOrDays: Date | number): number {
  const baseLimit = SYSTEM_DEFAULTS.BASE_DAILY_TASK_LIMIT; // 20
  let daysSinceRegistration = 0;

  if (typeof createdAtOrDays === "number") {
    daysSinceRegistration = Math.max(0, Math.floor(createdAtOrDays));
  } else if (createdAtOrDays instanceof Date) {
    daysSinceRegistration = Math.max(
      0,
      Math.floor((Date.now() - createdAtOrDays.getTime()) / (24 * 60 * 60 * 1000))
    );
  }

  // +5 tâches supplémentaires par semaine d'ancienneté, plafonné à 100 tâches/jour
  const bonus = Math.floor(daysSinceRegistration / 7) * 5;
  return Math.min(100, baseLimit + bonus);
}

/**
 * Vérifie l'éligibilité d'un utilisateur à accomplir des tâches (quota & réputation)
 */
export async function checkUserTaskEligibility(userId: string): Promise<UserTaskQuotaInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      dailyTasksCompleted: true,
      lastTaskDate: true,
      reputationScore: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("Utilisateur introuvable.");
  }

  // Vérification de la réinitialisation quotidienne du compteur
  const now = new Date();
  let tasksToday = user.dailyTasksCompleted;

  if (user.lastTaskDate) {
    const isSameDay =
      user.lastTaskDate.getFullYear() === now.getFullYear() &&
      user.lastTaskDate.getMonth() === now.getMonth() &&
      user.lastTaskDate.getDate() === now.getDate();

    if (!isSameDay) {
      // Nouveau jour : réinitialisation du compteur
      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyTasksCompleted: 0,
        },
      });
      tasksToday = 0;
    }
  }

  const dailyTaskLimit = calculateDailyTaskLimit(user.createdAt);
  const canCompleteMoreTasks = tasksToday < dailyTaskLimit;
  const isReputationHealthy = user.reputationScore >= 50.0 && user.status === "ACTIVE";

  return {
    dailyTasksCompleted: tasksToday,
    dailyTaskLimit,
    canCompleteMoreTasks,
    reputationScore: user.reputationScore,
    isReputationHealthy,
  };
}

/**
 * Ajuste le score de réputation d'un utilisateur.
 * Suspend automatiquement le compte si le score passe sous 50.
 */
export async function adjustReputationScore(
  userId: string,
  delta: number,
  reason: string,
  txClient?: any
) {
  const db = txClient || prisma;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { reputationScore: true, status: true },
  });

  if (!user) return;

  const newScore = Math.max(0, Math.min(100, Number((user.reputationScore + delta).toFixed(1))));
  const shouldSuspend = newScore < 50.0 && user.status === "ACTIVE";

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      reputationScore: newScore,
      status: shouldSuspend ? "SUSPENDED" : user.status,
    },
  });

  await db.auditLog.create({
    data: {
      targetId: userId,
      action: shouldSuspend ? "USER_AUTO_SUSPENDED_LOW_REPUTATION" : "REPUTATION_ADJUSTED",
      details: JSON.stringify({
        previousScore: user.reputationScore,
        newScore,
        delta,
        reason,
      }),
    },
  });

  return updatedUser;
}
