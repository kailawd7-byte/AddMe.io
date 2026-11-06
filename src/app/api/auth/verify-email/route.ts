import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SYSTEM_DEFAULTS, LEDGER_TYPES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Jeton de vérification requis." },
        { status: 400 }
      );
    }

    // Recherche de l'utilisateur avec ce token actif
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Ce lien de vérification est invalide ou a déjà été utilisé." },
        { status: 400 }
      );
    }

    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Ce lien de vérification a expiré. Veuillez demander un nouvel email." },
        { status: 400 }
      );
    }

    const idempotencyKey = `welcome-bonus-${user.id}`;
    const welcomePoints = SYSTEM_DEFAULTS.WELCOME_BONUS_POINTS;

    // Transaction atomique : validation de l'email + crédit du bonus de bienvenue
    await prisma.$transaction(async (tx) => {
      // 1. Mise à jour de l'utilisateur
      await tx.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiresAt: null,
        },
      });

      // 2. Vérification d'idempotence pour ne jamais créditer le bonus deux fois
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
    });

    return NextResponse.json({
      success: true,
      message: `Votre adresse email a été validée avec succès ! ${welcomePoints} points de bienvenue ont été ajoutés à votre solde.`,
      bonusPoints: welcomePoints,
    });
  } catch (error) {
    console.error("Erreur vérification email:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la vérification de l'email." },
      { status: 500 }
    );
  }
}

