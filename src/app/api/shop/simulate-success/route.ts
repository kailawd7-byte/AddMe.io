import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { completePaymentConfirmation } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Identifiant de session manquant." },
        { status: 400 }
      );
    }

    // Sécurité : vérifier que la session appartient bien à cet utilisateur
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (!payment || payment.userId !== user.id) {
      return NextResponse.json(
        { error: "Session de paiement introuvable ou non autorisée." },
        { status: 404 }
      );
    }

    const result = await completePaymentConfirmation(sessionId, `pi_mock_${Date.now()}`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erreur simulation paiement:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la validation simulée du paiement." },
      { status: 400 }
    );
  }
}

