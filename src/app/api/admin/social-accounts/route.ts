import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPendingSocialAccounts } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé : réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const pendingAccounts = await getPendingSocialAccounts();
    return NextResponse.json({ accounts: pendingAccounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur récupération comptes sociaux." }, { status: 500 });
  }
}

