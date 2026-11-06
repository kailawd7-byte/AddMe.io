import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleCampaignStatus } from "@/lib/campaigns";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      socialAccount: true,
      tasks: {
        include: {
          completions: {
            select: {
              id: true,
              workerUserId: true,
              status: true,
              startedAt: true,
              submittedAt: true,
              retentionEndsAt: true,
              screenshotUrl: true,
            },
          },
        },
      },
    },
  });

  if (!campaign || (campaign.userId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Campagne introuvable." }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (status !== "ACTIVE" && status !== "PAUSED") {
      return NextResponse.json(
        { error: "Statut invalide. Vous pouvez uniquement activer ou mettre en pause la campagne." },
        { status: 400 }
      );
    }

    const updated = await toggleCampaignStatus(id, user.id, status);

    return NextResponse.json({
      success: true,
      message: `Campagne ${status === "ACTIVE" ? "réactivée" : "mise en pause"} avec succès.`,
      campaign: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

