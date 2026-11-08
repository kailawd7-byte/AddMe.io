import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupportTicketById, replyToSupportTicket } from "@/lib/support";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const ticket = await getSupportTicketById(id);

  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 });
  }

  // Seul le propriétaire ou un admin peut répondre
  if (ticket.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length < 2) {
      return NextResponse.json(
        { error: "Veuillez saisir votre message." },
        { status: 400 }
      );
    }

    const updated = await replyToSupportTicket({
      ticketId: id,
      senderRole: user.role === "ADMIN" ? "ADMIN" : "USER",
      senderId: user.id,
      senderName: user.email.split("@")[0],
      senderEmail: user.email,
      content: content.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Réponse envoyée avec succès.",
      ticket: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur envoi réponse" }, { status: 500 });
  }
}
