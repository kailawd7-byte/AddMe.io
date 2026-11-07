import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.ts";
import { getUserBalance, recordLedgerTransaction, getActionRates } from "../src/lib/ledger.ts";
import { validateVideoPublicationUrl } from "../src/lib/video-url-validator.ts";
import { createCampaign, toggleCampaignStatus, cancelCampaign } from "../src/lib/campaigns.ts";
import { generateSecureToken, generateSocialVerificationCode } from "../src/lib/security.ts";

describe("Validation des URLs de Publications (TikTok & YouTube)", () => {
  it("accepte une URL de publication vidéo TikTok valide", () => {
    const res = validateVideoPublicationUrl(
      "TIKTOK",
      "https://www.tiktok.com/@coolcreator/video/7212345678901234567",
      "coolcreator"
    );
    assert.equal(res.valid, true);
    assert.equal(res.extractedId, "7212345678901234567");
  });

  it("rejette formellement un simple lien de profil TikTok", () => {
    const res = validateVideoPublicationUrl("TIKTOK", "https://www.tiktok.com/@coolcreator");
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes("PUBLICATIONS"));
  });

  it("rejette une vidéo TikTok n'appartenant pas au compte vérifié", () => {
    const res = validateVideoPublicationUrl(
      "TIKTOK",
      "https://www.tiktok.com/@othercreator/video/7212345678901234567",
      "my_verified_account"
    );
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes("appartient à @othercreator"));
  });

  it("accepte les différents formats de publications YouTube (Watch, Shorts, youtu.be)", () => {
    const watch = validateVideoPublicationUrl("YOUTUBE", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    assert.equal(watch.valid, true);
    assert.equal(watch.extractedId, "dQw4w9WgXcQ");

    const shorts = validateVideoPublicationUrl("YOUTUBE", "https://www.youtube.com/shorts/dQw4w9WgXcQ");
    assert.equal(shorts.valid, true);

    const youtudeBe = validateVideoPublicationUrl("YOUTUBE", "https://youtu.be/dQw4w9WgXcQ");
    assert.equal(youtudeBe.valid, true);
  });

  it("rejette formellement un simple lien de chaîne YouTube", () => {
    const channel1 = validateVideoPublicationUrl("YOUTUBE", "https://www.youtube.com/@MrBeast");
    assert.equal(channel1.valid, false);
    assert.ok(channel1.error?.includes("PUBLICATIONS"));

    const channel2 = validateVideoPublicationUrl("YOUTUBE", "https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA");
    assert.equal(channel2.valid, false);
  });
});

describe("Système de Points (Ledger Append-Only, Atomicité & Non-Solde Négatif)", () => {
  let testUserId = "";

  it("crée un utilisateur de test avec un solde initial de 20 points", async () => {
    const user = await prisma.user.create({
      data: {
        email: `ledger_test_${Date.now()}_${Math.random().toString(36).substring(7)}@addme.io`,
        passwordHash: "hash123",
        isEmailVerified: true,
      },
    });
    testUserId = user.id;

    const initialTx = await recordLedgerTransaction({
      userId: testUserId,
      amount: 20.0,
      type: "WELCOME_BONUS",
      referenceType: "SYSTEM",
      idempotencyKey: `init-${testUserId}`,
      description: "Crédit initial de test",
    });

    assert.equal(initialTx.balance, 20.0);
    assert.equal(await getUserBalance(testUserId), 20.0);
  });

  it("empêche strictement les soldes négatifs lors d'un débit excessif", async () => {
    let errorCaught = false;
    try {
      // Tentative de débiter 50 points alors que le solde n'est que de 20
      await recordLedgerTransaction({
        userId: testUserId,
        amount: -50.0,
        type: "CAMPAIGN_DEBIT",
        referenceType: "CAMPAIGN",
        idempotencyKey: `excessive-debit-${Date.now()}`,
        description: "Tentative de débit à découvert",
      });
    } catch (err) {
      errorCaught = true;
      assert.ok(err.message.includes("SOLDE_INSUFFISANT"));
    }

    assert.equal(errorCaught, true);

    // Le solde doit impérativement être resté intact à 20.0
    const balance = await getUserBalance(testUserId);
    assert.equal(balance, 20.0);
  });

  it("garantit l'idempotence des transactions financières", async () => {
    const key = `idempotent-debit-${Date.now()}`;

    // Premier débit de 5 points
    const firstCall = await recordLedgerTransaction({
      userId: testUserId,
      amount: -5.0,
      type: "CAMPAIGN_DEBIT",
      referenceType: "CAMPAIGN",
      idempotencyKey: key,
      description: "Débit de 5 points",
    });

    assert.equal(firstCall.isDuplicate, false);
    assert.equal(firstCall.balance, 15.0);

    // Répétition accidentelle du même débit avec la même clé d'idempotence
    const secondCall = await recordLedgerTransaction({
      userId: testUserId,
      amount: -5.0,
      type: "CAMPAIGN_DEBIT",
      referenceType: "CAMPAIGN",
      idempotencyKey: key,
      description: "Tentative de double débit",
    });

    assert.equal(secondCall.isDuplicate, true);
    assert.equal(await getUserBalance(testUserId), 15.0); // Le solde reste 15.0 et non 10.0 !
  });
});

