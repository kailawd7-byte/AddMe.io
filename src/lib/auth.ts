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

export const COOKIE_NAME = "addme_session";

/**
 * Calcule dynamiquement l'URL de redirection OAuth Google pour s'adapter
 * automatiquement à l'environnement actuel (localhost en dev, domaine Vercel en prod)
 */
export function getGoogleRedirectUri(req: { headers: Headers; nextUrl: { host: string; origin: string } }): string {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.host;
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");

  const currentOrigin = `${proto}://${host}`;

  const configured = process.env.GOOGLE_REDIRECT_URI;
  if (configured) {
    try {
      const parsed = new URL(configured);
      // Ne respecter la variable statique que si son hôte correspond au host réel
      if (parsed.host === host) {
        return configured;
      }
    } catch {}
  }

  return `${currentOrigin}/api/auth/google/callback`;
}

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
