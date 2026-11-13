import { NextRequest, NextResponse } from "next/server";
import { processSasPayWebhookEvent } from "@/lib/payments";

/**
 * Endpoint Webhook SasPay : /api/webhooks/saaspay (et /api/webhooks/saspay)
 *
 * Règles absolues de sécurité :
 * 1. Extraction du corps BRUT (raw body) via req.text(), jamais de req.json() avant vérification.
 * 2. Vérification cryptographique HMAC-SHA256 sur f"{timestamp}.{body}" avec timingSafeEqual.
 * 3. Contrôle strict de l'horodatage X-Webhook-Timestamp : rejet si > 300 secondes.
 * 4. Traitement idempotent : les événements dupliqués ne doublent jamais le crédit de points.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-webhook-signature") ||
      req.headers.get("X-Webhook-Signature");
    const timestamp =
      req.headers.get("x-webhook-timestamp") ||
      req.headers.get("X-Webhook-Timestamp");
    const event =
      req.headers.get("x-webhook-event") ||
      req.headers.get("X-Webhook-Event");

    // Traitement complet avec vérification cryptographique
    const result = await processSasPayWebhookEvent(rawBody, signature, timestamp);

    return NextResponse.json({
      received: true,
      success: true,
      event: event || (result as any).eventType || "handled",
      details: result,
    });
  } catch (error: any) {
    console.error("Échec validation webhook SasPay :", error.message);
    const isSecurityError =
      error.message?.includes("Signature webhook") ||
      error.message?.includes("Horodatage") ||
      error.message?.includes("Secret");

    return NextResponse.json(
      { error: error.message || "Erreur traitement webhook SasPay" },
      { status: isSecurityError ? 403 : 400 }
    );
  }
}
