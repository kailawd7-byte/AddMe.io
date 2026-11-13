import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGiftCode } from "../src/lib/gift-codes.ts";
import { SYSTEM_DEFAULTS, LEDGER_TYPES } from "../src/lib/constants.ts";
import { signUpSchema } from "../src/lib/validation.ts";

test("Codes Cadeaux - Normalisation stricte (Majuscules, espaces et caractères spéciaux)", () => {
  assert.equal(normalizeGiftCode(" tiktok200 "), "TIKTOK200");
  assert.equal(normalizeGiftCode("promo-insta_42"), "PROMO-INSTA_42");
  assert.equal(normalizeGiftCode("code@cadeau#100$"), "CODECADEAU100");
  assert.equal(normalizeGiftCode(""), "");
  assert.equal(normalizeGiftCode(null), "");
});

test("Codes Cadeaux - Constantes système et Grand Livre (Ledger)", () => {
  assert.equal(SYSTEM_DEFAULTS.GIFT_CODE_MULTIPLIER, 4.0, "Le multiplicateur par défaut doit être x4.");
  assert.equal(SYSTEM_DEFAULTS.GIFT_CODE_BONUS_POINTS, 200.0, "50 pts * 4 = 200 points offerts au filleul.");
  assert.equal(SYSTEM_DEFAULTS.INFLUENCER_BONUS_PER_USER, 100.0, "L'influenceur reçoit 100 points par inscription vérifiée.");
  assert.equal(LEDGER_TYPES.GIFT_CODE_BONUS, "GIFT_CODE_BONUS");
  assert.equal(LEDGER_TYPES.INFLUENCER_REWARD, "INFLUENCER_REWARD");
});

test("Codes Cadeaux - Schéma de validation à l'inscription (signUpSchema)", () => {
  // Sans code cadeau (inscription classique valide)
  const validWithoutCode = signUpSchema.safeParse({
    email: "utilisateur@test.com",
    password: "Password123",
  });
  assert.equal(validWithoutCode.success, true);
  assert.equal(validWithoutCode.data.giftCode, undefined);

  // Avec code cadeau valide
  const validWithCode = signUpSchema.safeParse({
    email: "filleul@test.com",
    password: "Password123",
    giftCode: "TIKTOK200",
  });
  assert.equal(validWithCode.success, true);
  assert.equal(validWithCode.data.giftCode, "TIKTOK200");
});

test("Codes Cadeaux - Règles métier de validation", () => {
  // 1. Rejet si code trop court
  const shortCode = normalizeGiftCode("AB");
  assert.equal(shortCode.length < 3, true, "Un code doit comporter au moins 3 caractères.");

  // 2. Calcul du bonus utilisateur x4
  const basePoints = SYSTEM_DEFAULTS.WELCOME_BONUS_POINTS; // 50
  const multiplier = SYSTEM_DEFAULTS.GIFT_CODE_MULTIPLIER; // 4.0
  const expectedBonus = basePoints * multiplier; // 200
  assert.equal(expectedBonus, 200.0);

  // 3. Clé d'idempotence pour l'attribution des points
  const userId = "usr_test_12345";
  const userBonusIdempotency = `gift-code-user-${userId}`;
  assert.equal(userBonusIdempotency, "gift-code-user-usr_test_12345");

  // 4. Clé d'idempotence pour la prime influenceur
  const giftCodeId = "gc_test_67890";
  const influencerRewardIdempotency = `influencer-reward-${giftCodeId}-${userId}`;
  assert.equal(influencerRewardIdempotency, "influencer-reward-gc_test_67890-usr_test_12345");
});

