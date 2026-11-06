import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelCampaign } from "@/lib/campaigns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const result = await cancelCampaign(id, user.id);

    return NextResponse.json({
      success: true,
      message: `Campagne annulée. ${result.refundAmount} points pour les ${result.unconsumedCount} tâches non consommées ont été recrédités sur votre solde.`,
      result,
    });
  } catch (error: any) {
    console.error("Erreur annulation campagne:", error);
    return NextResponse.json(
      { error: error.message || "Impossible d'annuler la campagne." },
      { status: 400 }
    );
  }
}

