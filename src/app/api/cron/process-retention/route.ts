import { NextRequest, NextResponse } from "next/server";
import { processRetentionReleases, expireStaleTaskCompletions } from "@/lib/tasks";
import { resetDailyCapsIfNeeded } from "@/lib/campaigns";

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET || "cron_secure_token_addme_2026";

  const isAuthorized =
    authHeader === `Bearer ${expectedSecret}` || querySecret === expectedSecret;

  if (!isAuthorized && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const [releasedCount, expiredCount, capsResetCount] = await Promise.all([
      processRetentionReleases(),
      expireStaleTaskCompletions(),
      resetDailyCapsIfNeeded(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        pointsReleasedPostRetention: releasedCount,
        staleTasksExpired: expiredCount,
        dailyCapsReset: capsResetCount,
      },
    });
  } catch (error: any) {
    console.error("Erreur exécution cron:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne lors de l'exécution du cron." },
      { status: 500 }
    );
  }
}

