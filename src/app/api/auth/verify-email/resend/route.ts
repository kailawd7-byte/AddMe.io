import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmailVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const sessionUser = await getCurrentUser();
    let emailToResend = sessionUser?.email;

    if (!emailToResend) {
      const body = await req.json().catch(() => ({}));
      emailToResend = body.email;
    }

    if (!emailToResend) {
      return NextResponse.json(
        { error: "Veuillez vous connecter ou préciser votre adresse email." },
        { status: 400 }
      );
    }

    // Rate limiting pour éviter le spam (max 2 renvois par tranche de 5 minutes)
    const rateLimit = await checkRateLimit(`resend-verify:${clientIp}`, 2, 5);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Veuillez patienter quelques minutes avant de demander un nouveau code." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: emailToResend },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Si un compte existe avec cet email, un nouveau code a été envoyé.",
      });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({
        success: true,
        message: "Votre adresse email est déjà validée.",
      });
    }

    // Génération d'un nouveau code 6 chiffres valide 24h
    const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: newVerificationCode,
        emailVerificationExpiresAt: newExpiresAt,
      },
    });

    const origin =
      req.nextUrl.origin ||
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const verificationUrl = `${origin}/verify-email?code=${newVerificationCode}`;

    // Envoi sécurisé
    await sendEmailVerificationEmail({
      toEmail: user.email,
      verificationCode: newVerificationCode,
      verificationUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Un nouveau code de vérification vous a été envoyé par email.",
    });
  } catch (error) {
    console.error("Erreur renvoi code vérification:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du renvoi du code." },
      { status: 500 }
    );
  }
}

