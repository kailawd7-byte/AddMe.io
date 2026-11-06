import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserBalance } from "@/lib/ledger";
import { POINT_PACKS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const balance = await getUserBalance(user.id);

  return NextResponse.json({
    balance,
    packs: POINT_PACKS,
  });
}

