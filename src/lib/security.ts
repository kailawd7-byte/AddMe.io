import crypto from "crypto";

/**
 * Génère un jeton cryptographique hexadécimal sécurisé
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Génère un code unique de vérification de compte social pour la bio
 * Format : ADDME-XXXXX (5 caractères alphanumériques non-ambigus)
 */
export function generateSocialVerificationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  const randomBytes = crypto.randomBytes(5);
  for (let i = 0; i < 5; i++) {
    randomPart += chars[randomBytes[i] % chars.length];
  }
  return `ADDME-${randomPart}`;
}

/**
 * Normalise un identifiant de réseau social pour les 8 plateformes partenaires
 */
export function normalizeSocialIdentifier(
  platform: string,
  identifier: string
): string {
  let cleaned = identifier.trim();
  if (
    platform === "TIKTOK" ||
    platform === "INSTAGRAM" ||
    platform === "X" ||
    platform === "THREADS" ||
    platform === "SNAPCHAT"
  ) {
    cleaned = cleaned.replace(/^@/, "").toLowerCase();
  } else {
    cleaned = cleaned.replace(/^@/, "").trim();
  }
  return cleaned;
}

