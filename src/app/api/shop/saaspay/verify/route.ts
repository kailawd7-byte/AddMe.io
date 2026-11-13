import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { verifyAndDeliverSasPayPayment } from "@/lib/payments";

/**
 * Endpoint de vérification d'un paiement SasPay : /api/shop/saaspay/verify
 * Permet au frontend ou aux retours de redirection de vérifier l'état réel auprès de SasPay
 * et de créditer les points si et seulement si status === "SUCCESS".
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId") || searchParams.get("payment_id");
    const sessionId = searchParams.get("sessionId") || searchParams.get("session_id");

    const identifier = paymentId || sessionId;
    if (!identifier) {
      return NextResponse.json(
        { error: "Veuillez fournir un identifiant de paiement ou de session SasPay." },
        { status: 400 }
      );
    }

    const result = await verifyAndDeliverSasPayPayment(identifier);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erreur vérification paiement SasPay :", error);
    return NextResponse.json(
      { error: error.message || "Impossible de vérifier le paiement SasPay." },
      { status: 400 }
    );
  }
}

