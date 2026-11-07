import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCampaign } from "@/lib/campaigns";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      socialAccount: {
        select: {
          platform: true,
          identifier: true,
          status: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          reports: true,
        },
      },
    },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Veuillez vous connecter pour créer une campagne." }, { status: 401 });
    }

    const body = await req.json();
    const { socialAccountId, actionType, videoUrl, commentTemplate, totalQuantity, dailyCap, rewardPerWorker, durationDays } = body;

    if (!socialAccountId || !actionType || !videoUrl || !totalQuantity) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs obligatoires." },
        { status: 400 }
      );
    }

    if (!["LIKE", "COMMENT", "SUBSCRIBE"].includes(actionType)) {
      return NextResponse.json(
        { error: "Type d'action invalide. Choisissez like, commentaire ou abonnement." },
        { status: 400 }
      );
    }

    const quantityNum = parseInt(totalQuantity, 10);
    if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 500) {
      return NextResponse.json(
        { error: "Le nombre de personnes souhaitées doit être compris entre 1 et 500 par campagne." },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      userId: user.id,
      socialAccountId,
      actionType,
      videoUrl,
      commentTemplate,
      totalQuantity: quantityNum,
      rewardPerWorker: rewardPerWorker ? parseFloat(rewardPerWorker) : undefined,
      durationDays: durationDays ? parseInt(durationDays, 10) : undefined,
      dailyCap: dailyCap ? parseInt(dailyCap, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Campagne créée avec succès ! ${campaign.totalCost} points ont été débités de votre solde.`,
      campaign,
    });
  } catch (error: any) {
    console.error("Erreur création campagne:", error);
    if (error.message?.includes("SOLDE_INSUFFISANT")) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    return NextResponse.json(
      { error: error.message || "Une erreur est survenue lors de la création de la campagne." },
      { status: 400 }
    );
  }
}

