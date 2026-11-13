import { prisma } from "./prisma.ts";
import { SYSTEM_DEFAULTS, LEDGER_TYPES } from "./constants.ts";

export interface RateConfig {
  cost: number;
  reward: number;
}

/**
 * Récupère le solde disponible actuel d'un utilisateur à partir de la somme du ledger immuable
 */
export async function getUserBalance(userId: string): Promise<number> {
  const aggregate = await prisma.ledgerEntry.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return aggregate._sum.amount ?? 0.0;
}

/**
 * Récupère les tarifs configurés (coût créateur et récompense travailleur) pour une action donnée
 */
export async function getActionRates(actionType: "LIKE" | "COMMENT" | "SUBSCRIBE"): Promise<RateConfig> {
  const costKey = `cost_${actionType.toLowerCase()}`;
  const rewardKey = `reward_${actionType.toLowerCase()}`;

  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: [costKey, rewardKey] },
    },
  });

  let cost = SYSTEM_DEFAULTS.DEFAULT_COST_PER_TASK;
  let reward = SYSTEM_DEFAULTS.DEFAULT_REWARD_PER_TASK;

  // Valeurs par défaut différenciées selon l'effort de l'action
  if (actionType === "LIKE") {
    cost = 1.3;
    reward = 1.0;
  } else if (actionType === "COMMENT") {
    cost = 1.8;
    reward = 1.4;
  } else if (actionType === "SUBSCRIBE") {
    cost = 2.5;
    reward = 2.0;
  }

  for (const s of settings) {
    const val = parseFloat(s.value);
    if (!isNaN(val)) {
      if (s.key === costKey) cost = val;
      if (s.key === rewardKey) reward = val;
    }
  }

  // Règle d'or économique : la récompense doit toujours rester inférieure au coût
  if (reward >= cost) {
    reward = Number((cost * 0.75).toFixed(1));
  }

  return { cost, reward };
}

export interface RecordTransactionParams {
  userId: string;
  amount: number; // Positif pour crédit, négatif pour débit
  type: keyof typeof LEDGER_TYPES;
  referenceType?: "CAMPAIGN" | "TASK_COMPLETION" | "PAYMENT" | "AUDIT" | "SYSTEM" | "GIFT_CODE" | "GIFT_CODE_REFERRAL";
  referenceId?: string;
  idempotencyKey?: string;
  description: string;
}

/**
 * Exécute une écriture atomique et idempotente dans le Ledger.
 * Empêche formellement tout solde négatif et tout double débit/crédit.
 */
export async function recordLedgerTransaction(
  params: RecordTransactionParams,
  txClient?: any
) {
  const db = txClient || prisma;
  const effectiveIdempotencyKey =
    params.idempotencyKey || `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const effectiveReferenceType = params.referenceType || "SYSTEM";

  const execute = async (tx: any) => {
    // 1. Vérification d'idempotence : si la transaction a déjà été enregistrée, on la retourne
    const existingEntry = await tx.ledgerEntry.findUnique({
      where: { idempotencyKey: effectiveIdempotencyKey },
    });

    if (existingEntry) {
      const currentBalance = await getUserBalance(params.userId);
      return { entry: existingEntry, balance: currentBalance, isDuplicate: true };
    }

    // 2. En cas de débit (montant négatif), contrôle absolu du solde pour éviter tout découvert
    if (params.amount < 0) {
      const aggregate = await tx.ledgerEntry.aggregate({
        where: { userId: params.userId },
        _sum: { amount: true },
      });
      const currentBalance = aggregate._sum.amount ?? 0.0;
      const resultingBalance = currentBalance + params.amount;

      // Tolérance à 0.0001 pour les arrondis flottants
      if (resultingBalance < -0.0001) {
        throw new Error(
          `SOLDE_INSUFFISANT: Solde actuel (${currentBalance.toFixed(1)} pts) insuffisant pour débiter ${Math.abs(params.amount).toFixed(1)} pts.`
        );
      }
    }

    // 3. Insertion de la ligne immuable dans le ledger
    const entry = await tx.ledgerEntry.create({
      data: {
        userId: params.userId,
        amount: params.amount,
        type: params.type,
        referenceType: effectiveReferenceType,
        referenceId: params.referenceId || null,
        idempotencyKey: effectiveIdempotencyKey,
        description: params.description,
      },
    });

    // 4. Calcul du nouveau solde
    const newAggregate = await tx.ledgerEntry.aggregate({
      where: { userId: params.userId },
      _sum: { amount: true },
    });
    const newBalance = newAggregate._sum.amount ?? 0.0;

    return { entry, balance: newBalance, isDuplicate: false };
  };

  // Si on est déjà dans une transaction externe, on l'utilise, sinon on ouvre une $transaction
  if (txClient) {
    return execute(txClient);
  } else {
    return prisma.$transaction(execute);
  }
}
