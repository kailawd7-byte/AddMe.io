import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.ts";
import { recordLedgerTransaction } from "../src/lib/ledger.ts";
import { createCampaign } from "../src/lib/campaigns.ts";
import {
  checkUserTaskEligibility,
  calculateDailyTaskLimit,
  adjustReputationScore,
} from "../src/lib/reputation.ts";
import {
  getAvailableTasks,
  startTask,
  submitTaskCompletion,
  reportTaskCompletion,
  processRetentionReleases,
} from "../src/lib/tasks.ts";

describe("Anti-Fraude, Quotas et Réputation (Étape 4)", () => {
  it("calcule correctement le quota quotidien selon l'ancienneté", () => {
    // 0 jour (nouveau) = 20 tâches
    assert.equal(calculateDailyTaskLimit(0), 20);
    // 7 jours (1 semaine) = 20 + 5 = 25
    assert.equal(calculateDailyTaskLimit(7), 25);
    // 30 jours (~4 semaines) = 20 + 20 = 40
    assert.equal(calculateDailyTaskLimit(30), 40);
    // Ancienneté maximale plafonnée à 100 tâches
    assert.equal(calculateDailyTaskLimit(365), 100);
  });

  it("gère l'ajustement du score de réputation et la suspension automatique", async () => {
    const user = await prisma.user.create({
      data: {
        email: `rep_test_${Date.now()}_${Math.random().toString(36).substring(7)}@addme.io`,
        passwordHash: "hash123",
        isEmailVerified: true,
        reputationScore: 55,
      },
    });

    // Baisse sous 50 points (-10)
    const updated = await adjustReputationScore(user.id, -10, "Signalement justifié");
    assert.equal(updated.reputationScore, 45);
    assert.equal(updated.status, "SUSPENDED");
  });
});

