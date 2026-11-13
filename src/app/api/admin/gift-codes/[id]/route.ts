import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { isActive, description, maxUses, expiresAt } = body;

    const updated = await prisma.giftCode.update({
      where: { id },
      data: {
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(typeof description === "string" ? { description } : {}),
        ...(maxUses !== undefined ? { maxUses: maxUses ? Number(maxUses) : null } : {}),
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "GIFT_CODE_UPDATED",
        details: JSON.stringify({ giftCodeId: id, code: updated.code, changes: body }),
      },
    });

    return NextResponse.json({ success: true, giftCode: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur mise à jour code cadeau" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const codeToDelete = await prisma.giftCode.findUnique({ where: { id } });
    if (!codeToDelete) {
      return NextResponse.json({ error: "Code cadeau introuvable" }, { status: 404 });
    }

    await prisma.giftCode.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "GIFT_CODE_DELETED",
        details: JSON.stringify({ giftCodeId: id, code: codeToDelete.code }),
      },
    });

    return NextResponse.json({ success: true, message: `Code ${codeToDelete.code} supprimé avec succès.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur suppression code cadeau" }, { status: 400 });
  }
}

