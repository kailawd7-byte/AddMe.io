import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { askAISecretary } from "@/lib/ai-secretary";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé : réservé aux administrateurs." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { mode, userMessage, ticketContext, platformStats } = body;

    const result = await askAISecretary({
      mode: mode || "chat",
      userMessage,
      ticketContext,
      platformStats,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[API AI Secretary] Erreur :", err);
    return NextResponse.json(
      { error: err.message || "Erreur interne de la Secrétaire IA." },
      { status: 500 }
    );
  }
}
