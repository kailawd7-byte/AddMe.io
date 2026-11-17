/**
 * Utilitaires de formatage des nombres et des points pour AddMe.io (fr-FR)
 * - Séparateur de milliers avec espace insécable
 * - Élimination stricte des ".0" superflus ("2 600 pts", "2 000 points", "10 000 points")
 * - Conservation des décimales uniquement si non nulle (ex: "50,5 pts")
 */

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";

  const isInt = Number.isInteger(num) || Math.abs(num - Math.round(num)) < 0.001;

  return num.toLocaleString("fr-FR", {
    minimumFractionDigits: isInt ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function formatPoints(
  value: number | string | null | undefined,
  unit: string = "pts"
): string {
  const formatted = formatNumber(value);
  return unit ? `${formatted} ${unit}` : formatted;
}
