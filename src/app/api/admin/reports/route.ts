import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminReports } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé : réservé aux administrateurs." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";

  try {
    const reports = await getAdminReports(status);
    return NextResponse.json({ reports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur récupération signalements." }, { status: 500 });
  }
}

