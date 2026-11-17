import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { askAISecretary } from "@/lib/ai-secretary";
import { getOpenBugTickets, getAllSupportTickets, getSupportStats } from "@/lib/support";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé : réservé aux administrateurs." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { mode, userMessage, ticketContext, platformStats: clientStats } = body;

    // Récupérer les données réelles et fraîches depuis PostgreSQL
    const [openBugs, allTickets, supportStats, totalUsers, activeCampaigns, ledgerSum] =
      await Promise.all([
        getOpenBugTickets().catch(() => []),
        getAllSupportTickets({ status: "ALL" }).catch(() => []),
        getSupportStats().catch(() => ({
          totalTickets: 0,
          pendingTickets: 0,
          answeredTickets: 0,
          resolvedTickets: 0,
          openBugsCount: 0,
        })),
        prisma.user.count().catch(() => 1),
        prisma.campaign.count({ where: { status: "ACTIVE" } }).catch(() => 0),
        prisma.ledgerEntry.aggregate({ _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
      ]);

    const enrichedStats = {
      totalUsers: clientStats?.totalUsers ?? totalUsers,
      activeCampaigns: clientStats?.activeCampaigns ?? activeCampaigns,
      pendingSocialVerifications: clientStats?.pendingSocialVerifications ?? 0,
      pendingReports: clientStats?.pendingReports ?? 0,
      circulatingPoints: clientStats?.circulatingPoints ?? (ledgerSum._sum.amount ?? 0),
      openTickets: supportStats.pendingTickets,
      openBugsCount: openBugs.length,
      bugTickets: openBugs, // Liste complète des vrais tickets de bugs
      recentTickets: allTickets.slice(0, 5),
    };

    const result = await askAISecretary({
      mode: mode || "chat",
      userMessage,
      ticketContext,
      platformStats: enrichedStats,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API AI Secretary] Erreur :", err);
    return NextResponse.json(
      { error: err.message || "Erreur interne de la Secrétaire IA." },
      { status: 500 }
    );
  }
}
