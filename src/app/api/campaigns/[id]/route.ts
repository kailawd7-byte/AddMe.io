import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleCampaignStatus, updateCampaign } from "@/lib/campaigns";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

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
            include: {
              workerUser: {
                select: {
                  id: true,
                  email: true,
                  reputationScore: true,
                  socialAccounts: {
                    select: {
                      platform: true,
                      identifier: true,
                      status: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!campaign || (campaign.userId !== user.id && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Campagne introuvable." }, { status: 404 });
  }

  // Extraire et formater l'historique complet des interactions reçues sur cette campagne
  const allCompletions = campaign.tasks
    .flatMap((t) => t.completions)
    .filter(
      (c) =>
        c.status === "APPROVED" ||
        c.status === "PENDING_RETENTION" ||
        c.status === "FLAGGED" ||
        c.status === "IN_PROGRESS"
    )
    .sort((a, b) => {
      const dateA = new Date(a.submittedAt || a.startedAt).getTime();
      const dateB = new Date(b.submittedAt || b.startedAt).getTime();
      return dateB - dateA;
    })
    .map((c) => {
      const matchingSocial =
        c.workerUser?.socialAccounts?.find(
          (sa) => sa.platform === campaign.platform
        ) || c.workerUser?.socialAccounts?.[0];

      const rawName = c.workerUser?.email
        ? c.workerUser.email.split("@")[0]
        : `Membre_${c.workerUserId.slice(0, 6)}`;

      return {
        id: c.id,
        taskId: c.taskId,
        workerUserId: c.workerUserId,
        workerName: rawName,
        workerEmailMasked: c.workerUser?.email
          ? maskEmail(c.workerUser.email)
          : null,
        workerHandle: matchingSocial?.identifier
          ? matchingSocial.identifier.replace(/^@/, "")
          : null,
        workerReputation: c.workerUser?.reputationScore ?? 100,
        rewardPoints: c.rewardPoints ?? campaign.rewardPerUnit,
        actionType: campaign.actionType,
        platform: campaign.platform,
        status: c.status,
        startedAt: c.startedAt,
        submittedAt: c.submittedAt,
        retentionEndsAt: c.retentionEndsAt,
        screenshotUrl: c.screenshotUrl,
      };
    });

  return NextResponse.json({
    campaign,
    completions: allCompletions,
  });
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
    const { status, rewardPerWorker, totalQuantity, dailyCap, commentTemplate } = body;

    // 1. Mise à jour du statut uniquement
    if (status !== undefined && rewardPerWorker === undefined && totalQuantity === undefined && dailyCap === undefined && commentTemplate === undefined) {
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
    }

    // 2. Modification complète des paramètres (points, volume, cadence, commentaire)
    const result = await updateCampaign(id, user.id, {
      rewardPerWorker: rewardPerWorker !== undefined ? Number(rewardPerWorker) : undefined,
      totalQuantity: totalQuantity !== undefined ? Number(totalQuantity) : undefined,
      dailyCap: dailyCap !== undefined ? Number(dailyCap) : undefined,
      commentTemplate: commentTemplate !== undefined ? String(commentTemplate) : undefined,
    });

    const diffText =
      result.difference > 0
        ? ` (${result.difference} pts débités de votre solde)`
        : result.difference < 0
        ? ` (${Math.abs(result.difference)} pts remboursés sur votre solde)`
        : "";

    return NextResponse.json({
      success: true,
      message: `Campagne modifiée avec succès${diffText}.`,
      campaign: result.campaign,
      difference: result.difference,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
