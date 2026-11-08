export const PLATFORMS = {
  TIKTOK: "TIKTOK",
  YOUTUBE: "YOUTUBE",
  INSTAGRAM: "INSTAGRAM",
} as const;

export type PlatformType = keyof typeof PLATFORMS;

export const ACTION_TYPES = {
  LIKE: "LIKE",
  COMMENT: "COMMENT",
  SUBSCRIBE: "SUBSCRIBE",
} as const;

export type ActionType = keyof typeof ACTION_TYPES;

export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  BANNED: "BANNED",
} as const;

export const SOCIAL_ACCOUNT_STATUS = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;

export const CAMPAIGN_STATUS = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const TASK_COMPLETION_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  PENDING_RETENTION: "PENDING_RETENTION",
  APPROVED: "APPROVED",
  FLAGGED: "FLAGGED",
  REJECTED: "REJECTED",
} as const;

export const LEDGER_TYPES = {
  WELCOME_BONUS: "WELCOME_BONUS",
  CAMPAIGN_DEBIT: "CAMPAIGN_DEBIT",
  CAMPAIGN_REFUND: "CAMPAIGN_REFUND",
  TASK_REWARD: "TASK_REWARD",
  PACK_PURCHASE: "PACK_PURCHASE",
  ADMIN_ADJUSTMENT: "ADMIN_ADJUSTMENT",
} as const;

export const SYSTEM_DEFAULTS = {
  WELCOME_BONUS_POINTS: 50.0, // 50 points offerts à l'inscription
  DEFAULT_REWARD_PER_TASK: 1.0,
  DEFAULT_COST_PER_TASK: 1.3,
  CAMPAIGN_DAILY_DURATION_FEE: 0.5, // 0.5 point par jour de diffusion
  DEFAULT_CAMPAIGN_DURATION_DAYS: 5,
  MIN_TASK_DURATION_SECONDS: 20,
  RETENTION_PERIOD_HOURS: 0, // Validation directe des points
  RANDOM_AUDIT_SAMPLE_RATE: 0.1, // 10% de demandes de capture
  BASE_DAILY_TASK_LIMIT: 50, // Plafond initial par travailleur
  BASE_DAILY_CAMPAIGN_CAP: 20, // Plafond d'actions quotidiennes par campagne
};

export interface PointPack {
  id: "PACK_STARTER" | "PACK_CREATOR" | "PACK_PRO";
  name: string;
  points: number;
  priceInCents: number;
  priceFormatted: string;
  priceInFcfa: number;
  priceFcfaFormatted: string;
  description: string;
  popular?: boolean;
  badge?: string;
  equivalentLikes: number;
  equivalentComments: number;
}

export const POINT_PACKS: PointPack[] = [
  {
    id: "PACK_STARTER",
    name: "Pack Découverte",
    points: 150,
    priceInCents: 499,
    priceFormatted: "4,99 €",
    priceInFcfa: 3000,
    priceFcfaFormatted: "3 000 FCFA",
    description: "Idéal pour booster vos premières publications et tester la plateforme.",
    popular: false,
    equivalentLikes: 150,
    equivalentComments: 110,
  },
  {
    id: "PACK_CREATOR",
    name: "Pack Créateur",
    points: 500,
    priceInCents: 1299,
    priceFormatted: "12,99 €",
    priceInFcfa: 8500,
    priceFcfaFormatted: "8 500 FCFA",
    description: "Le pack recommandé pour déclencher les algorithmes sur une publication clé.",
    popular: true,
    badge: "Le plus populaire",
    equivalentLikes: 500,
    equivalentComments: 375,
  },
  {
    id: "PACK_PRO",
    name: "Pack Influence",
    points: 2000,
    priceInCents: 3499,
    priceFormatted: "34,99 €",
    priceInFcfa: 22500,
    priceFcfaFormatted: "22 500 FCFA",
    description: "Tarif optimisé par point pour les créateurs qui publient régulièrement du contenu ambitieux.",
    popular: false,
    badge: "Meilleure valeur / pt",
    equivalentLikes: 2000,
    equivalentComments: 1500,
  },
];

export function getPackById(packId: string): PointPack | undefined {
  return POINT_PACKS.find((p) => p.id === packId);
}


