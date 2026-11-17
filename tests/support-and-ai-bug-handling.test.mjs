import test from "node:test";
import assert from "node:assert/strict";
import {
  createSupportTicket,
  getUserSupportTickets,
  getOpenBugTickets,
  getSupportStats,
  replyToSupportTicket,
  updateSupportTicketStatus,
} from "../src/lib/support.ts";
import { askAISecretary } from "../src/lib/ai-secretary.ts";

test("Support Client - Diagnostic Intelligent pour les signalements vagues", async () => {
  const ticket = await createSupportTicket({
    userId: "test_user_qa_123",
    userEmail: "kailawd7@gmail.com",
    userName: "kailawd7",
    subject: "bug",
    category: "BUG",
    message: "j'ai un bug sur ma campagne",
  });

  assert.ok(ticket.id, "Le ticket doit être créé avec un identifiant");
  assert.equal(ticket.category, "BUG");
  assert.equal(ticket.isTechnicalBug, true);
  assert.equal(ticket.status, "ANSWERED", "Le ticket de bug reçoit une réponse immédiate de l'IA");
  assert.equal(ticket.messages.length, 2, "Le ticket doit contenir le message usager et la réponse IA");

  const aiReply = ticket.messages[1].content;
  console.log("--- Réponse de la Secrétaire IA au Support Client ---");
  console.log(aiReply);

  // Vérifications exigées par l'utilisateur :
  // 1. Ne doit PAS dire "reproduire le bug"
  assert.ok(
    !aiReply.toLowerCase().includes("reproduire ce bug"),
    "L'IA ne doit pas utiliser la formule mécanique 'reproduire ce bug'"
  );

  // 2. Doit poser des questions de cadrage pour obtenir les détails
  assert.ok(aiReply.includes("Fonctionnalité"), "L'IA doit demander la fonctionnalité concernée");
  assert.ok(aiReply.includes("Identifiant ou lien"), "L'IA doit demander l'ID ou le lien");
  assert.ok(aiReply.includes("Comportement"), "L'IA doit demander ce qui se passe précisément");
  assert.ok(aiReply.includes("Appareil"), "L'IA doit demander l'appareil / navigateur");
});

test("Secrétaire IA Admin - Synthèse des Incidents & Bugs Signalés", async () => {
  const openBugs = await getOpenBugTickets();
  assert.ok(openBugs.length > 0, "Il doit y avoir au moins un bug ouvert en base");

  const response = await askAISecretary({
    mode: "chat",
    userMessage:
      "fais-moi la synthèse complète des incidents et bugs techniques signalés par les utilisateurs, avec les actions recommandées pour les tester et les régler.",
    platformStats: {
      totalUsers: 5,
      activeCampaigns: 2,
      openTickets: 1,
      openBugsCount: openBugs.length,
      circulatingPoints: 2600,
      bugTickets: openBugs,
    },
  });

  console.log("--- Réponse de la Secrétaire IA dans le Dashboard Admin ---");
  console.log(response.reply);

  assert.equal(response.success, true);
  // Ne doit PAS renvoyer le template générique
  assert.ok(
    !response.reply.includes("En tant que Secrétaire IA d'AddMe.io, voici les principaux éléments directeurs"),
    "L'IA ne doit plus renvoyer le template générique"
  );

  // Doit mentionner le ticket de bug réel
  assert.ok(
    response.reply.includes("Synthèse des Incidents & Bugs") || response.reply.includes("bug"),
    "La réponse doit contenir la synthèse des bugs"
  );
  assert.ok(
    response.reply.includes("kailawd7") || response.reply.includes("campagne") || response.reply.includes("Ticket"),
    "La réponse doit mentionner le ticket ou l'utilisateur"
  );
});
