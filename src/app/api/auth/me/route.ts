import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Calcul du solde de points disponible depuis la table Ledger (Append-only)
  const ledgerAggregate = await prisma.ledgerEntry.aggregate({
    where: { userId: user.id },
    _sum: { amount: true },
  });
  const balance = ledgerAggregate._sum.amount ?? 0.0;

  // Calcul des points en attente de rétention (24h)
  const pendingRetentionCompletions = await prisma.taskCompletion.findMany({
    where: {
      workerUserId: user.id,
      status: "PENDING_RETENTION",
    },
    select: { rewardPoints: true },
  });
  const pendingPoints = pendingRetentionCompletions.reduce(
    (acc, curr) => acc + curr.rewardPoints,
    0.0
  );

  // Récupération des comptes sociaux liés
  const socialAccounts = await prisma.socialAccount.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      platform: true,
      identifier: true,
      verificationCode: true,
      status: true,
      verifiedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      status: user.status,
      reputationScore: user.reputationScore,
      dailyTasksCompleted: user.dailyTasksCompleted,
      createdAt: user.createdAt,
      balance,
      pendingPoints,
      socialAccounts,
    },
  });
}

