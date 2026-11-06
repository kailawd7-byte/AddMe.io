import { NextRequest, NextResponse } from "next/server";
import { completePaymentConfirmation } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // SasPay webhook events: transaction.success, transaction.created, etc.
    const eventType = body.event || body.type || "transaction.success";

    if (eventType === "transaction.success" || body.status === "SUCCESS" || body.status === "completed") {
      const sessionId = body.session_id || body.data?.session_id || body.reference || body.data?.reference || body.id;
      const transactionId = body.transaction_id || body.data?.id || `sp_tx_${Date.now()}`;

      if (!sessionId) {
        return NextResponse.json({ error: "Identifiant de session manquant" }, { status: 400 });
      }

      // Recherche par stripeSessionId (utilisé comme identifiant de session unique de paiement)
      const payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { stripeSessionId: sessionId },
            { id: sessionId },
          ],
        },
      });

      if (!payment) {
        return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
      }

      const result = await completePaymentConfirmation(payment.stripeSessionId || payment.id, transactionId);

      return NextResponse.json({
        received: true,
        success: true,
        paymentId: payment.id,
        pointsCredited: result.pointsAmount,
      });
    }

    return NextResponse.json({ received: true, ignored: true, event: eventType });
  } catch (error: any) {
    console.error("Erreur webhook SaasPay:", error);
    return NextResponse.json({ error: error.message || "Erreur interne webhook" }, { status: 500 });
  }
}
