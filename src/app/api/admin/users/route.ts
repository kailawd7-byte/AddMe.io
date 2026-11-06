import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminUsersList } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé : réservé aux administrateurs." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;

  try {
    const users = await getAdminUsersList({ search, status });
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur récupération utilisateurs." }, { status: 500 });
  }
}