describe("Cycle de Vie des Tâches : Découverte, Minuteur 10s, Séquestre et Signalement", () => {
  let creatorId = "";
  let workerId = "";
  let socialAccountId = "";
  let campaignId = "";
  let availableTaskId = "";
  let testCompletionId = "";

  it("initialise le créateur et le travailleur de test avec solde et compte social", async () => {
    const ts = Date.now();
    const creator = await prisma.user.create({
      data: {
        email: `creator_${ts}@addme.io`,
        passwordHash: "hash123",
        isEmailVerified: true,
      },
    });
    creatorId = creator.id;

    const worker = await prisma.user.create({
      data: {
        email: `worker_${ts}@addme.io`,
        passwordHash: "hash123",
        isEmailVerified: true,
      },
    });
    workerId = worker.id;

    // Crédit de 50 points au créateur pour lancer une campagne
    await recordLedgerTransaction({
      userId: creatorId,
      amount: 50,
      type: "PURCHASE",
      reference: `init_${ts}`,
      description: "Solde initial créateur",
    });

    // Liaison d'un compte TikTok vérifié pour le créateur
    const social = await prisma.socialAccount.create({
      data: {
        userId: creatorId,
        platform: "TIKTOK",
        identifier: `creator_tt_${ts}`,
        status: "VERIFIED",
        verificationCode: "ADDME-TEST1",
        verifiedAt: new Date(),
      },
    });
    socialAccountId = social.id;

    // Création d'une campagne de 2 likes
    const campaign = await createCampaign({
      userId: creatorId,
      socialAccountId,
      videoUrl: `https://www.tiktok.com/@creator_tt_${ts}/video/7299887766554433221`,
      actionType: "LIKE",
      totalQuantity: 2,
    });
    campaignId = campaign.id;

    const tasks = await prisma.task.findMany({ where: { campaignId: campaign.id } });
    assert.equal(tasks.length, 2);
  });

  it("interdit formellement au créateur de voir ses propres publications (anti-self-tasking)", async () => {
    const res = await getAvailableTasks(creatorId);
    const selfTask = res.tasks.find((t) => t.campaignId === campaignId);
    assert.equal(selfTask, undefined, "Le créateur ne doit pas voir ses propres publications dans les tâches à accomplir");
  });

  it("permet au travailleur de trouver la tâche disponible et d'en vérifier la récompense", async () => {
    const res = await getAvailableTasks(workerId);
    const task = res.tasks.find((t) => t.campaignId === campaignId);
    assert.ok(task, "Le travailleur doit voir la tâche créée");
    assert.equal(task.platform, "TIKTOK");
    assert.equal(task.actionType, "LIKE");
    assert.equal(task.rewardPoints, 1.0);
    availableTaskId = task.taskId;
  });

  it("refuse le démarrage de la tâche si le créateur tente de s'auto-attribuer le slot", async () => {
    await assert.rejects(
      async () => {
        await startTask(availableTaskId, creatorId);
      },
      (err) => {
        assert.ok(err.message.includes("propre publication"));
        return true;
      }
    );
  });

  it("démarre la tâche pour le travailleur et réserve le slot en IN_PROGRESS", async () => {
    const session = await startTask(availableTaskId, workerId);
    assert.equal(session.taskId, availableTaskId);
    assert.equal(session.rewardPoints, 1.0);
    assert.equal(session.minDurationSeconds, 10);
    assert.ok(session.completionId);
    testCompletionId = session.completionId;

    // Vérification du statut de la tâche
    const taskInDb = await prisma.task.findUnique({ where: { id: availableTaskId } });
    assert.equal(taskInDb.status, "IN_PROGRESS");
  });

  it("rejette formellement la validation si le délai de 10 secondes n'est pas écoulé", async () => {
    await assert.rejects(
      async () => {
        // Soumission immédiate (temps écoulé ~quelques millisecondes)
        await submitTaskCompletion(testCompletionId, workerId);
      },
      (err) => {
        assert.ok(err.message.includes("DURÉE_INSUFFISANTE"));
        return true;
      }
    );
  });

  it("valide la tâche avec succès lorsque le délai de 10 secondes est respecté et la place sous séquestre 24h", async () => {
    // Pour le test unitaire, reculons artificiellement la date startedAt de 12 secondes
    const twelveSecondsAgo = new Date(Date.now() - 12000);
    await prisma.taskCompletion.update({
      where: { id: testCompletionId },
      data: { startedAt: twelveSecondsAgo, requiresScreenshot: false },
    });

    const result = await submitTaskCompletion(testCompletionId, workerId);
    assert.equal(result.status, "PENDING_RETENTION");
    assert.ok(result.retentionEndsAt);

    // Vérifier que la tâche est marquée COMPLETED
    const taskInDb = await prisma.task.findUnique({ where: { id: availableTaskId } });
    assert.equal(taskInDb.status, "COMPLETED");

    // Vérifier que la campagne a incrémenté son compteur
    const campInDb = await prisma.campaign.findUnique({ where: { id: campaignId } });
    assert.equal(campInDb.completedQuantity, 1);
  });

  it("interdit au même travailleur de refaire la même action sur la même publication", async () => {
    const res = await getAvailableTasks(workerId);
    const duplicate = res.tasks.find((t) => t.campaignId === campaignId);
    assert.equal(duplicate, undefined, "L'utilisateur ne doit pas pouvoir refaire une tâche sur la même publication");
  });

  it("permet au propriétaire de la campagne de signaler une tâche frauduleuse avec motif", async () => {
    const report = await reportTaskCompletion(
      testCompletionId,
      creatorId,
      "Aucun like détecté sur ma publication après vérification."
    );

    assert.ok(report.id);
    assert.equal(report.status, "PENDING");

    // Vérifier que la completion est passée en FLAGGED
    const compInDb = await prisma.taskCompletion.findUnique({ where: { id: testCompletionId } });
    assert.equal(compInDb.status, "FLAGGED");
  });

  it("vérifie que le job de rétention ne libère JAMAIS les tâches signalées (FLAGGED)", async () => {
    // Forçons la date de rétention dans le passé
    await prisma.taskCompletion.update({
      where: { id: testCompletionId },
      data: { retentionEndsAt: new Date(Date.now() - 1000) },
    });

    const releaseSummary = await processRetentionReleases();
    // Le summary ne doit pas avoir libéré notre tâche signalée
    const wasReleased = releaseSummary.releasedCompletions.some((c) => c.completionId === testCompletionId);
    assert.equal(wasReleased, false, "Une tâche FLAGGED ne doit jamais être libérée automatiquement");

    const compInDb = await prisma.taskCompletion.findUnique({ where: { id: testCompletionId } });
    assert.equal(compInDb.status, "FLAGGED");
  });

  it("libère atomiquement les points et met à jour le ledger pour une tâche valide arrivée à échéance", async () => {
    // Créons une completion propre non signalée arrivée à échéance de 24h
    const secondTask = await prisma.task.findFirst({
      where: { campaignId, status: "AVAILABLE" },
    });
    assert.ok(secondTask);

    // Un autre travailleur
    const otherWorker = await prisma.user.create({
      data: {
        email: `other_worker_${Date.now()}@addme.io`,
        passwordHash: "hash123",
        isEmailVerified: true,
      },
    });

    const cleanComp = await prisma.taskCompletion.create({
      data: {
        taskId: secondTask.id,
        workerUserId: otherWorker.id,
        status: "PENDING_RETENTION",
        startedAt: new Date(Date.now() - 25 * 3600 * 1000),
        submittedAt: new Date(Date.now() - 25 * 3600 * 1000),
        retentionEndsAt: new Date(Date.now() - 1000), // Expiré il y a 1s
        rewardPoints: 1.0,
      },
    });

    const releaseSummary = await processRetentionReleases();
    assert.ok(releaseSummary.releasedCount >= 1);

    // Vérifier que le statut est APPROVED
    const updatedComp = await prisma.taskCompletion.findUnique({ where: { id: cleanComp.id } });
    assert.equal(updatedComp.status, "APPROVED");

    // Vérifier l'écriture atomique dans le Ledger
    const ledgerEntry = await prisma.ledgerEntry.findFirst({
      where: {
        userId: otherWorker.id,
        type: "TASK_REWARD",
        referenceId: cleanComp.id,
      },
    });
    assert.ok(ledgerEntry);
    assert.equal(ledgerEntry.amount, 1.0);
  });
});
