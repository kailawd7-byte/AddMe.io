import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.ts";
import { getUserBalance } from "../src/lib/ledger.ts";
import {
  getAdminDashboardStats,
  getAdminUsersList,
  updateAdminUserStatus,
  adjustUserPointsManually,
  getPendingSocialAccounts,
  moderateSocialAccount,
  getAdminReports,
  resolveAdminReport,
  getSystemSettings,
  updateSystemSetting,
} from "../src/lib/admin.ts";

describe("Panel Administrateur, Modération & Sécurité (Étape 6)", () => {
  let adminUserId = "";
  let regularUserId = "";
  let targetUserId = "";

  it("initialise un administrateur et des utilisateurs pour les tests", async () => {
    const ts = Date.now();
    const admin = await prisma.user.create({
      data: {
        email: `admin_${ts}@addme.io`,
        passwordHash: "hash123",
        role: "ADMIN",
        isEmailVerified: true,
      },
    });
    adminUserId = admin.id;

    const regular = await prisma.user.create({
      data: {
        email: `regular_${ts}@addme.io`,
        passwordHash: "hash123",
        role: "USER",
        isEmailVerified: true,
      },
    });
    regularUserId = regular.id;

    const target = await prisma.user.create({
      data: {
        email: `target_${ts}@addme.io`,
        passwordHash: "hash123",
        role: "USER",
        isEmailVerified: true,
        reputationScore: 90,
      },
    });
    targetUserId = target.id;
  });

  it("fournit des statistiques globales en temps réel sur la plateforme", async () => {
    const stats = await getAdminDashboardStats();
    assert.ok(stats.totalUsers >= 3);
    assert.ok(typeof stats.circulatingPoints === "number");
    assert.ok(typeof stats.pendingReports === "number");
  });

  it("permet à l'administrateur de suspendre et réactiver un utilisateur avec journal d'audit", async () => {
    // 1. Suspension
    const suspended = await updateAdminUserStatus(
      adminUserId,
      targetUserId,
      "SUSPENDED",
      "Comportement suspect détecté"
    );
    assert.equal(suspended.status, "SUSPENDED");

    const auditSuspend = await prisma.auditLog.findFirst({
      where: {
        actorId: adminUserId,
        targetId: targetUserId,
        action: "USER_STATUS_SUSPENDED",
      },
    });
    assert.ok(auditSuspend);

    // 2. Réactivation
    const reactivated = await updateAdminUserStatus(
      adminUserId,
      targetUserId,
      "ACTIVE",
      "Vérification d'identité complétée"
    );
    assert.equal(reactivated.status, "ACTIVE");
  });

  it("interdit la restriction d'un compte ayant le rôle ADMIN", async () => {
    await assert.rejects(
      async () => {
        await updateAdminUserStatus(adminUserId, adminUserId, "BANNED", "Test");
      },
      (err) => {
        assert.ok(err.message.includes("administrateur"));
        return true;
      }
    );
  });

  it("permet à l'administrateur d'ajuster manuellement des points avec écriture au Ledger", async () => {
    const balanceBefore = await getUserBalance(targetUserId);

    // Crédit manuel de +25 points
    const adjustResult = await adjustUserPointsManually(
      adminUserId,
      targetUserId,
      25,
      "Dédommagement commercial suite incident"
    );

    assert.equal(adjustResult.balance, balanceBefore + 25);

    // Vérifier l'inscription immuable dans le grand livre (Ledger)
    const ledgerTx = await prisma.ledgerEntry.findUnique({
      where: { id: adjustResult.entry.id },
    });
    assert.ok(ledgerTx);
    assert.equal(ledgerTx.amount, 25);
    assert.equal(ledgerTx.type, "ADMIN_ADJUSTMENT");
    assert.equal(ledgerTx.referenceType, "AUDIT");

    // Vérifier le log d'audit
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        actorId: adminUserId,
        targetId: targetUserId,
        action: "ADMIN_POINTS_ADJUSTMENT",
      },
    });
    assert.ok(auditLog);
  });

  it("modère manuellement un compte social en attente (Validation et Rejet)", async () => {
    const ts = Date.now();
    // Création d'un compte social en attente
    const pendingAcc = await prisma.socialAccount.create({
      data: {
        userId: targetUserId,
        platform: "TIKTOK",
        identifier: `pending_mod_${ts}`,
        status: "PENDING_VERIFICATION",
        verificationCode: "ADDME-MODER",
      },
    });

    // Validation manuelle par l'administrateur
    const verifiedAcc = await moderateSocialAccount(
      adminUserId,
      pendingAcc.id,
      "VERIFY",
      "Bio vérifiée manuellement par admin"
    );
    assert.equal(verifiedAcc.status, "VERIFIED");
    assert.ok(verifiedAcc.verifiedAt);

    // Rejet d'un autre compte
    const secondAcc = await prisma.socialAccount.create({
      data: {
        userId: targetUserId,
        platform: "YOUTUBE",
        identifier: `pending_rej_${ts}`,
        status: "PENDING_VERIFICATION",
        verificationCode: "ADDME-REJEC",
      },
    });

    const rejectedAcc = await moderateSocialAccount(
      adminUserId,
      secondAcc.id,
      "REJECT",
      "Code absent de la description"
    );
    assert.equal(rejectedAcc.status, "REJECTED");
  });

  it("arbitre un litige de signalement en confirmant la fraude (UPHELD : sanction réputation -10)", async () => {
    const ts = Date.now();
    // Création d'une campagne et d'une tâche pour simuler le litige
    const social = await prisma.socialAccount.create({
      data: {
        userId: adminUserId,
        platform: "TIKTOK",
        identifier: `rep_camp_${ts}`,
        status: "VERIFIED",
        verificationCode: "ADDME-CAMPR",
      },
    });

    const campaign = await prisma.campaign.create({
      data: {
        userId: adminUserId,
        socialAccountId: social.id,
        platform: "TIKTOK",
        actionType: "LIKE",
        videoUrl: `https://www.tiktok.com/@rep_camp_${ts}/video/7288776655443322112`,
        totalQuantity: 1,
        dailyCap: 10,
        costPerUnit: 1.3,
        rewardPerUnit: 1.0,
        totalCost: 1.3,
        status: "ACTIVE",
      },
    });

    const task = await prisma.task.create({
      data: { campaignId: campaign.id, status: "IN_PROGRESS" },
    });

    const completion = await prisma.taskCompletion.create({
      data: {
        taskId: task.id,
        workerUserId: targetUserId,
        status: "FLAGGED",
        rewardPoints: 1.0,
      },
    });

    const report = await prisma.report.create({
      data: {
        campaignId: campaign.id,
        taskCompletionId: completion.id,
        reporterUserId: adminUserId,
        reportedUserId: targetUserId,
        reason: "Like non visible",
        status: "PENDING",
      },
    });

    const repBefore = (await prisma.user.findUnique({ where: { id: targetUserId } }))?.reputationScore || 0;

    // Arbitrage de l'administrateur : UPHELD
    const result = await resolveAdminReport(
      adminUserId,
      report.id,
      "UPHELD",
      "Fraude confirmée après inspection"
    );

    assert.equal(result.success, true);
    assert.equal(result.resolution, "UPHELD");

    // Vérifier que la tâche est marquée REJECTED
    const compAfter = await prisma.taskCompletion.findUnique({ where: { id: completion.id } });
    assert.equal(compAfter?.status, "REJECTED");

    // Vérifier la sanction de -10 points sur le score de réputation
    const repAfter = (await prisma.user.findUnique({ where: { id: targetUserId } }))?.reputationScore || 0;
    assert.equal(repAfter, repBefore - 10);
  });

  it("met à jour les tarifs système et plafonds avec persistance", async () => {
    await updateSystemSetting(adminUserId, "test_custom_fee", "2.2", "Frais de test");
    const settings = await getSystemSettings();
    assert.equal(settings["test_custom_fee"], "2.2");

    // Rétablissement de la valeur par défaut pour les tests de campagnes
    await updateSystemSetting(adminUserId, "cost_like", "1.3", "Rétablissement valeur par défaut");
  });
});
