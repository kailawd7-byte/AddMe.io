import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserPaymentHistory } from "@/lib/payments";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const history = await getUserPaymentHistory(user.id);
    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Impossible de récupérer l'historique des paiements." },
      { status: 500 }
    );
  }
}

