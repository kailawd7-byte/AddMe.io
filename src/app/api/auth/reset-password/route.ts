import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = resetPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, password } = parseResult.data;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation est invalide ou a expiré." },
        { status: 400 }
      );
    }

    if (
      user.passwordResetExpiresAt &&
      user.passwordResetExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation a expiré. Veuillez refaire une demande." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.",
    });
  } catch (error) {
    console.error("Erreur reset-password:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la réinitialisation du mot de passe." },
      { status: 500 }
    );
  }
}