describe("Cycle de Vie des Campagnes (Création, Débit, Pause, Annulation & Remboursement)", () => {
  let campaignUserId = "";
  let verifiedSocialAccountId = "";
  let verifiedHandle = "";
  let unverifiedSocialAccountId = "";
  let unverifiedHandle = "";
  let createdCampaignId = "";

  it("initialise l'environnement de test pour les campagnes", async () => {
    const user = await prisma.user.create({
      data: {
        email: `campaign_user_${Date.now()}_${Math.random().toString(36).substring(7)}@addme.io`,
        passwordHash: "hash123",
        isEmailVerified: true,
      },
    });
    campaignUserId = user.id;

    // Crédit de 50 points sur le compte
    await recordLedgerTransaction({
      userId: campaignUserId,
      amount: 50.0,
      type: "WELCOME_BONUS",
      referenceType: "SYSTEM",
      idempotencyKey: `credit-campaign-user-${campaignUserId}`,
      description: "Solde initial pour tests de campagne",
    });

    verifiedHandle = `testcreator_${Date.now()}`;
    unverifiedHandle = `unverified_${Date.now()}`;

    // Création d'un compte social vérifié
    const verified = await prisma.socialAccount.create({
      data: {
        userId: campaignUserId,
        platform: "TIKTOK",
        identifier: verifiedHandle,
        verificationCode: generateSocialVerificationCode(),
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });
    verifiedSocialAccountId = verified.id;

    // Création d'un compte social NON vérifié
    const unverified = await prisma.socialAccount.create({
      data: {
        userId: campaignUserId,
        platform: "TIKTOK",
        identifier: unverifiedHandle,
        verificationCode: generateSocialVerificationCode(),
        status: "PENDING_VERIFICATION",
      },
    });
    unverifiedSocialAccountId = unverified.id;
  });

  it("interdit la création de campagne si le compte social n'est pas vérifié", async () => {
    let errorCaught = false;
    try {
      await createCampaign({
        userId: campaignUserId,
        socialAccountId: unverifiedSocialAccountId,
        actionType: "LIKE",
        videoUrl: `https://www.tiktok.com/@${unverifiedHandle}/video/123456789012345`,
        totalQuantity: 10,
      });
    } catch (err) {
      errorCaught = true;
      assert.ok(err.message.includes("n'est pas encore vérifié"));
    }
    assert.equal(errorCaught, true);
  });

  it("crée une campagne, débite le coût exact du ledger et génère les tâches", async () => {
    const balanceBefore = await getUserBalance(campaignUserId);
    assert.equal(balanceBefore, 50.0);

    const campaign = await createCampaign({
      userId: campaignUserId,
      socialAccountId: verifiedSocialAccountId,
      actionType: "LIKE",
      videoUrl: `https://www.tiktok.com/@${verifiedHandle}/video/7198765432109876543`,
      totalQuantity: 10,
      dailyCap: 5,
    });

    createdCampaignId = campaign.id;
    assert.equal(campaign.status, "ACTIVE");
    assert.equal(campaign.totalQuantity, 10);
    assert.equal(campaign.completedQuantity, 0);
    assert.equal(campaign.costPerUnit, 1.0);
    assert.equal(campaign.totalCost, 12.5); // 10 * 1.0 + 5 * 0.5 fee = 12.5 points

    // Vérifie le solde déduit de 12.5 points : 50.0 - 12.5 = 37.5 points
    const balanceAfter = await getUserBalance(campaignUserId);
    assert.equal(balanceAfter, 37.5);

    // Vérifie que les 10 tâches ont bien été créées
    const tasksCount = await prisma.task.count({
      where: { campaignId: createdCampaignId, status: "AVAILABLE" },
    });
    assert.equal(tasksCount, 10);
  });

  it("met la campagne en pause puis la réactive", async () => {
    const paused = await toggleCampaignStatus(createdCampaignId, campaignUserId, "PAUSED");
    assert.equal(paused.status, "PAUSED");

    const resumed = await toggleCampaignStatus(createdCampaignId, campaignUserId, "ACTIVE");
    assert.equal(resumed.status, "ACTIVE");
  });

  it("annule la campagne et rembourse intégralement les points non consommés", async () => {
    const balanceBeforeCancel = await getUserBalance(campaignUserId);
    assert.equal(balanceBeforeCancel, 37.5);

    // Annulation de la campagne (10 tâches non consommées à 1.0 pt = 10.0 pts remboursés)
    const result = await cancelCampaign(createdCampaignId, campaignUserId);

    assert.equal(result.campaign.status, "CANCELLED");
    assert.equal(result.unconsumedCount, 10);
    assert.equal(result.refundAmount, 10.0);

    // Le solde doit avoir retrouvé 47.5 points
    const balanceAfterCancel = await getUserBalance(campaignUserId);
    assert.equal(balanceAfterCancel, 47.5);

    // Vérifie que les tâches disponibles ont bien été marquées comme CANCELLED
    const availableTasks = await prisma.task.count({
      where: { campaignId: createdCampaignId, status: "AVAILABLE" },
    });
    assert.equal(availableTasks, 0);
  });
});
