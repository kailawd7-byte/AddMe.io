import test from "node:test";
import assert from "node:assert/strict";
import { askUserSupportAI } from "../src/lib/ai-secretary.ts";

test("Support IA Conversationnelle - Question sur les fonctionnalités AddMe.io", async () => {
  const reply = await askUserSupportAI({
    userMessage: "Comment est-ce que je peux gagner des points sur TikTok et YouTube ?",
    userName: "Lucas",
  });

  console.log("--- Réponse IA Question AddMe.io ---");
  console.log(reply);

  assert.ok(reply.length > 20, "L'IA doit apporter une réponse substantielle");
  const lower = reply.toLowerCase();
  assert.ok(
    lower.includes("point") || lower.includes("tâche") || lower.includes("20"),
    "La réponse doit porter sur les points, les tâches ou les 20s"
  );
});

test("Support IA Conversationnelle - Refus poli des questions hors-sujet", async () => {
  const reply = await askUserSupportAI({
    userMessage: "Donne-moi la recette complète de la tarte aux pommes de grand-mère s'il te plaît.",
    userName: "Lucas",
  });

  console.log("--- Réponse IA Question Hors-Sujet ---");
  console.log(reply);

  const lower = reply.toLowerCase();
  assert.ok(
    lower.includes("addme") || lower.includes("plateforme") || lower.includes("cadre"),
    "L'IA doit rappeler qu'elle est l'assistant dédié d'AddMe.io"
  );
  assert.ok(
    !lower.includes("éplucher les pommes") && !lower.includes("cuire au four à 180"),
    "L'IA ne doit pas donner la recette de cuisine"
  );
});

test("Support IA Conversationnelle - Continuité d'un dialogue", async () => {
  const history = [
    { senderRole: "USER", content: "Bonjour, je viens de m'inscrire" },
    { senderRole: "ADMIN", content: "Bienvenue sur AddMe.io Lucas ! Comment puis-je vous aider ?" },
  ];

  const reply = await askUserSupportAI({
    userMessage: "C'est quoi le code à mettre dans la bio ?",
    history,
    userName: "Lucas",
    subject: "Liaison de compte",
  });

  console.log("--- Réponse IA Suivi Dialogue ---");
  console.log(reply);

  const lower = reply.toLowerCase();
  assert.ok(
    lower.includes("bio") || lower.includes("addme-") || lower.includes("compte") || lower.includes("code"),
    "L'IA doit expliquer le code de bio ADDME-XXXXX"
  );
});
