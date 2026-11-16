import test from 'node:test';
import assert from 'node:assert/strict';
import { askAISecretary } from '../src/lib/ai-secretary.ts';

test('AI Secretary - Mode Chat - Questions spécifiques', async () => {
  // Test 1: Question sur le Ledger
  const resLedger = await askAISecretary({
    mode: 'chat',
    userMessage: "Explique-moi comment la table LedgerEntry garantit l'immuabilité et l'absence de double-crédit.",
  });

  assert.equal(resLedger.success, true);
  assert.ok(
    resLedger.reply.toLowerCase().includes('ledgerentry') ||
    resLedger.reply.toLowerCase().includes('idempotencykey') ||
    resLedger.reply.toLowerCase().includes('immuab'),
    'La réponse doit contenir des explications sur LedgerEntry ou idempotencyKey'
  );
  // Vérifie que ce n'est PAS la réponse statique générique
  assert.equal(
    resLedger.reply.includes("Toutes les règles d'AddMe.io (chrono 20s, robot de vérification, paiements SasPay Mobile Money, Grand Livre Ledger et codes partenaires) sont intégrées dans mes connaissances. Que souhaitez-vous analyser aujourd'hui ?"),
    false,
    'La réponse ne doit pas être le message statique générique'
  );

  // Test 2: Salutations
  const resHello = await askAISecretary({
    mode: 'chat',
    userMessage: 'hello',
    platformStats: {
      totalUsers: 42,
      activeCampaigns: 15,
      openTickets: 3,
      openBugsCount: 1,
      circulatingPoints: 12500,
    },
  });

  assert.equal(resHello.success, true);
  assert.ok(resHello.reply.length > 20);

  // Test 3: Mode Audit
  const resAudit = await askAISecretary({
    mode: 'audit',
    platformStats: {
      totalUsers: 100,
      activeCampaigns: 25,
      openTickets: 2,
      openBugsCount: 0,
      circulatingPoints: 50000,
    },
  });

  assert.equal(resAudit.success, true);
  assert.ok(resAudit.reply.toLowerCase().includes('diagnostic') || resAudit.reply.toLowerCase().includes('audit') || resAudit.reply.toLowerCase().includes('santé'));
});
