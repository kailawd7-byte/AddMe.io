import { prisma } from "./prisma";

interface RateLimitResult {
  success: boolean;
  remainingAttempts: number;
  resetAt: Date;
}

/**
 * Limiteur de débit avec persistance base de données (ou secours)
 * Empêche les attaques par force brute sur l'authentification
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMinutes * 60 * 1000);

  try {
    const existing = await prisma.rateLimit.findUnique({
      where: { key },
    });

    if (!existing) {
      await prisma.rateLimit.create({
        data: {
          key,
          attempts: 1,
          resetAt,
        },
      });
      return {
        success: true,
        remainingAttempts: maxAttempts - 1,
        resetAt,
      };
    }

    // Si la fenêtre de temps est expirée, on réinitialise
    if (existing.resetAt < now) {
      await prisma.rateLimit.update({
        where: { key },
        data: {
          attempts: 1,
          resetAt,
        },
      });
      return {
        success: true,
        remainingAttempts: maxAttempts - 1,
        resetAt,
      };
    }

    // Si le quota est dépassé
    if (existing.attempts >= maxAttempts) {
      return {
        success: false,
        remainingAttempts: 0,
        resetAt: existing.resetAt,
      };
    }

    // Incrémentation du compteur
    const updated = await prisma.rateLimit.update({
      where: { key },
      data: {
        attempts: { increment: 1 },
      },
    });

    return {
      success: true,
      remainingAttempts: Math.max(0, maxAttempts - updated.attempts),
      resetAt: existing.resetAt,
    };
  } catch (error) {
    console.error("Erreur rate limit:", error);
    // En cas de problème DB temporaire, autorise pour ne pas bloquer l'app
    return {
      success: true,
      remainingAttempts: 1,
      resetAt,
    };
  }
}

/**
 * Réinitialise le compteur après une connexion réussie
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await prisma.rateLimit.delete({
      where: { key },
    }).catch(() => null);
  } catch {
    // Ignorer si la clé n'existe pas
  }
}

