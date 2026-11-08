import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { replyToSupportTicket } from "@/lib/support";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Accès refusé : réservé aux administrateurs." },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { content, newStatus } = body;

    if (!content || typeof content !== "string" || content.trim().length < 2) {
      return NextResponse.json(
        { error: "Veuillez saisir le message de réponse." },
        { status: 400 }
      );
    }

    const updated = await replyToSupportTicket({
      ticketId: id,
      senderRole: "ADMIN",
      senderId: user.id,
      senderName: "Support AddMe.io",
      senderEmail: user.email,
      content: content.trim(),
      newStatus: newStatus || "ANSWERED",
    });

    return NextResponse.json({
      success: true,
      message: "Réponse envoyée avec succès à l'usager.",
      ticket: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur envoi réponse support." },
      { status: 500 }
    );
  }
}
