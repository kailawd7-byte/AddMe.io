import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateAdminUserStatus } from "@/lib/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé : réservé aux administrateurs." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { status, reason } = body;

    if (!status || !["ACTIVE", "SUSPENDED", "BANNED"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide (ACTIVE, SUSPENDED, BANNED)." }, { status: 400 });
    }

    const updated = await updateAdminUserStatus(
      user.id,
      id,
      status,
      reason || "Action administrative"
    );

    return NextResponse.json({
      success: true,
      message: `Statut utilisateur mis à jour vers ${status}.`,
      user: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur modification statut." }, { status: 400 });
  }
}

