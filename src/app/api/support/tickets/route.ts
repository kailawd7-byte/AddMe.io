import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createSupportTicket, getUserSupportTickets } from "@/lib/support";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const tickets = await getUserSupportTickets(user.id);
    return NextResponse.json({ tickets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur récupération tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, category, message } = body;

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      return NextResponse.json(
        { error: "Veuillez renseigner un objet clair (au moins 3 caractères)." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Veuillez détailler votre message ou question (au moins 10 caractères)." },
        { status: 400 }
      );
    }

    const ticket = await createSupportTicket({
      userId: user.id,
      userEmail: user.email,
      userName: user.email.split("@")[0],
      subject: subject.trim(),
      category: category || "GENERAL",
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Votre message a été transmis avec succès à l'équipe Support d'AddMe.io !",
      ticket,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur création ticket" }, { status: 500 });
  }
}
