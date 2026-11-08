import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateSupportTicketStatus, SupportTicket } from "@/lib/support";

export async function PATCH(
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
    const { status } = body;

    if (!status || !["OPEN", "ANSWERED", "RESOLVED"].includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide (OPEN, ANSWERED, RESOLVED)." },
        { status: 400 }
      );
    }

    const updated = await updateSupportTicketStatus(id, status as SupportTicket["status"]);

    return NextResponse.json({
      success: true,
      message: `Statut du ticket mis à jour : ${status}.`,
      ticket: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur mise à jour statut ticket." },
      { status: 500 }
    );
  }
}
