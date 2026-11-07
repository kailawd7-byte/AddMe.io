import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma.ts";
import { getUserBalance } from "../src/lib/ledger.ts";
import { POINT_PACKS, getPackById } from "../src/lib/constants.ts";
import {
  createCheckoutSession,
  completePaymentConfirmation,
  processStripeWebhookEvent,
  getUserPaymentHistory,
} from "../src/lib/payments.ts";

describe("Boutique de Points & Catalogue de Packs (Étape 5)", () => {
  it("propose exactement 3 packs de points fixes avec leurs tarifs et équivalences", () => {
    assert.equal(POINT_PACKS.length, 3);

    const starter = getPackById("PACK_STARTER");
    assert.ok(starter);
    assert.equal(starter.points, 100);
    assert.equal(starter.priceInCents, 499);
    assert.equal(starter.priceFormatted, "4,99 €");

    const creator = getPackById("PACK_CREATOR");
    assert.ok(creator);
    assert.equal(creator.points, 300);
    assert.equal(creator.priceInCents, 1299);
    assert.equal(creator.popular, true);

    const pro = getPackById("PACK_PRO");
    assert.ok(pro);
    assert.equal(pro.points, 1000);
    assert.equal(pro.priceInCents, 3499);
  });

  it("rejette formellement la tentative d'achat avec un packId invalide", async () => {
    await assert.rejects(
      async () => {
        await createCheckoutSession("fake_user", "PACK_INEXISTANT");
      },
      (err) => {
        assert.ok(err.message.includes("inconnu ou invalide"));
        return true;
      }
    );
  });
});

describe("Cycle de Paiement Stripe : Session, Webhook, Crédit Sécurisé et Idempotence", () => {
  let testUserId = "";
  let paymentSessionId = "";
  let paymentId = "";
  let initialBalance = 0;

  it("crée un utilisateur de test avec solde initial", async () => {
    const ts = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `buyer_${ts}@addme.io`,
        passwordHash: "hash123",
        isEmailVerified: true,
        status: "ACTIVE",
      },
    });
    testUserId = user.id;
    initialBalance = await getUserBalance(testUserId);
    assert.equal(initialBalance, 0);
  });

  it("initie une session de paiement en statut PENDING sans créditer prématurément les points", async () => {
    const session = await createCheckoutSession(testUserId, "PACK_CREATOR");
    assert.ok(session.sessionId);
    assert.ok(session.paymentId);
    assert.equal(session.pack.points, 300);

    paymentSessionId = session.sessionId;
    paymentId = session.paymentId;

    // Vérification en base : le paiement doit être PENDING
    const paymentInDb = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    assert.ok(paymentInDb);
    assert.equal(paymentInDb.status, "PENDING");
    assert.equal(paymentInDb.pointsAmount, 300);
    assert.equal(paymentInDb.amountInCents, 1299);

    // Règle d'or : le solde ne doit PAS avoir augmenté avant la confirmation
    const currentBalance = await getUserBalance(testUserId);
    assert.equal(currentBalance, 0, "Les points ne doivent jamais être crédités avant confirmation");
  });

  it("interdit la création de session pour un utilisateur suspendu", async () => {
    const suspendedUser = await prisma.user.create({
      data: {
        email: `suspended_${Date.now()}@addme.io`,
        passwordHash: "hash123",
        status: "SUSPENDED",
      },
    });

    await assert.rejects(
      async () => {
        await createCheckoutSession(suspendedUser.id, "PACK_STARTER");
      },
      (err) => {
        assert.ok(err.message.includes("suspendu ou restreint"));
        return true;
      }
    );
  });

  it("confirme le paiement via webhook et crédite atomiquement les 300 points au Ledger", async () => {
    const confirmResult = await completePaymentConfirmation(paymentSessionId, "pi_test_12345");
    assert.equal(confirmResult.success, true);
    assert.equal(confirmResult.alreadyProcessed, false);
    assert.equal(confirmResult.pointsAmount, 300);

    // Vérifier la mise à jour du Payment
    const paymentInDb = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    assert.equal(paymentInDb?.status, "COMPLETED");
    assert.equal(paymentInDb?.stripePaymentIntentId, "pi_test_12345");
    assert.ok(paymentInDb?.ledgerEntryId);

    // Vérifier l'inscription immuable dans le Ledger
    const ledgerEntry = await prisma.ledgerEntry.findUnique({
      where: { id: paymentInDb.ledgerEntryId },
    });
    assert.ok(ledgerEntry);
    assert.equal(ledgerEntry.amount, 300);
    assert.equal(ledgerEntry.type, "PACK_PURCHASE");
    assert.equal(ledgerEntry.referenceType, "PAYMENT");
    assert.equal(ledgerEntry.referenceId, paymentId);

    // Vérifier le nouveau solde de l'utilisateur
    const updatedBalance = await getUserBalance(testUserId);
    assert.equal(updatedBalance, 300.0);
  });

  it("garantit l'idempotence absolue : rejeu du webhook sans double crédit", async () => {
    // Deuxième confirmation du même sessionId
    const duplicateResult = await completePaymentConfirmation(paymentSessionId, "pi_test_12345");
    assert.equal(duplicateResult.success, true);
    assert.equal(duplicateResult.alreadyProcessed, true);

    // Le solde doit rester strictement à 300.0 (pas 600)
    const currentBalance = await getUserBalance(testUserId);
    assert.equal(currentBalance, 300.0, "Le solde ne doit pas doubler lors de la réémission du webhook");

    // Il ne doit exister qu'une seule transaction pour cet achat
    const transactions = await prisma.ledgerEntry.findMany({
      where: {
        userId: testUserId,
        referenceId: paymentId,
      },
    });
    assert.equal(transactions.length, 1);
  });

  it("traite un webhook Stripe simulant l'événement checkout.session.completed", async () => {
    // Création d'une seconde session pour le Pack Starter (100 pts)
    const sessionStarter = await createCheckoutSession(testUserId, "PACK_STARTER");

    const mockStripeEvent = {
      id: `evt_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: sessionStarter.sessionId,
          payment_intent: "pi_stripe_starter_999",
          client_reference_id: testUserId,
          amount_total: 499,
          currency: "eur",
        },
      },
    };

    const webhookResult = await processStripeWebhookEvent(
      JSON.stringify(mockStripeEvent),
      null
    );

    assert.equal(webhookResult.success, true);
    assert.equal(webhookResult.alreadyProcessed, false);

    // Vérifier que le solde total est passé de 300 à 400 pts (300 + 100)
    const finalBalance = await getUserBalance(testUserId);
    assert.equal(finalBalance, 400.0);
  });

  it("restitue l'historique complet et ordonné des commandes de l'utilisateur", async () => {
    const history = await getUserPaymentHistory(testUserId);
    assert.ok(history.length >= 2);

    // Le premier élément doit être le plus récent (tri desc)
    assert.equal(history[0].packId, "PACK_STARTER");
    assert.equal(history[0].pointsAmount, 100);
    assert.equal(history[0].status, "COMPLETED");

    assert.equal(history[1].packId, "PACK_CREATOR");
    assert.equal(history[1].pointsAmount, 300);
    assert.equal(history[1].status, "COMPLETED");
  });
});

