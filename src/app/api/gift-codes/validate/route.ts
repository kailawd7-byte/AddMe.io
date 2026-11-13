import { NextRequest, NextResponse } from "next/server";
import { validateGiftCode } from "@/lib/gift-codes";

/**
 * Validation publique d'un code cadeau (appelé en direct lors de la saisie sur /register)
 * Endpoint : GET /api/gift-codes/validate?code=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code") || searchParams.get("c") || "";

    if (!code.trim()) {
      return NextResponse.json({
        valid: false,
        message: "Veuillez renseigner un code cadeau.",
      });
    }

    const result = await validateGiftCode(code);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erreur validation code cadeau:", error);
    return NextResponse.json(
      { valid: false, message: "Erreur lors de la vérification du code cadeau." },
      { status: 500 }
    );
  }
}

