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

  // 1. Si les identifiants réels Google Cloud sont configurés dans .env
  if (clientId && clientId !== "your-google-client-id" && clientId.trim().length > 5) {
    const scope = encodeURIComponent("openid email profile");
    // prompt=select_account force Google à afficher la liste des comptes Google actifs du navigateur
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=online&prompt=select_account`;

    return NextResponse.redirect(googleAuthUrl);
  }

  // 2. Mode 1-clic direct (en local ou avant paramétrage Google Cloud) :
  // Connecte ou inscrit directement l'utilisateur en 1 clic sans aucun formulaire
  try {
    const demoEmail = "utilisateur.google@gmail.com";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    let user = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomPassword);

      user = await prisma.user.create({
        data: {
          email: demoEmail,
          passwordHash,
          isEmailVerified: true,
          registrationIp: clientIp,
          lastLoginIp: clientIp,
        },
      });

      await prisma.ledgerEntry.create({
        data: {
          userId: user.id,
          amount: SYSTEM_DEFAULTS.WELCOME_BONUS_POINTS,
          type: LEDGER_TYPES.WELCOME_BONUS,
          referenceType: "SYSTEM",
          idempotencyKey: `signup_bonus_google_${user.id}`,
          description: "Bonus de bienvenue (+50 pts) via Inscription Google 1-clic",
        },
      });
    } else {
      if (!user.isEmailVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isEmailVerified: true },
        });
      }
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (err) {
    console.error("[GoogleAuth] Erreur 1-clic :", err);
    return NextResponse.redirect(new URL("/login?error=google_fallback_failed", req.url));
  }
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

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomPassword);

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          isEmailVerified: true,
          registrationIp: clientIp,
          lastLoginIp: clientIp,
        },
      });

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
      if (!user.isEmailVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            isEmailVerified: true,
          },
        });
      }

      if (user.status === "BANNED") {
        return NextResponse.json(
          { error: "Ce compte a été suspendu pour non-respect des règles." },
          { status: 403 }
        );
      }
    }

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
