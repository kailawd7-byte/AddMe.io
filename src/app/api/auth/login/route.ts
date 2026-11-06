import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { signInSchema } from "@/lib/validation";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await req.json();
    const parseResult = signInSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Identifiants invalides",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // Rate limiting ciblé (IP + Email) pour contrer la force brute
    const rateLimitKey = `login:${clientIp}:${email}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 5, 15);

    if (!rateLimit.success) {
      const waitMinutes = Math.ceil(
        (rateLimit.resetAt.getTime() - Date.now()) / (60 * 1000)
      );
      return NextResponse.json(
        {
          error: `Trop de tentatives infructueuses. Veuillez réessayer dans ${waitMinutes} minute(s).`,
          lockedUntil: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    // Recherche de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Adresse email ou mot de passe incorrect.",
          remainingAttempts: rateLimit.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Vérification du mot de passe
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: "Adresse email ou mot de passe incorrect.",
          remainingAttempts: rateLimit.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Vérification du statut du compte
    if (user.status === "BANNED") {
      return NextResponse.json(
        { error: "Ce compte a été définitivement banni pour non-respect des règles de la plateforme." },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Ce compte est temporairement suspendu. Veuillez contacter le support." },
        { status: 403 }
      );
    }

    // Réinitialisation du limiteur de tentatives en cas de succès
    await resetRateLimit(rateLimitKey);

    // Mise à jour de la dernière IP de connexion
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginIp: clientIp,
      },
    });

    // Écriture du cookie de session sécurisé
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      message: "Connexion réussie.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue lors de la connexion." },
      { status: 500 }
    );
  }
}

