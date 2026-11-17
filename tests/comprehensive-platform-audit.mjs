import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.ts";
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "../src/lib/crypto-auth.ts";
import { validateGiftCode, applyGiftCodeRegistration } from "../src/lib/gift-codes.ts";
import { recordLedgerTransaction, getUserBalance, getActionRates } from "../src/lib/ledger.ts";
import { createCampaign } from "../src/lib/campaigns.ts";
import { getAvailableTasks, startTask, submitTaskCompletion, reportTaskCompletion } from "../src/lib/tasks.ts";
import { createSupportTicket, replyToSupportTicket, getUserSupportTickets, getAllSupportTickets, updateSupportTicketStatus } from "../src/lib/support.ts";
import { askUserSupportAI, askAISecretary } from "../src/lib/ai-secretary.ts";
import { createCheckoutSession, completePaymentConfirmation } from "../src/lib/payments.ts";
import crypto from "crypto";

describe("🎯 AUDIT COMPLET & EXHAUSTIF DE LA PLATEFORME ADDME.IO", () => {
  const timestamp = Date.now();
  const workerEmail = `audit_worker_${timestamp}@test.com`;
  const creatorEmail = `audit_creator_${timestamp}@test.com`;
  const plainPassword = "AuditPassword2026!";

  let workerId = "";
  let creatorId = "";
  let creatorSocialAccountId = "";
  let campaignId = "";
  let taskId = "";
  let completionId = "";
  let ticketId = "";

  // Compteur initial d'utilisateurs avant le test
  let initialUserCount = 0;

  before(async () => {
    initialUserCount = await prisma.user.count();
    console.log(`\n======================================================`);
    console.log(`🚀 DÉBUT DU GRAND AUDIT EN DIRECT SUR LA BASE POSTGRESQL`);
    console.log(`   Utilisateurs avant test : ${initialUserCount}`);
    console.log(`======================================================\n`);
  });

  after(async () => {
    console.log(`\n======================================================`);
    console.log(`🧹 NETTOYAGE INTÉGRAL DE TOUTES LES DONNÉES DE TEST...`);
    console.log(`======================================================\n`);

    // 1. Suppression des tickets de support et messages
    if (workerId || creatorId) {
      await prisma.supportMessage.deleteMany({
        where: {
          ticket: {
            userId: { in: [workerId, creatorId].filter(Boolean) },
          },
        },
      });
      await prisma.supportTicket.deleteMany({
        where: {
          userId: { in: [workerId, creatorId].filter(Boolean) },
        },
      });
    }

    // 2. Suppression des signalements (Reports)
    if (workerId || creatorId) {
      await prisma.report.deleteMany({
        where: {
          OR: [
            { reporterUserId: { in: [workerId, creatorId].filter(Boolean) } },
            { reportedUserId: { in: [workerId, creatorId].filter(Boolean) } },
          ],
        },
      });
    }

    // 3. Suppression des exécutions de tâches (TaskCompletions)
    if (workerId) {
      await prisma.taskCompletion.deleteMany({
        where: { workerUserId: workerId },
      });
    }

    // 4. Suppression des tâches et campagnes
    if (creatorId) {
      await prisma.task.deleteMany({
        where: { campaign: { userId: creatorId } },
      });
      await prisma.campaign.deleteMany({
        where: { userId: creatorId },
      });
    }

    // 5. Suppression des comptes sociaux
    if (creatorId || workerId) {
      await prisma.socialAccount.deleteMany({
        where: { userId: { in: [workerId, creatorId].filter(Boolean) } },
      });
    }

    // 6. Suppression des utilisations de codes cadeaux
    if (workerId) {
      await prisma.giftCodeUsage.deleteMany({
        where: { userId: workerId },
      });
    }

    // 7. Suppression des paiements et entrées Ledger
    if (workerId || creatorId) {
      await prisma.payment.deleteMany({
        where: { userId: { in: [workerId, creatorId].filter(Boolean) } },
      });
      await prisma.ledgerEntry.deleteMany({
        where: { userId: { in: [workerId, creatorId].filter(Boolean) } },
      });
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { actorId: { in: [workerId, creatorId].filter(Boolean) } },
            { targetId: { in: [workerId, creatorId].filter(Boolean) } },
          ],
        },
      });
    }

    // 8. Suppression définitive des 2 utilisateurs de test
    if (workerId || creatorId) {
      await prisma.user.deleteMany({
        where: { id: { in: [workerId, creatorId].filter(Boolean) } },
      });
    }

    // Vérification de retour exact au nombre initial
    const finalUserCount = await prisma.user.count();
    console.log(`✅ Nettoyage terminé avec succès !`);
    console.log(`   Utilisateurs finaux : ${finalUserCount} (Initial : ${initialUserCount})`);
    assert.equal(finalUserCount, initialUserCount, "Le nombre d'utilisateurs doit être revenu strictement à l'état initial.");
  });

  // --------------------------------------------------------------------------
  // ÉTAPE 1 : CYCLE D'INSCRIPTION & VALIDATION CODE CADEAU
  // --------------------------------------------------------------------------
  test("1. Inscription d'un travailleur avec code d'affiliation WENS-64", async () => {
    // A. Validation du code d'affiliation
    const giftCodeCheck = await validateGiftCode("WENS-64");
    assert.equal(giftCodeCheck.valid, true, "Le code WENS-64 doit être valide");
    assert.equal(giftCodeCheck.bonusPoints, 500, "Le bonus filleul doit être de 500 points");

    // B. Création du compte travailleur
    const passwordHash = await hashPassword(plainPassword);
    const worker = await prisma.user.create({
      data: {
        email: workerEmail,
        passwordHash,
        role: "USER",
        isEmailVerified: true,
        status: "ACTIVE",
        reputationScore: 100.0,
      },
    });
    assert.ok(worker.id);
    workerId = worker.id;

    // C. Application du bonus d'affiliation
    const affiliationResult = await applyGiftCodeRegistration({
      userId: workerId,
      userEmail: workerEmail,
      rawCode: "WENS-64",
    });
    assert.equal(affiliationResult.success, true);
    assert.equal(affiliationResult.bonusPoints, 500);

    // D. Vérification du solde Ledger
    const balance = await getUserBalance(workerId);
    assert.equal(balance, 500, "Le solde initial du travailleur doit être de 500 points");

    // E. Idempotence : impossible d'appliquer le bonus une 2e fois
    await assert.rejects(
      async () => {
        await applyGiftCodeRegistration({
          userId: workerId,
          userEmail: workerEmail,
          rawCode: "WENS-64",
        });
      },
      (err) => {
        assert.ok(err.message.includes("Unique constraint") || err.message.includes("déjà"));
        return true;
      }
    );
    console.log(`   ✔ Travailleur créé avec succès (${workerEmail}) | Solde : ${balance} pts`);
  });

  // --------------------------------------------------------------------------
  // ÉTAPE 2 : AUTHENTIFICATION, MOT DE PASSE ET SESSIONS JWT
  // --------------------------------------------------------------------------
  test("2. Authentification scrypt, génération et vérification de session JWT", async () => {
    const user = await prisma.user.findUnique({ where: { id: workerId } });
    assert.ok(user);

    // Vérification du mot de passe
    const isPasswordValid = await verifyPassword(plainPassword, user.passwordHash);
    assert.equal(isPasswordValid, true, "Le mot de passe valide doit être accepté");

    const isWrongPasswordValid = await verifyPassword("WrongPassword!", user.passwordHash);
    assert.equal(isWrongPasswordValid, false, "Un mauvais mot de passe doit être rejeté");

    // Signature du token JWT
    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    assert.ok(token, "Le jeton JWT doit être généré");

    // Décodage et intégrité
    const payload = verifySessionToken(token);
    assert.ok(payload);
    assert.equal(payload.userId, user.id);
    assert.equal(payload.email, user.email);
    console.log(`   ✔ Chiffrement scrypt & Session JWT validés`);
  });

  // --------------------------------------------------------------------------
  // ÉTAPE 3 : CRÉATEUR, BOUTIQUE DE POINTS & RECHARGE
  // --------------------------------------------------------------------------
  test("3. Inscription du créateur et recharge de 10 000 points (Pack Créateur)", async () => {
    // Création du créateur
    const creatorHash = await hashPassword(plainPassword);
    const creator = await prisma.user.create({
      data: {
        email: creatorEmail,
        passwordHash: creatorHash,
        role: "USER",
        isEmailVerified: true,
        status: "ACTIVE",
      },
    });
    creatorId = creator.id;

    // Création d'une session d'achat pour le Pack Créateur (10 000 points)
    const session = await createCheckoutSession(
      creatorId,
      "PACK_CREATOR",
      "http://localhost:3000",
      "STRIPE"
    );
    assert.ok(session.sessionId);

    // Confirmation atomique du paiement
    const confirmation = await completePaymentConfirmation(
      session.sessionId,
      `pi_test_${timestamp}`
    );
    assert.equal(confirmation.success, true);
    assert.equal(confirmation.pointsAmount, 10000);

    // Vérification du solde du créateur
    const creatorBalance = await getUserBalance(creatorId);
    assert.equal(creatorBalance, 10000, "Le créateur doit avoir un solde de 10 000 points");

    // Vérification de l'idempotence stricte (aucun double crédit si le paiement est reconfirmé)
    const replayConfirmation = await completePaymentConfirmation(
      session.sessionId,
      `pi_test_${timestamp}`
    );
    assert.equal(replayConfirmation.alreadyProcessed, true);

    const balanceAfterReplay = await getUserBalance(creatorId);
    assert.equal(balanceAfterReplay, 10000, "Le solde ne doit pas avoir bougé après rejeu");
    console.log(`   ✔ Recharge validée (10 000 pts crédités) | Idempotence confirmée`);
  });

  // --------------------------------------------------------------------------
  // ÉTAPE 4 : LIAISON DE COMPTE SOCIAL & CRÉATION DE CAMPAGNE
  // --------------------------------------------------------------------------
  test("4. Liaison de compte social TikTok et création d'une campagne de likes", async () => {
    const handle = `audit_brand_${timestamp}`;
    const socialAccount = await prisma.socialAccount.create({
      data: {
        userId: creatorId,
        platform: "TIKTOK",
        identifier: handle,
        verificationCode: "ADDME-AUDIT",
        status: "VERIFIED", // Simulé comme vérifié pour la campagne
        verifiedAt: new Date(),
      },
    });
    creatorSocialAccountId = socialAccount.id;

    // Tarifs d'une action LIKE
    const rates = await getActionRates("LIKE");
    assert.ok(rates.cost > 0);
    assert.ok(rates.reward > 0);

    // Création d'une campagne de 5 likes
    const quantity = 5;
    const totalCost = quantity * rates.cost;

    const campaign = await createCampaign({
      userId: creatorId,
      socialAccountId: creatorSocialAccountId,
      platform: "TIKTOK",
      actionType: "LIKE",
      videoUrl: `https://www.tiktok.com/@${handle}/video/7299887766554433221`,
      totalQuantity: quantity,
      dailyCap: 5,
    });

    assert.ok(campaign.id);
    campaignId = campaign.id;

    // Vérification que les points ont été débités du solde
    const balanceAfterCampaign = await getUserBalance(creatorId);
    assert.equal(balanceAfterCampaign, 10000 - campaign.totalCost, "Le coût total doit être débité du créateur");

    // Vérification que 5 tâches AVAILABLE ont été générées
    const tasksCount = await prisma.task.count({
      where: { campaignId, status: "AVAILABLE" },
    });
    assert.equal(tasksCount, quantity, "Exactement 5 tâches disponibles doivent exister");
    console.log(`   ✔ Campagne créée (${quantity} Likes TikTok) | Débit : -${totalCost} pts | Tâches générées : ${tasksCount}`);
  });

  // --------------------------------------------------------------------------
  // ÉTAPE 5 : EXÉCUTION DE TÂCHE, MINUTEUR ET ANTI-FRAUDE SENTINEL
  // --------------------------------------------------------------------------
  test("5. Découverte de tâche, minuteur 20s et validation avec crédit atomique", async () => {
    // A. Anti-self-tasking : le créateur ne doit PAS voir ses propres tâches
    const creatorFeed = await getAvailableTasks(creatorId);
    const selfTask = creatorFeed.tasks.find((t) => t.campaignId === campaignId);
    assert.equal(selfTask, undefined, "Le créateur ne doit jamais voir sa propre campagne");

    // B. Le travailleur découvre la tâche disponible
    const workerFeed = await getAvailableTasks(workerId);
    const availableTask = workerFeed.tasks.find((t) => t.campaignId === campaignId);
    assert.ok(availableTask, "Le travailleur doit trouver la tâche disponible");
    taskId = availableTask.taskId;

    // C. Démarrage de la tâche (réservation)
    const taskSession = await startTask(taskId, workerId);
    assert.equal(taskSession.taskId, taskId);
    assert.equal(taskSession.minDurationSeconds, 20, "Le minuteur obligatoire doit être de 20s");
    completionId = taskSession.completionId;

    // D. Blocage anti-fraude si soumission immédiate (< 20s)
    await assert.rejects(
      async () => {
        await submitTaskCompletion(completionId, workerId);
      },
      (err) => {
        assert.ok(err.message.includes("DURÉE_INSUFFISANTE") || err.message.includes("20"));
        return true;
      },
      "La soumission avant 20 secondes doit être strictement rejetée"
    );

    // E. Simulation du temps écoulé (22s) et validation avec IA Vision Sentinel
    const pastDate = new Date(Date.now() - 22000);
    await prisma.taskCompletion.update({
      where: { id: completionId },
      data: { startedAt: pastDate },
    });

    const completionResult = await submitTaskCompletion(completionId, workerId, {
      screenshotUrl: "MOCK_VALID_PROOF",
    });
    assert.equal(completionResult.status, "APPROVED");
    assert.ok(completionResult.rewardPoints > 0);

    // F. Vérification du crédit des points au travailleur
    const newWorkerBalance = await getUserBalance(workerId);
    assert.equal(newWorkerBalance, 500 + completionResult.rewardPoints, "Les points de récompense doivent être crédités");

    // G. Anti-rejeu : le travailleur ne peut plus refaire la tâche sur la même publication
    const refreshedFeed = await getAvailableTasks(workerId);
    const duplicate = refreshedFeed.tasks.find((t) => t.campaignId === campaignId);
    assert.equal(duplicate, undefined, "La publication ne doit plus réapparaître pour ce travailleur");
    console.log(`   ✔ Minuteur 20s respecté | Tâche validée | Récompense : +${completionResult.rewardPoints} pt`);
  });

  // --------------------------------------------------------------------------
  // ÉTAPE 6 : SUPPORT CLIENT & ASSISTANT IA CONVERSATIONNEL
  // --------------------------------------------------------------------------
  test("6. Ouverture d'un ticket support et dialogue avec la Secrétaire IA", async () => {
    // A. Création du ticket par le travailleur
    const ticket = await createSupportTicket({
      userId: workerId,
      userEmail: workerEmail,
      userName: "Worker Audit",
      subject: "Question sur les délais de virement",
      category: "PAYMENT",
      message: "Bonjour, sous combien de temps les points sont-ils validés ?",
    });
    assert.ok(ticket.id);
    ticketId = ticket.id;

    // B. Réponse instantanée de la Secrétaire IA conversationnelle
    const aiResponse = await askUserSupportAI({
      ticketId,
      userQuestion: "Comment fonctionnent les retraits SasPay Mobile Money sur AddMe ?",
      history: [
        { senderRole: "USER", content: "Bonjour, sous combien de temps les points sont-ils validés ?" },
      ],
      userName: "Worker Audit",
    });
    assert.ok(aiResponse);
    assert.ok(aiResponse.length > 20);
    assert.ok(!aiResponse.includes("Désolé, une erreur"));

    // C. Escalade du ticket et réponse administrative
    const adminReply = await replyToSupportTicket({
      ticketId,
      senderRole: "ADMIN",
      senderId: "aaa331f2-f32c-462d-81b7-586fcb7af7bf",
      senderName: "Admin",
      senderEmail: "admin@addme.io",
      content: "Votre demande a été traitée avec succès.",
    });
    assert.ok(adminReply.id);

    const updatedTicket = await updateSupportTicketStatus(ticketId, "RESOLVED");
    assert.equal(updatedTicket.status, "RESOLVED");
    console.log(`   ✔ Ticket Support créé, IA Conversationnelle opérationnelle & Ticket résolu`);
  });

  // --------------------------------------------------------------------------
  // ÉTAPE 7 : SECRÉTAIRE IA ADMIN & AUDIT DU SYSTÈME EN DIRECT
  // --------------------------------------------------------------------------
  test("7. Diagnostic système et synthèse par la Secrétaire IA Admin", async () => {
    const adminSynthesis = await askAISecretary({
      question: "Donne-moi la synthèse de la santé globale de la plateforme et des incidents.",
    });
    assert.ok(adminSynthesis.reply);
    assert.ok(adminSynthesis.reply.length > 50, "La synthèse administrative doit être complète");
    console.log(`   ✔ Secrétaire IA Admin opérationnelle (Rapport généré : ${adminSynthesis.reply.length} caractères)`);
  });

  // --------------------------------------------------------------------------
  // ÉTAPE 8 : ARBITRAGE & LITIGES (REPORTS)
  // --------------------------------------------------------------------------
  test("8. Signalement de tâche par le créateur et arbitrage", async () => {
    // Le créateur signale l'exécution
    const report = await reportTaskCompletion(
      completionId,
      creatorId,
      "Test de litige pour contrôle qualité"
    );
    assert.ok(report.id);
    assert.equal(report.status, "PENDING");

    // Résolution du litige par l'administrateur
    const resolved = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "RESOLVED_DISMISSED",
        adminNotes: "Audit automatique de test validé",
        resolvedAt: new Date(),
      },
    });
    assert.equal(resolved.status, "RESOLVED_DISMISSED");
    console.log(`   ✔ Signalement et flux d'arbitrage validés`);
  });
});
