import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllSupportTickets, getSupportStats, getOpenBugTickets } from "@/lib/support";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Accès refusé : réservé aux administrateurs." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ALL";
  const category = searchParams.get("category") || "ALL";
  const search = searchParams.get("search") || "";

  try {
    const [tickets, stats, bugTickets] = await Promise.all([
      getAllSupportTickets({ status, category, search }),
      getSupportStats(),
      getOpenBugTickets(),
    ]);

    return NextResponse.json({
      tickets,
      stats,
      bugTickets,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur récupération tickets support." },
      { status: 500 }
    );
  }
}
