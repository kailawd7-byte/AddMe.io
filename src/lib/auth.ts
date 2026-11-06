import { cookies } from "next/headers";
import { prisma } from "./prisma";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./crypto-auth";

export {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
};

const COOKIE_NAME = "addme_session";

/**
 * Écrit le cookie de session sécurisé
 */
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  });
}

/**
 * Supprime le cookie de session (déconnexion)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Récupère l'utilisateur connecté depuis les cookies de session
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifySessionToken(token);
    if (!decoded?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        status: true,
        reputationScore: true,
        dailyTasksCompleted: true,
        createdAt: true,
      },
    });

    if (!user || user.status === "BANNED") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Erreur getCurrentUser:", error);
    return null;
  }
}
