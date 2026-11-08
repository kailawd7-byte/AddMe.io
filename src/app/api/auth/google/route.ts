import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, hashPassword } from "@/lib/auth";
import { SYSTEM_DEFAULTS, LEDGER_TYPES } from "@/lib/constants";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${req.nextUrl.origin}/api/auth/google/callback`;

  // Si de véritables identifiants Google OAuth sont configurés dans .env
  if (clientId && clientId !== "your-google-client-id") {
    const scope = encodeURIComponent("openid email profile");
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=online&prompt=select_account`;

    return NextResponse.redirect(googleAuthUrl);
  }

  // Sinon, redirection vers la page de login avec paramètre google=1
  return NextResponse.redirect(new URL("/login?google=1", req.url));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Une adresse email valide est requise." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Récupérer l'IP pour le journal
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Mot de passe sécurisé aléatoire (l'utilisateur se connecte via Google)
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomPassword);

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          isEmailVerified: true, // Google valide obligatoirement l'email
          registrationIp: clientIp,
          lastLoginIp: clientIp,
        },
      });

      // Écriture de la transaction dans le grand livre (Ledger) pour les +50 pts de bienvenue
      await prisma.ledgerEntry.create({
        data: {
          userId: user.id,
          amount: SYSTEM_DEFAULTS.WELCOME_BONUS_POINTS,
          type: LEDGER_TYPES.WELCOME_BONUS,
          referenceType: "SYSTEM",
          idempotencyKey: `signup_bonus_google_${user.id}`,
          description: "Bonus de bienvenue offert (+50 pts) via Inscription Google",
        },
      });
    } else {
      // Si l'utilisateur existait sans avoir vérifié son email, on le valide via Google
      if (!user.isEmailVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            isEmailVerified: true,
          },
        });
      }

      // Vérifier si le compte est banni
      if (user.status === "BANNED") {
        return NextResponse.json(
          { error: "Ce compte a été suspendu pour non-respect des règles." },
          { status: 403 }
        );
      }
    }

    // Écriture du cookie de session sécurisé
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[GoogleAuth] Erreur authentification :", err);
    return NextResponse.json(
      { error: "Erreur lors de la connexion Google. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
