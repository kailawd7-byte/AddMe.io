import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { signUpSchema } from "@/lib/validation";
import { generateSecureToken } from "@/lib/security";
import { SYSTEM_DEFAULTS, LEDGER_TYPES } from "@/lib/constants";
import { sendEmailVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = signUpSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cette adresse email." },
        { status: 409 }
      );
    }

    // Récupérer les informations de contexte IP / appareil pour l'anti-fraude
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Vérifier si l'IP a déjà créé plusieurs comptes récemment (anti-fraude / multi-comptes)
    const accountsFromSameIp = await prisma.user.count({
      where: {
        registrationIp: clientIp,
      },
    });

    // Hash du mot de passe
    const passwordHash = await hashPassword(password);

    // Génération du code de vérification d'email à 6 chiffres (24h de validité)
    const emailVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Création de l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        registrationIp: clientIp,
        lastLoginIp: clientIp,
        deviceFingerprint: userAgent.slice(0, 255),
        emailVerificationToken,
        emailVerificationExpiresAt,
        isEmailVerified: false,
      },
    });

    // Journal d'audit anti-fraude si plusieurs comptes depuis la même IP
    if (accountsFromSameIp >= 2) {
      await prisma.auditLog.create({
        data: {
          targetId: newUser.id,
          action: "MULTI_ACCOUNT_ALERT",
          details: JSON.stringify({
            message: `Détection de ${accountsFromSameIp + 1} comptes créés depuis l'IP ${clientIp}`,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    }

    // Connexion immédiate via cookie sécurisé
    await setSessionCookie({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Crédit immédiat des 50 points offerts à l'inscription dans le Ledger
    await prisma.ledgerEntry.create({
      data: {
        userId: newUser.id,
        amount: SYSTEM_DEFAULTS.WELCOME_BONUS_POINTS,
        type: LEDGER_TYPES.WELCOME_BONUS,
        referenceType: "SYSTEM",
        referenceId: newUser.id,
        idempotencyKey: `welcome-bonus-${newUser.id}`,
        description: `Bonus de bienvenue offert dès l'inscription (+${SYSTEM_DEFAULTS.WELCOME_BONUS_POINTS} points)`,
      },
    });

    const origin =
      req.nextUrl.origin ||
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const verificationUrl = `${origin}/verify-email?code=${emailVerificationToken}`;

    // Envoi sécurisé de l'email de vérification avec le code à 6 chiffres
    await sendEmailVerificationEmail({
      toEmail: newUser.email,
      verificationCode: emailVerificationToken,
      verificationUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès ! Un email de confirmation contenant votre code à 6 chiffres vous a été envoyé.",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Erreur registration:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue lors de l'inscription." },
      { status: 500 }
    );
  }
}

