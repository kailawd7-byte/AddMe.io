import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminDashboardStats } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé : réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const stats = await getAdminDashboardStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur récupération statistiques." }, { status: 500 });
  }
}

