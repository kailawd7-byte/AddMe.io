import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserBalance, getActionRates } from "@/lib/ledger";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const [balance, likeRates, commentRates, subscribeRates] = await Promise.all([
    getUserBalance(user.id),
    getActionRates("LIKE"),
    getActionRates("COMMENT"),
    getActionRates("SUBSCRIBE"),
  ]);

  return NextResponse.json({
    balance,
    rates: {
      LIKE: likeRates,
      COMMENT: commentRates,
      SUBSCRIBE: subscribeRates,
    },
  });
}

