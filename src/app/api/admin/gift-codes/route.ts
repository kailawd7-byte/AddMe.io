import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listAllGiftCodes, createGiftCodeAdmin } from "@/lib/gift-codes";

/**
 * Endpoint Admin : /api/admin/gift-codes
 * GET  : Liste tous les codes cadeaux et statistiques d'utilisation
 * POST : Création d'un nouveau code cadeau avec liaison obligatoire à un compte utilisateur
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé : réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const codes = await listAllGiftCodes();
    return NextResponse.json({ codes });
  } catch (error: any) {
    console.error("Erreur listAllGiftCodes:", error);
    return NextResponse.json({ error: error.message || "Erreur récupération codes cadeaux." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé : réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      code,
      influencerEmail,
      description,
      multiplier = 4.0,
      influencerBonus = 100.0,
      maxUses,
      expiresAt,
    } = body;

    const newCode = await createGiftCodeAdmin({
      code,
      influencerEmail,
      description,
      multiplier: Number(multiplier) || 4.0,
      influencerBonus: Number(influencerBonus) || 100.0,
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt || null,
      adminId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Code cadeau « ${newCode.code} » créé et affilié avec succès à ${newCode.influencer.email}.`,
      giftCode: newCode,
    });
  } catch (error: any) {
    console.error("Erreur createGiftCodeAdmin:", error);
    return NextResponse.json({ error: error.message || "Impossible de créer le code cadeau." }, { status: 400 });
  }
}

