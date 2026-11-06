import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { moderateSocialAccount } from "@/lib/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé : réservé aux administrateurs." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { decision, notes } = body;

    if (decision !== "VERIFY" && decision !== "REJECT") {
      return NextResponse.json({ error: "Décision invalide (VERIFY ou REJECT)." }, { status: 400 });
    }

    const updated = await moderateSocialAccount(user.id, id, decision, notes);

    return NextResponse.json({
      success: true,
      message: `Compte social ${decision === "VERIFY" ? "validé" : "rejeté"} avec succès.`,
      account: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur modération compte social." }, { status: 400 });
  }
}

