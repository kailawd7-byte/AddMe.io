import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const account = await prisma.socialAccount.findUnique({
      where: { id },
      include: {
        campaigns: {
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Compte social introuvable." }, { status: 404 });
    }

    if (account.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Empêcher la suppression si des campagnes actives sont en cours
    if (account.campaigns.length > 0) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer ce compte : des campagnes actives y sont associées. Mettez-les en pause ou annulez-les d'abord.",
        },
        { status: 400 }
      );
    }

    await prisma.socialAccount.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Compte social retiré avec succès.",
    });
  } catch (error) {
    console.error("Erreur suppression compte social:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression." },
      { status: 500 }
    );
  }
}

