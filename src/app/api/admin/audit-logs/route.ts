import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAuditLogs } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé : réservé aux administrateurs." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    const logs = await getAuditLogs(limit);
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur récupération journal d'audit." }, { status: 500 });
  }
}

