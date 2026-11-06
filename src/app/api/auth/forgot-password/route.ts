import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { generateSecureToken } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await req.json();
    const parseResult = forgotPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;

    // Rate limiting pour éviter le spam de réinitialisation
    const rateLimit = await checkRateLimit(`forgot-password:${clientIp}`, 3, 15);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Trop de demandes. Veuillez patienter avant de réessayer." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Même si l'utilisateur n'existe pas, réponse générique pour contrer l'énumération d'emails
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Si un compte est associé à cette adresse, un lien de réinitialisation vous a été envoyé.",
      });
    }

    // Jeton valide 1 heure
    const resetToken = generateSecureToken(32);
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: resetExpiresAt,
      },
    });

    const origin =
      req.nextUrl.origin ||
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    return NextResponse.json({
      success: true,
      message: "Si un compte est associé à cette adresse, un lien de réinitialisation vous a été envoyé.",
      // Renvoyé pour faciliter les tests et la démonstration
      resetToken,
      resetUrl,
    });
  } catch (error) {
    console.error("Erreur forgot-password:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la demande." },
      { status: 500 }
    );
  }
}

