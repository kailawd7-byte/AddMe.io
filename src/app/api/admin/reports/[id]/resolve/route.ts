import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveAdminReport } from "@/lib/admin";

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
    const { resolution, adminNotes } = body;

    if (resolution !== "UPHELD" && resolution !== "DISMISSED") {
      return NextResponse.json(
        { error: "Résolution invalide (UPHELD pour confirmer le signalement, DISMISSED pour le rejeter)." },
        { status: 400 }
      );
    }

    const result = await resolveAdminReport(
      user.id,
      id,
      resolution,
      adminNotes || ""
    );

    return NextResponse.json({
      success: true,
      message:
        resolution === "UPHELD"
          ? "Signalement confirmé : tâche rejetée et pénalité de réputation appliquée au travailleur."
          : "Signalement rejeté : tâche approuvée et points libérés au travailleur.",
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur arbitrage signalement." }, { status: 400 });
  }
}

