import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { linkSocialAccountSchema } from "@/lib/validation";
import { generateSocialVerificationCode, normalizeSocialIdentifier } from "@/lib/security";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { campaigns: true },
      },
    },
  });

  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Veuillez vous connecter pour lier un compte." }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = linkSocialAccountSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Données de compte invalides",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { platform, identifier } = parseResult.data;
    const normalizedId = normalizeSocialIdentifier(platform, identifier);

    // Règle d'or : 1 compte social = 1 seul utilisateur sur la plateforme
    const existingGlobal = await prisma.socialAccount.findUnique({
      where: {
        platform_identifier: {
          platform,
          identifier: normalizedId,
        },
      },
      include: {
        user: { select: { email: true, id: true } },
      },
    });

    if (existingGlobal) {
      if (existingGlobal.userId === user.id) {
        return NextResponse.json(
          { error: `Vous avez déjà ajouté ce compte ${platform}.` },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: `Ce compte ${platform} (@${normalizedId}) est déjà associé à un autre utilisateur. Un compte social ne peut appartenir qu'à une seule personne sur AddMe.io.` },
          { status: 409 }
        );
      }
    }

    // Génération du code unique de vérification à mettre en bio
    const verificationCode = generateSocialVerificationCode();

    const newAccount = await prisma.socialAccount.create({
      data: {
        userId: user.id,
        platform,
        identifier: normalizedId,
        verificationCode,
        status: "PENDING_VERIFICATION",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Compte ${platform} ajouté avec succès ! Copiez le code ci-dessous et insérez-le dans votre bio/description.`,
      account: newAccount,
      instructions: {
        code: verificationCode,
        step1: `Ouvrez votre profil ${platform === "TIKTOK" ? "TikTok" : "YouTube"}.`,
        step2: `Ajoutez la mention "${verificationCode}" dans votre bio ou description de profil.`,
        step3: `Revenez sur cette page et cliquez sur "Vérifier la propriété". Une fois validé, vous pourrez effacer le code de votre bio.`,
      },
    });
  } catch (error) {
    console.error("Erreur ajout compte social:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'ajout du compte social." },
      { status: 500 }
    );
  }
}

