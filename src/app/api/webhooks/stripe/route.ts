import { NextRequest, NextResponse } from "next/server";
import { processStripeWebhookEvent } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    const result = await processStripeWebhookEvent(rawBody, signature);

    return NextResponse.json({
      received: true,
      result,
    });
  } catch (error: any) {
    console.error("Erreur Webhook Stripe:", error.message);
    return NextResponse.json(
      { error: error.message || "Erreur de traitement du webhook Stripe." },
      { status: 400 }
    );
  }
}

