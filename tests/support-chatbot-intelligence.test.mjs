import test from "node:test";
import assert from "node:assert/strict";
import { askUserSupportAI } from "../src/lib/ai-secretary.ts";

test("Vérification de l'intelligence contextuelle et de l'absence de répétition du Chatbot Support", async (t) => {
  const genericRepetitiveGreeting = "Je suis votre **Assistant IA AddMe.io**. Je suis là pour répondre à toutes vos questions sur la plateforme :";

  await t.test("1. Question exacte de l'utilisateur : 'je ne comprend pas le me menu campagne'", async () => {
    const reply = await askUserSupportAI({
      userMessage: "je ne comprend pas le me menu campagne",
      userName: "kailawd7",
      subject: "je ne comprend pas le me menu campagne",
    });

    assert.ok(reply.includes("Campagnes") || reply.includes("campagne"), "La réponse aborde directement le menu campagnes");
    assert.ok(reply.includes("Coût") || reply.includes("points") || reply.includes("personnes"), "La réponse détaille le calcul ou les paramètres");
    assert.ok(!reply.includes(genericRepetitiveGreeting), "Ne renvoie PAS le message générique répétitif");
  });

  await t.test("2. Signalement de bug : Détection, classification et annonce du test par l'administrateur", async () => {
    const reply = await askUserSupportAI({
      userMessage: "j'ai un bug le bouton valider ne marche pas sur mon téléphone",
      userName: "kailawd7",
      subject: "Bouton bloqué",
    });

    assert.ok(reply.includes("Incident Technique") || reply.includes("BUG"), "Identifie le signalement technique / BUG");
    assert.ok(reply.includes("Administrateur") || reply.includes("administrateur"), "Mentionne la notification de l'administrateur");
    assert.ok(reply.includes("tester") || reply.includes("reproduire"), "Précise que l'administrateur va tester et reproduire le problème");
    assert.ok(!reply.includes(genericRepetitiveGreeting), "Ne renvoie PAS le message générique");
  });

  await t.test("3. Question sur les points en attente / rétention 24h", async () => {
    const reply = await askUserSupportAI({
      userMessage: "pourquoi mes points sont marqués en attente ?",
      userName: "kailawd7",
      subject: "Points bloqués",
    });

    assert.ok(reply.includes("24 heures") || reply.includes("rétention") || reply.includes("attente"), "Explique le délai de rétention de sécurité");
    assert.ok(!reply.includes(genericRepetitiveGreeting), "Ne renvoie PAS le message générique");
  });

  await t.test("4. Question sur les paiements Mobile Money SasPay", async () => {
    const reply = await askUserSupportAI({
      userMessage: "comment acheter des points avec Wave ou Orange Money ?",
      userName: "kailawd7",
      subject: "Achat SasPay",
    });

    assert.ok(reply.includes("SasPay") || reply.includes("Mobile Money"), "Explique la méthode SasPay");
    assert.ok(reply.includes("FCFA") || reply.includes("Packs"), "Détaille les packs et tarifs");
    assert.ok(!reply.includes(genericRepetitiveGreeting), "Ne renvoie PAS le message générique");
  });

  await t.test("5. Question sur la liaison de compte et code bio ADDME-XXXXX", async () => {
    const reply = await askUserSupportAI({
      userMessage: "comment lier mon compte sans mot de passe ?",
      userName: "kailawd7",
      subject: "Liaison de profil",
    });

    assert.ok(reply.includes("ADDME-") || reply.includes("bio"), "Explique le code bio temporaire");
    assert.ok(reply.includes("mot de passe"), "Rappelle l'interdiction de demander un mot de passe");
    assert.ok(!reply.includes(genericRepetitiveGreeting), "Ne renvoie PAS le message générique");
  });

  await t.test("6. Question sur le score de réputation et anti-fraude", async () => {
    const reply = await askUserSupportAI({
      userMessage: "comment fonctionne la réputation et que se passe-t-il si quelqu'un triche ?",
      userName: "kailawd7",
      subject: "Score de réputation",
    });

    assert.ok(reply.includes("100") || reply.includes("réputation"), "Explique le score sur 100");
    assert.ok(reply.includes("-10") || reply.includes("signal"), "Détaille la sanction et le signalement");
    assert.ok(!reply.includes(genericRepetitiveGreeting), "Ne renvoie PAS le message générique");
  });

  await t.test("7. Question sur les 12 réseaux compatibles", async () => {
    const reply = await askUserSupportAI({
      userMessage: "quels sont tous les réseaux sociaux compatibles avec AddMe.io ?",
      userName: "kailawd7",
      subject: "Plateformes",
    });

    assert.ok(reply.includes("12 plateformes") || reply.includes("TikTok"), "Liste les plateformes compatibles");
    assert.ok(!reply.includes(genericRepetitiveGreeting), "Ne renvoie PAS le message générique");
  });

  await t.test("8. Remerciements polis de l'utilisateur", async () => {
    const reply = await askUserSupportAI({
      userMessage: "merci beaucoup pour votre aide !",
      userName: "kailawd7",
    });

    assert.ok(reply.includes("plaisir") || reply.includes("disposition"), "Répond chaleureusement aux remerciements");
    assert.ok(!reply.includes(genericRepetitiveGreeting), "Ne renvoie PAS le message générique");
  });
});
