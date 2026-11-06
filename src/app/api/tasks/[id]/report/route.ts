import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { reportTaskCompletion } from "@/lib/tasks";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params; // completionId
    const body = await req.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "Veuillez fournir un motif détaillé pour votre signalement (au moins 5 caractères)." },
        { status: 400 }
      );
    }

    const report = await reportTaskCompletion(id, user.id, reason);

    return NextResponse.json({
      success: true,
      message: "Signalement enregistré. Les points sont immédiatement bloqués en attente d'arbitrage de l'équipe de modération.",
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Impossible d'enregistrer le signalement." },
      { status: 400 }
    );
  }
}

