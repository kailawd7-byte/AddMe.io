import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createSupportTicket,
  replyToSupportTicket,
  getUserSupportTickets,
  getAllSupportTickets,
  getSupportTicketById,
  updateSupportTicketStatus,
  getSupportStats,
} from "../src/lib/support.ts";

describe("Support Client & Messagerie", () => {
  let createdTicketId = "";

  it("crée un nouveau ticket de support avec ses métadonnées", async () => {
    const ticket = await createSupportTicket({
      userId: "user_test_123",
      userEmail: "testeur@gmail.com",
      userName: "Testeur Pro",
      subject: "Question sur le fonctionnement des points",
      category: "POINTS",
      message: "Bonjour, comment les points sont-ils crédités après une mission ?",
    });

    assert.ok(ticket.id.startsWith("ticket_"));
    assert.equal(ticket.userId, "user_test_123");
    assert.equal(ticket.userEmail, "testeur@gmail.com");
    assert.equal(ticket.subject, "Question sur le fonctionnement des points");
    assert.equal(ticket.category, "POINTS");
    assert.equal(ticket.status, "OPEN");
    assert.equal(ticket.messages.length, 1);
    assert.equal(ticket.messages[0].senderRole, "USER");
    assert.equal(
      ticket.messages[0].content,
      "Bonjour, comment les points sont-ils crédités après une mission ?"
    );

    createdTicketId = ticket.id;
  });

  it("retrouve un ticket par son identifiant", async () => {
    assert.ok(createdTicketId, "Ticket ID requis");
    const found = await getSupportTicketById(createdTicketId);
    assert.ok(found);
    assert.equal(found?.id, createdTicketId);
  });

  it("permet à l'administrateur d'ajouter une réponse dans le fil", async () => {
    assert.ok(createdTicketId);
    const updated = await replyToSupportTicket({
      ticketId: createdTicketId,
      senderRole: "ADMIN",
      senderId: "admin_user_001",
      senderName: "Support AddMe.io",
      senderEmail: "admin@addme.io",
      content: "Les points sont crédités instantanément après validation du robot anti-fraude !",
    });

    assert.ok(updated);
    assert.equal(updated.messages.length, 2);
    assert.equal(updated.messages[1].senderRole, "ADMIN");
    assert.equal(updated.status, "ANSWERED");
  });

  it("permet à l'usager de relancer la discussion", async () => {
    assert.ok(createdTicketId);
    const updated = await replyToSupportTicket({
      ticketId: createdTicketId,
      senderRole: "USER",
      senderId: "user_test_123",
      senderName: "Testeur Pro",
      senderEmail: "testeur@gmail.com",
      content: "Super, merci beaucoup pour cette réponse rapide !",
    });

    assert.ok(updated);
    assert.equal(updated.messages.length, 3);
    assert.equal(updated.status, "OPEN"); // Relance usager repasse en OPEN
  });

  it("permet de clôturer le ticket (RESOLVED)", async () => {
    assert.ok(createdTicketId);
    const resolved = await updateSupportTicketStatus(createdTicketId, "RESOLVED");
    assert.ok(resolved);
    assert.equal(resolved.status, "RESOLVED");
  });

  it("filtre les tickets par utilisateur et calcule les statistiques", async () => {
    const userTickets = await getUserSupportTickets("user_test_123");
    assert.ok(userTickets.length >= 1);
    assert.ok(userTickets.some((t) => t.id === createdTicketId));

    const stats = await getSupportStats();
    assert.ok(stats.totalTickets >= 1);
  });
});
