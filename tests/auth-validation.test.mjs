import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { signUpSchema, linkSocialAccountSchema } from "../src/lib/validation.ts";
import {
  generateSecureToken,
  generateSocialVerificationCode,
  normalizeSocialIdentifier,
} from "../src/lib/security.ts";
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
} from "../src/lib/crypto-auth.ts";

describe("Validation des entrées & Règles Métier", () => {
  it("valide une inscription avec des données valides", () => {
    const valid = signUpSchema.safeParse({
      email: "test@example.com",
      password: "Password123",
    });
    assert.equal(valid.success, true);
  });

  it("rejette un mot de passe trop court ou sans chiffre", () => {
    const shortPass = signUpSchema.safeParse({
      email: "test@example.com",
      password: "short",
    });
    assert.equal(shortPass.success, false);

    const noNumber = signUpSchema.safeParse({
      email: "test@example.com",
      password: "PasswordOnlyLetters",
    });
    assert.equal(noNumber.success, false);
  });

  it("rejette une adresse email invalide", () => {
    const badEmail = signUpSchema.safeParse({
      email: "not-an-email",
      password: "Password123",
    });
    assert.equal(badEmail.success, false);
  });

  it("valide et restreint les plateformes à TIKTOK et YOUTUBE uniquement", () => {
    const validTikTok = linkSocialAccountSchema.safeParse({
      platform: "TIKTOK",
      identifier: "creator_pro",
    });
    assert.equal(validTikTok.success, true);

    const validYouTube = linkSocialAccountSchema.safeParse({
      platform: "YOUTUBE",
      identifier: "CreatorChannel",
    });
    assert.equal(validYouTube.success, true);

    const invalidPlatform = linkSocialAccountSchema.safeParse({
      platform: "INSTAGRAM", // Hors périmètre MVP
      identifier: "creator_pro",
    });
    assert.equal(invalidPlatform.success, false);
  });

  it("normalise correctement les identifiants de comptes sociaux", () => {
    assert.equal(normalizeSocialIdentifier("TIKTOK", "@SuperCreator"), "supercreator");
    assert.equal(normalizeSocialIdentifier("YOUTUBE", " @ChannelHandle "), "ChannelHandle");
  });
});

describe("Sécurité & Cryptographie", () => {
  it("génère des codes de bio au format 'ADDME-XXXXX'", () => {
    const code = generateSocialVerificationCode();
    assert.match(code, /^ADDME-[A-Z0-9]{5}$/);
  });

  it("génère des codes uniques distincts à chaque appel", () => {
    const code1 = generateSocialVerificationCode();
    const code2 = generateSocialVerificationCode();
    assert.notEqual(code1, code2);
  });

  it("hache et vérifie les mots de passe avec l'algorithme scrypt", async () => {
    const password = "SuperSecretPassword2026!";
    const hash = await hashPassword(password);

    assert.ok(hash.includes(":"));
    assert.equal(await verifyPassword(password, hash), true);
    assert.equal(await verifyPassword("WrongPassword123!", hash), false);
  });

  it("génère et vérifie les tokens de session JWT signés", () => {
    const payload = { userId: "usr_12345", email: "user@addme.io", role: "USER" };
    const token = signSessionToken(payload);

    assert.equal(typeof token, "string");
    const verified = verifySessionToken(token);
    assert.ok(verified !== null);
    assert.equal(verified?.userId, "usr_12345");
    assert.equal(verified?.email, "user@addme.io");
  });
});
