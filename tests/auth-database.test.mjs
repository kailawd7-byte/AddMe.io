import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.ts";
import { hashPassword, verifyPassword } from "../src/lib/crypto-auth.ts";
import { generateSecureToken, generateSocialVerificationCode, normalizeSocialIdentifier } from "../src/lib/security.ts";

describe("Workflow Intégration Base de Données : Auth & Liaison Sociale", () => {
  const testEmail = `test_${Date.now()}@addme.io`;
  let createdUserId = "";
  let verificationToken = "";

  it("1. Crée un utilisateur avec mot de passe haché et token d'activation", async () => {
    const passwordHash = await hashPassword("TestPassword123!");
    verificationToken = generateSecureToken(32);

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    assert.ok(user.id);
    createdUserId = user.id;
    assert.equal(user.email, testEmail);
    assert.equal(user.isEmailVerified, false);
  });

  it("2. Valide l'email et crédite atomiquement le bonus de 50 points au ledger", async () => {
    const idempotencyKey = `welcome-bonus-${createdUserId}`;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: createdUserId },
        data: { isEmailVerified: true, emailVerificationToken: null },
      });

      await tx.ledgerEntry.create({
        data: {
          userId: createdUserId,
          amount: 50.0,
          type: "WELCOME_BONUS",
          referenceType: "SYSTEM",
          referenceId: createdUserId,
          idempotencyKey,
          description: "Bonus de bienvenue : +50 points",
        },
      });
    });

    const aggregate = await prisma.ledgerEntry.aggregate({
      where: { userId: createdUserId },
      _sum: { amount: true },
    });

    assert.equal(aggregate._sum.amount, 50.0);
  });

  it("3. Garantit l'idempotence : impossible de doubler le bonus de bienvenue", async () => {
    const idempotencyKey = `welcome-bonus-${createdUserId}`;

    // Tentative de re-crédit avec la même idempotencyKey
    let errorCaught = false;
    try {
      await prisma.ledgerEntry.create({
        data: {
          userId: createdUserId,
          amount: 50.0,
          type: "WELCOME_BONUS",
          referenceType: "SYSTEM",
          referenceId: createdUserId,
          idempotencyKey,
          description: "Tentative de doublon bonus",
        },
      });
    } catch {
      errorCaught = true;
    }

    assert.equal(errorCaught, true);

    // Le solde doit toujours être strictement de 10.0
    const aggregate = await prisma.ledgerEntry.aggregate({
      where: { userId: createdUserId },
      _sum: { amount: true },
    });
    assert.equal(aggregate._sum.amount, 10.0);
  });

  it("4. Lie un compte TikTok avec un code de bio unique", async () => {
    const code = generateSocialVerificationCode();
    const handle = normalizeSocialIdentifier("TIKTOK", `@creator_${Date.now()}`);

    const socialAcc = await prisma.socialAccount.create({
      data: {
        userId: createdUserId,
        platform: "TIKTOK",
        identifier: handle,
        verificationCode: code,
        status: "PENDING_VERIFICATION",
      },
    });

    assert.ok(socialAcc.id);
    assert.equal(socialAcc.status, "PENDING_VERIFICATION");
    assert.ok(socialAcc.verificationCode.startsWith("ADDME-"));

    // Vérification de la propriété (passage à VERIFIED)
    const verifiedAcc = await prisma.socialAccount.update({
      where: { id: socialAcc.id },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    assert.equal(verifiedAcc.status, "VERIFIED");
    assert.ok(verifiedAcc.verifiedAt !== null);
  });

  it("5. Règle d'or : Rejette strictement la réassignation du même compte à un autre utilisateur", async () => {
    const uniqueHandle = `unique_channel_${Date.now()}`;

    // Utilisateur 1 lie le compte YouTube
    await prisma.socialAccount.create({
      data: {
        userId: createdUserId,
        platform: "YOUTUBE",
        identifier: uniqueHandle,
        verificationCode: generateSocialVerificationCode(),
        status: "VERIFIED",
      },
    });

    // Création d'un second utilisateur
    const user2 = await prisma.user.create({
      data: {
        email: `user2_${Date.now()}@addme.io`,
        passwordHash: "hash123",
      },
    });

    // Utilisateur 2 essaie de lier le même compte YouTube
    let conflictCaught = false;
    try {
      await prisma.socialAccount.create({
        data: {
          userId: user2.id,
          platform: "YOUTUBE",
          identifier: uniqueHandle,
          verificationCode: generateSocialVerificationCode(),
          status: "PENDING_VERIFICATION",
        },
      });
    } catch {
      conflictCaught = true;
    }

    assert.equal(conflictCaught, true);
  });
});

