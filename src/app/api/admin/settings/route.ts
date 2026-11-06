import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSystemSettings, updateSystemSetting } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé : réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur récupération paramètres." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé : réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Clé et valeur requises." }, { status: 400 });
    }

    // Contrôle économique : si on modifie cost ou reward, vérifier que reward < cost
    if (key.startsWith("reward_") || key.startsWith("cost_")) {
      const numVal = parseFloat(value);
      if (isNaN(numVal) || numVal <= 0) {
        return NextResponse.json({ error: "Le tarif doit être un nombre positif." }, { status: 400 });
      }
    }

    const updated = await updateSystemSetting(user.id, key, String(value), description);

    return NextResponse.json({
      success: true,
      message: `Paramètre ${key} mis à jour avec succès.`,
      setting: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur mise à jour paramètre." }, { status: 400 });
  }
}

