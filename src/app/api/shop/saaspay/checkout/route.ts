import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initiateSaasPayPayment, type MobileMoneyOperator } from "@/lib/saaspay";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { packId, phoneNumber, operator } = body;

    if (!packId) {
      return NextResponse.json({ error: "Veuillez sélectionner un pack de points." }, { status: 400 });
    }
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json({ error: "Numéro de téléphone requis pour le Mobile Money." }, { status: 400 });
    }

    const validOperators: MobileMoneyOperator[] = ["ORANGE_MONEY", "MTN_MOMO", "WAVE", "MOOV_MONEY"];
    const chosenOperator: MobileMoneyOperator = validOperators.includes(operator) ? operator : "ORANGE_MONEY";

    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await initiateSaasPayPayment({
      userId: user.id,
      packId,
      phoneNumber,
      operator: chosenOperator,
      returnUrl: `${origin}/shop?payment=success`,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erreur checkout SaaSPay:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'initiation du paiement Mobile Money." },
      { status: 400 }
    );
  }
}

