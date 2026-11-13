import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SYSTEM_DEFAULTS, LEDGER_TYPES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { rewardInfluencerIfVerified } from "@/lib/gift-codes";

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        emailVerificationToken: true,
        emailVerificationExpiresAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      authenticated: true,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    });
  } catch (error) {
    console.error("Erreur vérification email status:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la récupération du statut." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawToken = body.token || body.code;
    const sessionUser = await getCurrentUser();

    if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length === 0) {
      return NextResponse.json(
        { error: "Veuillez fournir le code de vérification reçu par email." },
        { status: 400 }
      );
    }

    // Recherche stricte de l'utilisateur ayant ce jeton / code actif
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: rawToken.trim(),
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Ce code ou lien de vérification est invalide ou expiré." },
        { status: 400 }
      );
    }

    // Si déjà vérifié
    if (user.isEmailVerified) {
      return NextResponse.json({
        success: true,
        message: "Votre adresse email est déjà vérifiée et active.",
        alreadyVerified: true,
      });
    }

    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Ce code de vérification a expiré. Veuillez en générer un nouveau." },
        { status: 400 }
      );
    }

    const idempotencyKey = `welcome-bonus-${user.id}`;
    const welcomePoints = SYSTEM_DEFAULTS.WELCOME_BONUS_POINTS;

    // Transaction atomique : validation de l'email + crédit du bonus de bienvenue au Ledger
    await prisma.$transaction(async (tx) => {
      // 1. Mise à jour du statut utilisateur
      await tx.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiresAt: null,
        },
      });

      // 2. Écriture atomique et idempotente dans le Ledger
      const existingBonus = await tx.ledgerEntry.findUnique({
        where: { idempotencyKey },
      });

      if (!existingBonus) {
        await tx.ledgerEntry.create({
          data: {
            userId: user.id,
            amount: welcomePoints,
            type: LEDGER_TYPES.WELCOME_BONUS,
            referenceType: "SYSTEM",
            referenceId: user.id,
            idempotencyKey,
            description: `Bonus de bienvenue : +${welcomePoints} points crédités`,
          },
        });
      }

      // 3. Si l'utilisateur s'est inscrit via un code cadeau d'influenceur,
      // débloquer la récompense de 100 points pour l'influenceur (anti-fraude : compte désormais vérifié)
      await rewardInfluencerIfVerified({
        userId: user.id,
        tx,
      });
    });

    return NextResponse.json({
      success: true,
      message: `Votre adresse email a été validée avec succès ! ${welcomePoints} points de bienvenue ont été ajoutés à votre solde.`,
      bonusPoints: welcomePoints,
    });
  } catch (error) {
    console.error("Erreur validation email:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue lors de la validation." },
      { status: 500 }
    );
  }
}