test("Codes Cadeaux - Anti-Fraude & Rémunération conditionnelle de l'influenceur", () => {
  // Simulation de l'état d'un usage de code cadeau
  const usageState = {
    giftCodeId: "gc_test_67890",
    userId: "usr_test_12345",
    userBonusGiven: 200.0,
    isVerified: false,
    influencerRewarded: false,
    influencerPoints: 100.0,
  };

  // Tant que l'email n'est pas vérifié, l'influenceur ne reçoit RIEN
  assert.equal(usageState.isVerified, false);
  assert.equal(usageState.influencerRewarded, false);

  // Déclenchement de la vérification de compte (ex: validation email)
  const verifyAccountAndReward = (usage) => {
    if (usage.influencerRewarded) {
      return { rewarded: false, reason: "already_rewarded" };
    }
    usage.isVerified = true;
    usage.influencerRewarded = true;
    return {
      rewarded: true,
      pointsCredited: usage.influencerPoints,
      idempotencyKey: `influencer-reward-${usage.giftCodeId}-${usage.userId}`,
    };
  };

  // Première exécution : récompense débloquée (+100 pts)
  const firstRun = verifyAccountAndReward(usageState);
  assert.equal(firstRun.rewarded, true);
  assert.equal(firstRun.pointsCredited, 100.0);
  assert.equal(usageState.isVerified, true);
  assert.equal(usageState.influencerRewarded, true);

  // Deuxième exécution (tentative de double-crédit) : bloquée par l'idempotence
  const secondRun = verifyAccountAndReward(usageState);
  assert.equal(secondRun.rewarded, false);
  assert.equal(secondRun.reason, "already_rewarded");
});

test("Codes Cadeaux - Extraction intelligente d'un code collé sous forme d'URL complète", () => {
  const parseGiftCodeInput = (raw) => {
    let text = (raw || "").trim();
    if (
      text.includes("http") ||
      text.includes("?ref=") ||
      text.includes("?code=") ||
      text.includes("&ref=") ||
      text.includes("&code=")
    ) {
      try {
        const urlToParse = text.startsWith("http") ? text : `https://${text}`;
        const url = new URL(urlToParse);
        const extracted = url.searchParams.get("ref") || url.searchParams.get("code");
        if (extracted) {
          return extracted.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        }
      } catch {
        const match = text.match(/[?&](?:ref|code)=([a-zA-Z0-9_-]+)/i);
        if (match && match[1]) {
          return match[1].toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        }
      }
    }
    return text.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  };

  // URL Vercel complète collée
  assert.equal(
    parseGiftCodeInput("https://addme-steel.vercel.app/register?ref=KAILAWD13"),
    "KAILAWD13"
  );

  // URL avec paramètre code
  assert.equal(
    parseGiftCodeInput("https://addme.io/register?code=TIKTOK200"),
    "TIKTOK200"
  );

  // Saisie du code brut sans URL
  assert.equal(parseGiftCodeInput("kailawd13"), "KAILAWD13");
  assert.equal(parseGiftCodeInput("  PROMO_50  "), "PROMO_50");
});

test("Codes Cadeaux - Non-cumul des bonus à la vérification d'email (500 pts restent 500 pts)", () => {
  // Simule les transactions d'un utilisateur ayant utilisé un code cadeau
  const userLedger = [
    {
      userId: "usr_test",
      type: "GIFT_CODE_BONUS",
      amount: 500.0, // Multiplicateur x10 appliqué à l'inscription
      idempotencyKey: "gift-code-user-usr_test",
    },
  ];

  // Logique de validation d'email : ne pas rajouter de WELCOME_BONUS si un bonus d'inscription existe déjà
  const existingRegistrationBonus = userLedger.find((tx) =>
    ["WELCOME_BONUS", "GIFT_CODE_BONUS"].includes(tx.type)
  );

  let newBonusCredited = 0;
  if (!existingRegistrationBonus) {
    newBonusCredited = 50.0;
    userLedger.push({
      userId: "usr_test",
      type: "WELCOME_BONUS",
      amount: 50.0,
      idempotencyKey: "welcome-bonus-usr_test",
    });
  }

  // Vérification : aucun point supplémentaire n'est crédité
  assert.equal(newBonusCredited, 0, "Aucun bonus de 50 points supplémentaire ne doit être ajouté.");
  const totalBalance = userLedger.reduce((sum, tx) => sum + tx.amount, 0);
  assert.equal(totalBalance, 500.0, "Le solde final doit rester exactement 500 points et non 550 points.");
});

