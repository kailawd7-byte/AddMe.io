import { describe, it, expect } from "vitest";
import { signUpSchema, linkSocialAccountSchema, resetPasswordSchema } from "../src/lib/validation";
import {
  generateSecureToken,
  generateSocialVerificationCode,
  normalizeSocialIdentifier,
} from "../src/lib/security";
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "../src/lib/auth";

describe("Validation des entrées & Règles Métier", () => {
  it("valide une inscription avec des données valides", () => {
    const valid = signUpSchema.safeParse({
      email: "test@example.com",
      password: "Password123",
    });
    expect(valid.success).toBe(true);
  });

  it("rejette un mot de passe trop court ou sans chiffre", () => {
    const shortPass = signUpSchema.safeParse({
      email: "test@example.com",
      password: "short",
    });
    expect(shortPass.success).toBe(false);

    const noNumber = signUpSchema.safeParse({
      email: "test@example.com",
      password: "PasswordOnlyLetters",
    });
    expect(noNumber.success).toBe(false);
  });

  it("rejette une adresse email invalide", () => {
    const badEmail = signUpSchema.safeParse({
      email: "not-an-email",
      password: "Password123",
    });
    expect(badEmail.success).toBe(false);
  });

  it("valide et restreint les plateformes à TIKTOK et YOUTUBE uniquement", () => {
    const validTikTok = linkSocialAccountSchema.safeParse({
      platform: "TIKTOK",
      identifier: "creator_pro",
    });
    expect(validTikTok.success).toBe(true);

    const validYouTube = linkSocialAccountSchema.safeParse({
      platform: "YOUTUBE",
      identifier: "CreatorChannel",
    });
    expect(validYouTube.success).toBe(true);

    const invalidPlatform = linkSocialAccountSchema.safeParse({
      platform: "INSTAGRAM", // Hors périmètre MVP
      identifier: "creator_pro",
    });
    expect(invalidPlatform.success).toBe(false);
  });

  it("normalise correctement les identifiants de comptes sociaux", () => {
    expect(normalizeSocialIdentifier("TIKTOK", "@SuperCreator")).toBe("supercreator");
    expect(normalizeSocialIdentifier("YOUTUBE", " @ChannelHandle ")).toBe("ChannelHandle");
  });
});

describe("Sécurité & Cryptographie", () => {
  it("génère des codes de bio au format 'ADDME-XXXXX'", () => {
    const code = generateSocialVerificationCode();
    expect(code).toMatch(/^ADDME-[A-Z0-9]{5}$/);
  });

  it("génère des codes uniques distincts à chaque appel", () => {
    const code1 = generateSocialVerificationCode();
    const code2 = generateSocialVerificationCode();
    expect(code1).not.toBe(code2);
  });

  it("hache et vérifie les mots de passe avec l'algorithme scrypt", async () => {
    const password = "SuperSecretPassword2026!";
    const hash = await hashPassword(password);

    expect(hash).toContain(":");
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("WrongPassword123!", hash)).toBe(false);
  });

  it("génère et vérifie les tokens de session JWT signés", () => {
    const payload = { userId: "usr_12345", email: "user@addme.io", role: "USER" };
    const token = signSessionToken(payload);

    expect(typeof token).toBe("string");
    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe("usr_12345");
    expect(verified?.email).toBe("user@addme.io");
  });
});

