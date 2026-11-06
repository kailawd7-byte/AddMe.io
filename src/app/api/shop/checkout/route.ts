import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { packId } = body;

    if (!packId) {
      return NextResponse.json(
        { error: "Veuillez sélectionner un pack de points." },
        { status: 400 }
      );
    }

    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await createCheckoutSession(user.id, packId, origin);

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.sessionId,
      paymentId: session.paymentId,
      isMock: session.isMock,
      pack: session.pack,
    });
  } catch (error: any) {
    console.error("Erreur création checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création de la session de paiement." },
      { status: 400 }
    );
  }
}

