import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { adjustUserPointsManually } from "@/lib/admin";

export async function POST(
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
    const { amount, reason } = body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return NextResponse.json({ error: "Montant numérique non nul requis." }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "Veuillez fournir un motif clair d'au moins 5 caractères." },
        { status: 400 }
      );
    }

    const result = await adjustUserPointsManually(user.id, id, numAmount, reason.trim());

    return NextResponse.json({
      success: true,
      message: `Solde utilisateur ajusté de ${numAmount > 0 ? "+" : ""}${numAmount} points. Nouveau solde : ${result.balance} points.`,
      newBalance: result.balance,
      entry: result.entry,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur ajustement points." }, { status: 400 });
  }
}

