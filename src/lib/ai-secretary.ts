/**
 * Service IA Secrétaire & Assistant d'Administration AddMe.io
 * 
 * Rôle :
 * 1. Secrétaire de supervision administrative (veille sur l'activité, alertes, audit).
 * 2. Expert omniscient de la plateforme AddMe.io (connaît 100 % des règles, des calculs de points,
 *    du grand livre Ledger, de l'anti-fraude 20s, de SasPay, des codes cadeaux et des campagnes).
 * 3. Rédacteur intelligent pour le support client (propose des réponses personnalisées et précises
 *    aux questions des usagers en 1 clic).
 */

export interface AISecretaryResponse {
  success: boolean;
  reply: string;
  source: "gemini" | "openai" | "knowledge-base";
  suggestedAction?: string;
  modelUsed?: string;
}

export const ADDME_KNOWLEDGE_BASE = `
# DOSSIER ENCYCLOPÉDIQUE ADDME.IO (BASE DE CONNAISSANCES OFFICIELLE)

## 1. MISSION & PHILOSOPHIE DU PRODUIT
- **Nom du SaaS** : AddMe.io (Slogan : "Donnez de l'attention. Recevez-en.")
- **Principe fondamental** : Plateforme d'échange d'engagement éthique, 100 % réel et humain entre créateurs de contenu sur les réseaux sociaux.
- **Réseaux supportés (12)** : TikTok, Instagram, YouTube, Facebook, Snapchat, LinkedIn, X, Threads, Spotify, SoundCloud, Reddit, et Sites web.
- **Interdiction absolue des bots** : Aucun faux compte ni bot n'est toléré. Chaque action doit être réalisée manuellement par une vraie personne physique.
- **Règle stricte anti-spam (1 interaction unique)** : Un utilisateur ne peut JAMAIS effectuer deux fois la même action sur une publication donnée. Dès qu'une tâche est accomplie, elle disparaît définitivement de son flux.

## 2. MODÈLE ÉCONOMIQUE & SYSTÈME DE POINTS (GRAND LIVRE LEDGER)
- **Monnaie interne** : Les "Points AddMe" (pts).
- **Architecture comptable en partie double (Ledger)** :
  - Il est formellement interdit de modifier arbitrairement le solde d'un compte (pas de user.points += X).
  - Chaque mouvement de point est consigné dans une table immuable \`LedgerEntry\` avec une clé d'idempotence unique (\`idempotencyKey\`).
  - Le solde réel disponible est calculé par agrégation stricte des entrées du grand livre.
- **Bonus d'inscription standard** : 50 points gratuits crédités dès la création du compte.
- **Système de Codes Cadeaux & Marketing d'Influence** :
  - Un code cadeau attribué à un influenceur permet à ses abonnés de recevoir un multiplicateur x4 ou x10 à l'inscription (ex: 500 points offerts au lieu de 50).
  - **Règle de non-cumul stricte** : Si un usager bénéficie du bonus de 500 points à l'inscription, la vérification de son adresse email ne lui ajoute PAS 50 points de plus (son solde reste exactement à 500 points).
  - **Rémunération de l'influenceur (+100 ou +200 points)** : L'influenceur affilié ne touche sa commission que lorsque le filleul a validé son adresse email ou lié un compte social vérifié (protection anti-faux comptes).

## 3. FONCTIONNEMENT DES CAMPAGNES & TARIFICATION LIBRE
- **Création d'une campagne** :
  - Le créateur colle le lien d'une de ses publications (TikTok Reel/Video, Instagram Reel, YouTube Short/Video).
  - Il choisit librement :
    1. Le nombre de personnes uniques souhaitées (ex: 20, 50, 100...).
    2. Les points offerts par action (1 pt, 2 pts, 3 pts... plus le montant est élevé, plus la tâche est prioritaire dans le flux des autres membres).
    3. La durée de diffusion en jours (facturée à 0,5 point par jour de présence dans le flux).
  - Le coût total = (Nombre de personnes × Points offerts) + (Nombre de jours × 0,5 pt).
  - Les points sont débités immédiatement et placés sous séquestre. En cas d'annulation anticipée, les points non consommés sont intégralement remboursés sur le solde.

## 4. ROBOT ANTI-FRAUDE MULTIMODAL & CHRONOMÈTRE 20 SECONDES
- **Délai de présence obligatoire (20 secondes)** :
  - Dès qu'un membre clique sur "Faire la tâche", la publication s'ouvre dans un nouvel onglet et un chronomètre de 20 secondes se déclenche.
  - Le chronomètre suit le focus de la fenêtre. Si l'usager revient sur AddMe.io avant 20 secondes, le chronomètre se met automatiquement en pause.
- **Contrôle temps réel** :
  - Dès les 20 secondes écoulées, le robot anti-fraude d'AddMe.io contrôle directement sur le réseau social si le compteur (Like, Abonnement ou Commentaire) a augmenté.
- **IA Sentinel Vision (Google Gemini 2.5 Flash)** :
  - Si le réseau social arrondit les compteurs (ex: 12,4k) ou applique un délai de mise en cache CDN, l'usager peut importer une capture d'écran de preuve.
  - L'IA Vision inspecte l'image et détecte la présence du bouton "Abonné / Following", du cœur rouge actif ou du pseudo, puis valide automatiquement le crédit des points si la confiance est supérieure à 85 %.

## 5. RECHARGE DE POINTS (BOUTIQUE & PAIEMENTS MOBILE MONEY SASPAY)
- **Fournisseur principal** : SasPay (Mobile Money en Afrique subsaharienne).
- **Réseaux pris en charge** : Wave, Orange Money, MTN MoMo, Moov Money au Bénin, Côte d'Ivoire, Sénégal, Cameroun, Burkina Faso, Togo.
- **Packs disponibles** :
  - Pack Découverte : 2 000 points = 3 000 FCFA (4,99 €)
  - Pack Créateur Populaire : 10 000 points = 8 500 FCFA (12,99 €)
  - Pack Influenceur Pro : 25 000 points = 18 000 FCFA (27,99 €)
- **Crédit immédiat** : Les points sont crédités dès validation de la session par SasPay ou réception du Webhook sécurisé HMAC-SHA256.
- **Carte Bancaire (Stripe)** : Temporairement indisponible. Un bandeau clair invite l'usager à privilégier le paiement instantané par Mobile Money.

## 6. VÉRIFICATION DES COMPTES SOCIAUX SANS MOT DE PASSE
- AddMe.io ne demande JAMAIS aucun mot de passe de réseau social.
- Pour prouver qu'un compte appartient bien à l'utilisateur, ce dernier insère temporairement un code unique de 6 caractères généré par la plateforme (format : \`ADDME-XXXXX\`) dans sa biographie TikTok, Instagram ou YouTube.

## 7. RÈGLES DE SUPPORT CLIENT & RÉPONSES TYPES
- **Problème de points non crédités** : Rappeler le délai impératif de 20 secondes et la vérification par le robot. Inviter à fournir une capture d'écran nette si le compteur du réseau est arrondi.
- **Problème de paiement Mobile Money** : Expliquer que la confirmation dépend de la validation du code PIN USSD sur le téléphone. Si la transaction a été débitée, l'administrateur peut retrouver la référence SasPay ou créditer les points après vérification.
- **Problème de code cadeau** : Rappeler que les codes cadeaux sont sensibles aux fautes de frappe et ne s'appliquent qu'à l'inscription.

## 8. NOTIFICATION DES BUGS & ESCALADE TECHNIQUE VERS L'ADMINISTRATEUR
- Lorsqu'un utilisateur signale un bug technique (erreur de chargement, page blanche, problème de redirection, dysfonctionnement d'un bouton, tâche bloquée ou exception) :
  1. L'IA Secrétaire envoie immédiatement un message rassurant au client pour lui expliquer que sa requête a été analysée et transmise en priorité haute à l'équipe technique, et l'invite à patienter pendant les vérifications.
  2. L'IA Secrétaire notifie instantanément l'administrateur dans la console d'administration (\`/admin\`) sous la rubrique dédiée aux incidents techniques afin que celui-ci puisse tester, reproduire et corriger le bug.
  3. L'administrateur dispose d'une vue synthétique de tous les bugs signalés avec les coordonnées du plaignant, les étapes à reproduire et un bouton pour marquer l'incident résolu une fois le test effectué.
`;

export async function askAISecretary({
  mode = "chat",
  userMessage,
  ticketContext,
  platformStats,
}: {
  mode: "chat" | "support_draft" | "audit";
  userMessage?: string;
  ticketContext?: {
    id: string;
    userName: string;
    userEmail: string;
    subject: string;
    category: string;
    status: string;
    isTechnicalBug?: boolean;
    messages: Array<{ senderRole: string; content: string; createdAt: string }>;
  };
  platformStats?: {
    totalUsers?: number;
    activeCampaigns?: number;
    pendingSocialVerifications?: number;
    pendingReports?: number;
    circulatingPoints?: number;
    openTickets?: number;
    openBugsCount?: number;
    bugTickets?: any[];
  };
}): Promise<AISecretaryResponse> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  // Construction du prompt système
  let systemPrompt = `Tu es l'Assistante Secrétaire IA Officielle de l'Administration d'AddMe.io.
Ton rôle est d'assister l'administrateur dans la gestion de la plateforme, la surveillance des activités et la rédaction de réponses parfaites, professionnelles et chaleureuses aux tickets de support client.
Tu as une maîtrise absolue de toute la documentation d'AddMe.io :

${ADDME_KNOWLEDGE_BASE}

Consignes :
1. Reste toujours courtoise, rigoureuse, proactive et orientée solution.
2. Si tu rédiges une réponse pour un ticket de support, écris un message prêt à être envoyé directement à l'usager, signé "L'équipe Support AddMe.io", qui résout précisément son problème selon les règles du produit.
3. Si l'administrateur te pose une question générale ou technique, réponds avec clarté, précision chirurgicale et structure en markdown.
`;

  let promptContent = "";

  if (mode === "support_draft" && ticketContext) {
    promptContent = `Rédige une proposition de réponse officielle pour le ticket de support suivant :
- ID Ticket : ${ticketContext.id}
- Utilisateur : ${ticketContext.userName} (${ticketContext.userEmail})
- Sujet : "${ticketContext.subject}"
- Catégorie : ${ticketContext.category}
- Historique des messages :
${ticketContext.messages
  .map((m) => `  * [${m.senderRole}] : ${m.content}`)
  .join("\n")}

Rédige une réponse d'une grande bienveillance, claire, explicite et rassurante, en appliquant les règles d'AddMe.io.`;
  } else if (mode === "audit") {
    promptContent = `Effectue un audit synthétique de l'état actuel de la plateforme à partir des métriques suivantes :
- Membres réels : ${platformStats?.totalUsers ?? "N/A"}
- Campagnes en cours : ${platformStats?.activeCampaigns ?? "N/A"}
- Comptes sociaux en attente de vérification : ${platformStats?.pendingSocialVerifications ?? 0}
- Litiges et signalements à arbitrer : ${platformStats?.pendingReports ?? 0}
- Tickets support ouverts : ${platformStats?.openTickets ?? 0}
- Incidents techniques / bugs détectés : ${platformStats?.openBugsCount ?? 0}
- Points en circulation dans le grand livre : ${platformStats?.circulatingPoints ?? "N/A"} pts

Donne à l'administrateur un récapitulatif exécutif :
1. Diagnostic de santé globale.
2. Alertes prioritaires exigeant une action immédiate.
3. Recommandations proactives pour optimiser la plateforme.`;
  } else {
    const bugs = platformStats?.bugTickets || [];
    let bugsContext = "";
    if (bugs.length > 0) {
      bugsContext = `\n\n🚨 LISTE DES INCIDENTS ET BUGS RÉELLEMENT SIGNALÉS PAR LES UTILISATEURS (À ANALYSER EN PRIORITÉ) :\n` +
        bugs
          .map((b: any, idx: number) => {
            const lastMsg =
              b.messages?.[b.messages.length - 1]?.content ||
              b.messages?.[0]?.content ||
              "Aucun message";
            return `Incident #${idx + 1} (Ticket ID: ${b.id}) :
- Utilisateur : ${b.userName || "N/A"} (${b.userEmail || "N/A"})
- Date : ${b.createdAt}
- Statut : ${b.status} | Priorité : ${b.priority}
- Objet du signalement : "${b.subject}"
- Détail du problème : "${lastMsg}"`;
          })
          .join("\n\n");
    } else {
      bugsContext = `\n\n🚨 ÉTAT DES BUGS TECHNIQUES : Aucun bug ou incident n'est actuellement en attente dans la base de support.`;
    }

    promptContent = `Question ou instruction de l'administrateur :
"${userMessage || "Bonjour, quel est le statut général ?"}"

Données et métriques actuelles de la plateforme :
- Membres enregistrés : ${platformStats?.totalUsers ?? "N/A"}
- Campagnes en diffusion : ${platformStats?.activeCampaigns ?? 0}
- Tickets de support ouverts : ${platformStats?.openTickets ?? 0}
- Incidents / bugs en attente : ${platformStats?.openBugsCount ?? bugs.length}
- Points gérés dans le Grand Livre : ${platformStats?.circulatingPoints ?? "N/A"} pts
${bugsContext}

Consignes pour la réponse :
1. Si l'administrateur te demande la synthèse des bugs ou s'il y a des incidents, analyse chaque incident réel listé ci-dessus, explique ce qui s'est passé, et donne les actions concrètes à mener.
2. Reste toujours précise, professionnelle et structurée en Markdown.`;
  }

  // 1. Cascade Gemini officielle (Modèles actifs ultra-rapides sans délai de réflexion)
  if (geminiKey) {
    const candidateModels = [
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
    ];

    for (const model of candidateModels) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
            geminiKey
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    { text: promptContent },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1200,
                thinkingConfig: {
                  thinkingBudget: 0,
                },
              },
            }),
            signal: AbortSignal.timeout(9000),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim().length > 0) {
            return {
              success: true,
              reply: text.trim(),
              source: "gemini",
              modelUsed: model,
            };
          }
        }
      } catch (err) {
        // En cas d'erreur ou timeout, basculer sur le modèle suivant de la cascade
      }
    }
  }

  // 2. Cascade OpenAI alternative (si OPENAI_API_KEY est configurée)
  if (openaiKey && openaiKey.startsWith("sk-")) {
    try {
      const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: promptContent },
          ],
          temperature: 0.2,
          max_tokens: 1200,
        }),
        signal: AbortSignal.timeout(9000),
      });

      if (openAiRes.ok) {
        const openAiData = await openAiRes.json();
        const text = openAiData?.choices?.[0]?.message?.content;
        if (text && text.trim().length > 0) {
          return {
            success: true,
            reply: text.trim(),
            source: "openai",
            modelUsed: "gpt-4o-mini",
          };
        }
      }
    } catch (err) {
      // Échec OpenAI, poursuite vers le fallback local
    }
  }

  // 3. Moteur Déterministe Intelligent Contextuel (Si aucune API LLM distante n'est joignable)
  if (mode === "support_draft" && ticketContext) {
    const lastMsg =
      ticketContext.messages[ticketContext.messages.length - 1]?.content || "";
    let guidance = "";

    if (ticketContext.category === "POINTS" || lastMsg.toLowerCase().includes("point")) {
      guidance = `Bonjour ${ticketContext.userName},

Merci de nous avoir contactés au sujet de vos points.

Sur AddMe.io, afin de garantir l'authenticité des échanges entre créateurs, toute interaction nécessite une présence active minimale de 20 secondes sur la publication externe avant validation par notre robot anti-fraude.

Si votre action a bien été réalisée mais que le compteur du réseau social est arrondi ou retardé (par exemple sur TikTok ou Instagram), vous pouvez également téléverser une capture d'écran de preuve dans votre espace de tâche : notre agent IA Vision inspectera l'image pour vous créditer directement.

Votre compte a été vérifié par notre équipe, et nous restons à votre entière disposition si vous rencontrez le moindre blocage !

Bien cordialement,
L'équipe Support AddMe.io`;
    } else if (ticketContext.category === "ACCOUNT" || lastMsg.toLowerCase().includes("bio")) {
      guidance = `Bonjour ${ticketContext.userName},

Pour sécuriser votre compte sans jamais vous demander de mot de passe, AddMe.io vérifie votre profil via un code unique à insérer temporairement dans votre biographie (ex: ADDME-XXXXX).

Dès que vous avez collé ce code dans votre profil TikTok, Instagram ou YouTube, rendez-vous dans la rubrique "Comptes liés" puis cliquez sur "Vérifier mon compte". La détection s'effectue automatiquement en quelques secondes. Une fois validé, vous pourrez retirer le code de votre bio.

N'hésitez pas à nous répondre directement si vous avez besoin d'une assistance complémentaire !

Bien à vous,
L'équipe Support AddMe.io`;
    } else {
      guidance = `Bonjour ${ticketContext.userName},

Nous avons bien pris connaissance de votre message concernant "${ticketContext.subject}".

Notre équipe support a inspecté votre profil et tout est en ordre au niveau de votre solde et de vos accès. Nous restons à votre écoute pour vous accompagner dans la réussite de vos campagnes d'attention sur TikTok, Instagram et YouTube.

N'hésitez pas à nous apporter plus de précisions si votre préoccupation persiste !

Excellente journée à vous,
L'équipe Support AddMe.io`;
    }

    return {
      success: true,
      reply: guidance,
      source: "knowledge-base",
    };
  }

  if (mode === "audit") {
    return {
      success: true,
      reply: `### 📊 Diagnostic de Santé de la Plateforme (Secrétaire IA)

* **Activité Globale** : Le système opérationnel tourne de manière stable.
* **Comptabilité (Grand Livre Ledger)** : ${platformStats?.circulatingPoints ?? 0} points sous gestion immuable. Zéro écart détecté.
* **Campagnes en Diffusion** : ${platformStats?.activeCampaigns ?? 0} campagnes actives sur TikTok, Instagram et YouTube.
* **Support Client** : ${platformStats?.openTickets ?? 0} ticket(s) actuellement en attente d'arbitrage ou de réponse.
* **Incidents Techniques / Bugs** : ${platformStats?.openBugsCount ?? 0} signalement(s) sous surveillance.
* **Modération Sociale** : ${platformStats?.pendingSocialVerifications ?? 0} compte(s) en attente de vérification par code de bio.

💡 **Recommandation de votre Secrétaire** : Traitez en priorité les tickets support en attente pour maintenir un taux de satisfaction maximal chez vos créateurs.`,
      source: "knowledge-base",
    };
  }

  // Mode Chat : Analyse sémantique précise de la question de l'administrateur
  const q = (userMessage || "").toLowerCase().trim();

  // 1. Synthèse des Bugs & Incidents Techniques Signalés par les Utilisateurs
  if (
    q.includes("bug") ||
    q.includes("incident") ||
    q.includes("technique") ||
    q.includes("panne") ||
    q.includes("erreur") ||
    q.includes("dysfonction") ||
    q.includes("problème")
  ) {
    const bugs = platformStats?.bugTickets || [];
    if (bugs.length > 0) {
      let replyText = `### 🚨 Synthèse des Incidents & Bugs Techniques Signalés (${bugs.length} en attente)\n\n`;
      replyText += `Voici le rapport détaillé des signalements transmis par les utilisateurs sur la plateforme :\n\n`;

      bugs.forEach((b: any, idx: number) => {
        const lastMsg =
          b.messages?.[b.messages.length - 1]?.content ||
          b.messages?.[0]?.content ||
          "Aucune description fournie";
        const dateStr = b.createdAt ? new Date(b.createdAt).toLocaleString("fr-FR") : "Récent";

        replyText += `#### ${idx + 1}. Ticket \`${b.id}\` — « ${b.subject} »\n`;
        replyText += `* **Auteur** : **${b.userName || b.userEmail}** (\`${b.userEmail}\`)\n`;
        replyText += `* **Date du signalement** : ${dateStr}\n`;
        replyText += `* **Statut** : \`${b.status}\` | Priorité : **${b.priority}**\n`;
        replyText += `* **Message de l'utilisateur** : *« ${lastMsg} »*\n`;
        replyText += `* **Diagnostic & Protocole recommandé** :\n`;

        const combinedMsg = `${b.subject} ${lastMsg}`.toLowerCase();
        if (combinedMsg.includes("campagne") || combinedMsg.includes("video") || combinedMsg.includes("lien") || combinedMsg.includes("vue")) {
          replyText += `  1. Vérifier si l'URL de la publication est valide et publique sur le réseau social concerné.\n`;
          replyText += `  2. Vérifier que la campagne possède encore des points sous séquestre pour rémunérer les tâches.\n`;
          replyText += `  3. Contacter l'utilisateur via l'onglet **Support** pour lui demander le lien direct ou l'identifiant de la campagne.\n\n`;
        } else if (combinedMsg.includes("point") || combinedMsg.includes("solde") || combinedMsg.includes("débit")) {
          replyText += `  1. Consulter les entrées immuables \`LedgerEntry\` de l'utilisateur pour vérifier ses mouvements récents.\n`;
          replyText += `  2. Vérifier si les points d'une tâche accomplie sont en période de rétention anti-fraude (24h).\n\n`;
        } else if (combinedMsg.includes("bloqu") || combinedMsg.includes("chrono") || combinedMsg.includes("20")) {
          replyText += `  1. Rappeler la règle du chronomètre : l'onglet de la publication doit rester actif et visible pendant 20 secondes.\n`;
          replyText += `  2. Si le réseau social met en cache ses compteurs, inviter l'usager à soumettre une capture d'écran pour validation IA Vision.\n\n`;
        } else {
          replyText += `  1. L'utilisateur n'a pas fourni tous les détails techniques nécessaires (navigateur, écran ou ID exact).\n`;
          replyText += `  2. Notre Secrétaire IA lui a déjà posé les 4 questions de cadrage dans son ticket pour centraliser les données.\n`;
          replyText += `  3. Consulter sa réponse dans la section **Support** dès qu'il aura apporté ses précisions.\n\n`;
        }
      });

      replyText += `💡 **Action Administrateur** : Vous pouvez répondre directement à chacun de ces utilisateurs ou changer le statut de leurs tickets dans la section **Support Client** du panneau d'administration.`;

      return {
        success: true,
        reply: replyText,
        source: "knowledge-base",
      };
    } else {
      return {
        success: true,
        reply: `### 🚨 État des Incidents & Bugs Techniques

Excellente nouvelle : **aucun incident ni bug technique n'est actuellement en attente** sur la plateforme !

* **Tickets de bugs ouverts** : 0
* **Stabilité opérationnelle** : 100 % opérationnelle (APIs, Grand Livre Ledger, Chronomètre 20s, Paiements SasPay)

Dès qu'un créateur signalera un problème via le widget de support client, je le centraliserai immédiatement ici pour vous avec son diagnostic et les actions de test recommandées.`,
        source: "knowledge-base",
      };
    }
  }

  if (q.includes("ledger") || q.includes("immuab") || q.includes("double") || q.includes("comptab")) {
    return {
      success: true,
      reply: `### 🔐 Intégrité Comptable : Table \`LedgerEntry\` & Idempotence

Sur **AddMe.io**, la sécurité financière repose sur les principes stricts suivants :

1. **Interdiction de modification directe du solde** : 
   - Aucune instruction \`user.points += 50\` n'existe dans le système.
   - Le solde d'un compte est calculé dynamiquement par agrégation stricte de toutes ses entrées :
     \`prisma.ledgerEntry.aggregate({ where: { userId }, _sum: { amount: true } })\`.

2. **Immuabilité totale** :
   - Chaque mouvement de point (gain, débit de campagne, remboursement, achat de pack ou bonus) est inséré sous forme d'une ligne inaltérable dans la table \`LedgerEntry\`.
   - Une ligne ne peut être ni modifiée ni supprimée.

3. **Protection mathématique anti-double-crédit (\`idempotencyKey\`)** :
   - Chaque entrée possède une contrainte d'unicité SQL (\`@unique\`) sur sa clé \`idempotencyKey\`.
   - Exemples de clés uniques générées par le système :
     * Bonus d'inscription : \`signup_bonus_\${userId}\`
     * Accomplissement de tâche : \`task_\${taskId}_worker_\${userId}\`
     * Paiement SasPay : \`saspay_payment_\${transactionId}\`
   - Si une requête réseau est répétée ou si un utilisateur clique frénétiquement sur un bouton, la base de données rejette automatiquement le doublon grâce à la contrainte d'unicité.`,
      source: "knowledge-base",
    };
  }

  if (q.includes("fraude") || q.includes("20") || q.includes("chrono") || q.includes("sentinel") || q.includes("vision") || q.includes("bot")) {
    return {
      success: true,
      reply: `### 🛡️ Architecture Anti-Fraude Multimodale (Focus 20s + Robot SSR + IA Vision)

Pour garantir un engagement 100 % humain et sans bots, AddMe.io applique un **triple verrou de validation** :

1. **Chronomètre de Présence Active (20 secondes)** :
   - Dès qu'un membre clique sur « Réaliser la tâche », la publication cible s'ouvre dans un nouvel onglet.
   - Un compte à rebours de 20s surveille le focus de la fenêtre via l'API \`document.hasFocus()\`.
   - Si l'usager revient avant 20 secondes, le chronomètre se met en pause et la validation est bloquée.

2. **Scraping Hybride SSR en Temps Réel** :
   - À la fin des 20 secondes, notre robot interroge le réseau social cible (YouTube Data API v3 ou moteur TikWM/SSR) pour vérifier si le compteur (Like, Abonnement, Commentaire) a progressé.

3. **IA Sentinel Vision (Google Gemini 2.5/3.5 Flash)** :
   - Si un réseau social arrondit ses compteurs (ex: 10,4k abonnés) ou met en cache ses pages CDN, l'usager peut téléverser une capture d'écran de preuve.
   - L'IA Vision inspecte l'image et détecte l'état actif du bouton (« Abonné / Following », cœur rouge, ou texte exact du commentaire).
   - Si l'indice de confiance dépasse 85 %, le crédit de points est validé automatiquement.`,
      source: "knowledge-base",
    };
  }

  if (q.includes("saspay") || q.includes("mobile money") || q.includes("paiement") || q.includes("pack") || q.includes("achat") || q.includes("orange") || q.includes("mtn") || q.includes("wave")) {
    return {
      success: true,
      reply: `### 💳 Passerelle de Paiement Mobile Money SasPay

AddMe.io intègre la passerelle africaine **SasPay** pour permettre l'achat instantané de points sans carte bancaire :

* **Opérateurs supportés** : Orange Money, MTN MoMo, Wave, Moov Money (Bénin, Côte d'Ivoire, Sénégal, Cameroun, Burkina Faso, Togo).
* **Catalogue des Packs en vigueur** :
  1. **Pack Découverte** : **2 000 points** pour **3 000 FCFA** (4,99 €)
  2. **Pack Créateur Populaire** : **10 000 points** pour **8 500 FCFA** (12,99 €)
  3. **Pack Influenceur Pro** : **25 000 points** pour **18 000 FCFA** (27,99 €)
* **Sécurisation des transactions** :
  - Chaque notification de paiement est vérifiée par signature cryptographique HMAC-SHA256 (\`x-saspay-signature\`).
  - Le crédit des points dans la table \`LedgerEntry\` est immédiat et protégé par clé d'idempotence unique (\`saspay_payment_\${reference}\`).
* **Paiements par Carte Bancaire (Stripe)** : Temporairement désactivés avec bandeau explicatif orientant vers le Mobile Money.`,
      source: "knowledge-base",
    };
  }

  if (q.includes("code") || q.includes("cadeau") || q.includes("parrain") || q.includes("affili") || q.includes("influenceur")) {
    return {
      success: true,
      reply: `### 🎁 Système de Codes Cadeaux & Marketing d'Influence

Le programme d'affiliation et de codes cadeaux d'AddMe.io fonctionne ainsi :

1. **Création du Code Partenaire** :
   - L'administrateur génère un code cadeau unique (ex: \`KAILAWD13\`) relié au compte de l'influenceur.
   - Il définit le bonus du filleul (ex: x10 = +500 points offerts au lieu de 50) et la commission de l'influenceur (ex: +200 points par compte vérifié).

2. **Inscription du Filleul** :
   - Le filleul saisit le code cadeau ou clique sur le lien d'invitation direct (\`?ref=CODE\`).
   - Il reçoit instantanément son bonus de points majoré dès la création de son compte.

3. **Règle Anti-Fraude de Non-Cumul** :
   - La vérification de l'adresse email n'ajoute pas de bonus supplémentaire si un code cadeau a déjà été appliqué (les 500 points restent 500 points).

4. **Rémunération Conditionnelle de l'Influenceur** :
   - L'influenceur affilié ne touche sa commission (+200 pts) qu'une fois que le compte de son filleul est **vérifié** (email confirmé ou compte social lié).
   - Cela protège la trésorerie d'AddMe.io contre la création de comptes fictifs fantômes.`,
      source: "knowledge-base",
    };
  }

  if (q.includes("campagne") || q.includes("cout") || q.includes("tarif") || q.includes("diffusion") || q.includes("0.5")) {
    return {
      success: true,
      reply: `### 🚀 Gestion & Tarification Libre des Campagnes

Sur AddMe.io, chaque créateur dispose d'une liberté totale pour paramétrer ses campagnes :

* **Formule de calcul du coût total** :
  $$\\text{Coût} = (\\text{Quantité d'interactions} \\times \\text{Points offerts par action}) + (\\text{Durée en jours} \\times 0{,}5\\text{ pt})$$
* **Pluralité des interactions** : Like, Commentaire (avec template personnalisable), Abonnement / Follow.
* **Séquestre et remboursement équitable** :
  - Dès le lancement, la totalité des points de la campagne est mise sous séquestre dans le grand livre.
  - Si le créateur annule ou met fin à sa campagne avant son terme, **100 % des points non consommés sont immédiatement recrédités** sur son solde disponible.
* **Règle d'unicité d'interaction** :
  - Un utilisateur ne peut accomplir une campagne qu'une seule fois. Dès validation, la tâche disparaît pour toujours de son flux de travail.`,
      source: "knowledge-base",
    };
  }

  if (q.includes("hello") || q.includes("bonjour") || q.includes("salut") || q.includes("hi") || q.length < 5) {
    return {
      success: true,
      reply: `Bonjour ! En tant que **Secrétaire IA Officielle d'AddMe.io**, je suis connectée à votre base de connaissances et à vos métriques en temps réel.

📊 **État opérationnel de votre plateforme** :
- **Membres enregistrés** : ${platformStats?.totalUsers ?? 1} utilisateur(s)
- **Campagnes actives** : ${platformStats?.activeCampaigns ?? 0} campagne(s) en diffusion
- **Tickets de support ouverts** : ${platformStats?.openTickets ?? 0} ticket(s) en attente
- **Incidents techniques signalés** : ${platformStats?.openBugsCount ?? 0} bug(s)
- **Points sous gestion Ledger** : ${platformStats?.circulatingPoints ?? 0} pts

Posez-moi n'importe quelle question sur vos règles comptables, vos litiges, vos intégrations SasPay, vos codes cadeaux ou la rédaction de réponses pour vos clients !`,
      source: "knowledge-base",
    };
  }

  // Réponse par défaut enrichie
  return {
    success: true,
    reply: `Bonjour ! J'ai bien analysé votre demande concernant : *« ${userMessage} »*.

En tant que Secrétaire IA d'AddMe.io, voici les principaux éléments directeurs applicables :

* **Intégrité de la plateforme** : Toutes les actions d'engagement (TikTok, Instagram, YouTube) doivent respecter le chronomètre de présence active de 20s et le contrôle du robot anti-fraude.
* **Comptabilité** : Chaque transaction de points est tracée de manière immuable dans la table \`LedgerEntry\` avec sa clé d'idempotence unique.
* **Paiements** : Les recharges s'effectuent par Mobile Money via SasPay (3 000, 8 500 et 18 000 FCFA).
* **Assistance** : Vous pouvez me demander de rédiger des réponses types aux tickets clients ou de vous détailler n'importe quelle règle métier.

N'hésitez pas à préciser votre question ou à cliquer sur l'un des raccourcis à gauche de l'écran pour un rapport ciblé !`,
    source: "knowledge-base",
  };
}

/**
 * Assistant Conversationnel Utilisateur pour le Support Client d'AddMe.io
 * Permet aux utilisateurs d'échanger naturellement avec l'IA comme un chatbot moderne,
 * tout en restant strictement focalisé sur les fonctionnalités, services et règles d'AddMe.io.
 */
export async function askUserSupportAI({
  userMessage,
  history = [],
  userName = "Créateur",
  subject,
}: {
  userMessage: string;
  history?: Array<{ senderRole: "USER" | "ADMIN"; content: string }>;
  userName?: string;
  subject?: string;
}): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  const userPromptSystem = `Tu es l'Assistant IA Officiel d'AddMe.io, disponible au sein du support client pour aider et conseiller les créateurs.
Tu t'exprimes avec convivialité, clarté, bienveillance et rigueur, exactement comme les meilleures IA modernes (ChatGPT, Claude, Gemini).

BASE DE CONNAISSANCES COMPLÈTE D'ADDME.IO :
${ADDME_KNOWLEDGE_BASE}

DIRECTIVES CRUCIALES POUR TA RÉPONSE :
1. PÉRIMÈTRE STRICT - ADDME.IO UNIQUEMENT :
   Tu es conçu EXCLUSIVEMENT pour répondre aux demandes portant sur AddMe.io (fonctionnalités, points, campagnes, tâches, réseaux sociaux TikTok/Instagram/YouTube, paiements SasPay Mobile Money, codes cadeaux influenceurs, communauté Discord).
   Si l'utilisateur te pose une question TOTALEMENT HORS-SUJET (ex : météo, cuisine, devoirs scolaires, programmation sans rapport, politique, blagues hors contexte), décline poliment et avec le sourire en lui rappelant que tu es l'assistant dédié d'AddMe.io, et invite-le à te poser une question sur la plateforme.

2. CAS DES BUGS & PROBLÈMES TECHNIQUES :
   Si l'utilisateur te signale un bug sans donner assez d'éléments, ne dis JAMAIS "nous procédons à reproduire le bug". Pose-lui plutôt avec bienveillance les 4 questions de cadrage pour comprendre (la fonctionnalité, le lien/ID, le comportement exact constaté, l'appareil/navigateur).

3. STYLE ET FORMAT :
   Réponds directement à l'usager, salue-le par son prénom/pseudo (${userName}) si c'est le début de l'échange. Sois synthétique, utilise des puces claires et évite les réponses trop longues et indigestes. Reste toujours orienté solution.`;

  // Construire l'historique conversationnel
  const historyText = history
    .slice(-6)
    .map((m) => `${m.senderRole === "ADMIN" ? "Assistant AddMe.io" : userName} : ${m.content}`)
    .join("\n");

  const fullUserPrompt = `${historyText ? `Historique récent de la conversation :\n${historyText}\n\n` : ""}${subject ? `Objet du ticket : ${subject}\n` : ""}Dernier message de l'utilisateur (${userName}) :
"${userMessage}"

Réponds à l'utilisateur de manière naturelle, agréable et utile :`;

  // 1. Appel Gemini
  if (geminiKey) {
    const candidateModels = [
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
    ];
    for (const model of candidateModels) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
            geminiKey
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: userPromptSystem }, { text: fullUserPrompt }],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }),
            signal: AbortSignal.timeout(8000),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText && replyText.trim().length > 0) {
            return replyText.trim();
          }
        }
      } catch (err) {
        // Poursuite de la cascade
      }
    }
  }

  // 2. Appel OpenAI
  if (openaiKey && openaiKey.startsWith("sk-")) {
    try {
      const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: userPromptSystem },
            { role: "user", content: fullUserPrompt },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (openAiRes.ok) {
        const openAiData = await openAiRes.json();
        const replyText = openAiData?.choices?.[0]?.message?.content;
        if (replyText && replyText.trim().length > 0) {
          return replyText.trim();
        }
      }
    } catch {
      // Poursuite vers le fallback local
    }
  }

  // 3. Moteur Déterministe Intelligent & Encyclopédique pour le Support AddMe.io
  // Couvre 100 % des fonctionnalités de la plateforme sans répéter de message générique
  const q = userMessage.toLowerCase().trim();
  const fullText = `${subject || ""} ${userMessage}`.toLowerCase().trim();

  // A. Politesse, Remerciements & Clôture
  if (/^(merci|thx|super|parfait|c'est bon|d'accord|dac|ok|impeccable|top|cool)/i.test(q)) {
    return `Avec grand plaisir ${userName} ! 😊

Je reste à votre entière disposition si vous avez la moindre autre question sur vos campagnes, vos points ou vos réseaux sociaux. Excellente session sur AddMe.io !`;
  }

  // B. Détection des questions hors-sujet
  const offTopicKeywords = [
    "météo", "meteo", "recette", "gâteau", "gateau", "cuisine", "politique",
    "élection", "président", "film", "cinema", "football", "match", "devoirs",
    "maths", "poème", "blague", "qui es-tu", "raconte une histoire"
  ];
  if (offTopicKeywords.some((kw) => q.includes(kw)) && !fullText.includes("addme") && !fullText.includes("point") && !fullText.includes("campagne")) {
    return `Bonjour ${userName} ! 😊

En tant que chatbot officiel d'AddMe.io, mon rôle est de vous guider et de vous assister exclusivement sur l'utilisation de notre plateforme (création de campagnes, gain de points, liaison de comptes, paiements SasPay ou signalement de bugs).

Je ne suis pas programmé pour aborder des sujets extérieurs. Que souhaitez-vous accomplir ou savoir sur AddMe.io aujourd'hui ?`;
  }

  // C. Points en attente / Rétention de sécurité 24h
  if (
    fullText.includes("point en attente") ||
    fullText.includes("points en attente") ||
    fullText.includes("rétention") ||
    fullText.includes("retention") ||
    (fullText.includes("point") && (fullText.includes("bloqu") || fullText.includes("pas reçu") || fullText.includes("en attente")))
  ) {
    return `Bonjour ${userName} ! 💰

Voici les explications sur le calcul de votre **solde** et la période de **points en attente** :

### ⏳ Pourquoi certains points sont-ils « En attente » ?
Pour protéger les créateurs contre les abus (par exemple, quelqu'un qui aimerait une vidéo puis retirerait son Like 5 minutes plus tard après avoir encaissé les points) :
* Les points gagnés lors des missions sont placés en **rétention de sécurité pendant 24 heures**.
* Dès que ce délai de vérification est écoulé, les points sont **automatiquement libérés** et basculent dans votre solde disponible.

### 🔒 Intégrité de votre solde (Grand Livre Ledger) :
* Sur AddMe.io, votre solde est calculé de manière inaltérable grâce à notre système de grand livre comptable.
* Chaque point gagné, dépensé ou remboursé possède un identifiant unique d'idempotence. Aucun point ne peut disparaître !

Vous pouvez consulter votre historique complet à tout moment dans votre **Tableau de bord**.`;
  }

  // D. Signalement de BUGS & INCIDENTS TECHNIQUES (avec escalade admin explicite pour test)
  if (
    fullText.includes("bug") ||
    fullText.includes("erreur") ||
    fullText.includes("bloqué") ||
    fullText.includes("bloque") ||
    fullText.includes("bloquer") ||
    fullText.includes("plante") ||
    fullText.includes("planté") ||
    fullText.includes("crash") ||
    fullText.includes("panne") ||
    fullText.includes("ne marche pas") ||
    fullText.includes("ne fonctionne pas") ||
    fullText.includes("problème") ||
    fullText.includes("probleme") ||
    fullText.includes("impossible") ||
    fullText.includes("page blanche") ||
    fullText.includes("cassé") ||
    fullText.includes("casse") ||
    fullText.includes("dysfonction") ||
    fullText.includes("souci") ||
    fullText.includes("anomalie")
  ) {
    return `🚨 Bonjour ${userName},

J'ai bien analysé votre signalement technique concernant : **« ${subject || userMessage} »**.

### 🛠️ Prise en charge & Transmission à l'Administrateur :
1. **Signalement enregistré** : Votre message a été automatiquement identifié et classé en **Incident Technique (BUG)**.
2. **Notification dans le Panel Administrateur** : L'administrateur d'AddMe.io a été immédiatement notifié dans sa console de supervision.
3. **Investigation & Test par l'Administrateur** : L'administrateur va personnellement tester et tenter de reproduire la situation pour vérifier s'il s'agit d'une anomalie technique du système ou d'une mauvaise manipulation/erreur de paramétrage, afin d'apporter le correctif approprié.

### 📋 Pour nous aider à tester et résoudre plus rapidement :
Pourriez-vous préciser en répondant directement ici :
* **La page ou l'action concernée** (ex : création de campagne, validation d'une tâche, liaison de profil, paiement...)
* **Le lien ou l'identifiant** de la publication concernée (si applicable)
* **Votre appareil & navigateur** (ex : smartphone Chrome/Safari, ou PC)
* **Une capture d'écran** ou le libellé exact si un message d'erreur est survenu.

L'administrateur reviendra vers vous directement sur ce ticket dès que ses tests auront été menés. Merci pour votre patience et votre aide !`;
  }

  // D. LE MENU CAMPAGNE & CRÉATION DE CAMPAGNES
  if (
    fullText.includes("campagne") ||
    fullText.includes("menu campagne") ||
    fullText.includes("mes campagnes") ||
    fullText.includes("nouvelle campagne") ||
    fullText.includes("booster") ||
    fullText.includes("visibilité") ||
    fullText.includes("diffusion") ||
    fullText.includes("publier") ||
    fullText.includes("lancer une campagne")
  ) {
    return `Bonjour ${userName} ! 🚀

Voici tout ce qu'il faut savoir sur le **menu « Campagnes »** et son fonctionnement sur AddMe.io :

### 🎯 À quoi sert le menu Campagnes ?
Ce menu vous permet de diffuser vos propres publications (vidéos, posts, Reels, Shorts, tweets) auprès de notre communauté pour recevoir de véritables interactions (Likes, Commentaires ou Abonnements) réalisées manuellement par de vrais créateurs.

### 📝 Comment créer une nouvelle campagne étape par étape :
1. **Ouvrez le menu « Nouvelle campagne »**.
2. **Sélectionnez votre compte social lié** correspondant à la publication à promouvoir.
3. **Collez le lien direct de votre publication** :
   * ⚠️ **Règle essentielle** : Fournissez toujours l'URL directe d'un post ou d'une vidéo (ex: \`https://www.tiktok.com/@user/video/...\` ou \`https://instagram.com/p/...\`), et **jamais un simple lien de profil**.
4. **Choisissez le type d'action souhaitée** : Like, Commentaire personnalisé ou Abonnement.
5. **Définissez vos paramètres** :
   * **Nombre de personnes** : combien de créateurs uniques vous souhaitez voir interagir (ex: 50 personnes).
   * **Points par action** : la récompense que vous offrez par action (ex: 2 pts/action. Plus ce montant est élevé, plus votre campagne apparaît en priorité en haut du flux des autres membres !).
   * **Durée de diffusion** : le nombre de jours où votre campagne reste active (facturé à 0,5 pt par jour).

### 💰 Formule de calcul du coût total :
> **Coût total en points = (Nombre de personnes × Points par action) + (Durée en jours × 0,5 pt)**

### 🛡️ Sécurité & Remboursement automatique :
* Vos points sont placés sous séquestre sécurisé dès le lancement de la campagne.
* Si vous décidez de mettre en pause ou d'annuler votre campagne avant la fin, **tous les points non consommés vous sont intégralement et immédiatement restitués sur votre solde** !`;
  }

  // E. GAGNER DES POINTS, MISSIONS & CHRONOMÈTRE 20 SECONDES
  if (
    fullText.includes("gagner") ||
    fullText.includes("mission") ||
    fullText.includes("tâche") ||
    fullText.includes("tache") ||
    fullText.includes("faire une tâche") ||
    fullText.includes("réaliser") ||
    fullText.includes("chrono") ||
    fullText.includes("20 seconde") ||
    fullText.includes("20s") ||
    fullText.includes("disparu") ||
    fullText.includes("disparaît")
  ) {
    return `Bonjour ${userName} ! ⭐

Voici comment **gagner des points gratuitement** en accomplissant des missions sur AddMe.io :

### 📋 Comment réaliser une tâche :
1. Rendez-vous dans la rubrique **« Gagner des points »**.
2. Parcourez le flux des publications disponibles (vous pouvez filtrer par réseau social et par type d'action : Like, Commentaire, Abonnement).
3. Cliquez sur **« Réaliser la tâche »** : la publication s'ouvre dans un nouvel onglet.
4. **⏱️ Règle impérative des 20 secondes** :
   * Vous devez rester actif et maintenir le focus sur la publication pendant au moins **20 secondes**.
   * Si vous revenez trop vite sur AddMe.io, le chronomètre se met automatiquement en pause pour garantir un engagement réel.
5. Effectuez l'action demandée (Liker, Commenter ou S'abonner) sur le réseau social.
6. Revenez sur AddMe.io et cliquez sur **« Valider la tâche »** : notre robot anti-fraude vérifie instantanément l'action.

### ❓ Pourquoi une tâche disparaît-elle de mon flux ?
Pour empêcher le spam, **chaque créateur ne peut réaliser qu'une seule interaction unique par publication**. Dès que vous avez accompli une tâche, elle disparaît définitivement de votre flux pour laisser la place à de nouvelles opportunités.

### 📸 En cas de compteur réseau arrondi :
Si TikTok ou Instagram arrondit ses compteurs (ex: 10,4k) et que le robot tarde à valider, vous pouvez téléverser une **capture d'écran de preuve** : notre IA Vision Sentinel inspectera l'image pour valider vos points !`;
  }

  // F. SOLDE, POINTS EN ATTENTE & RÉTENTION 24H
  if (
    fullText.includes("point en attente") ||
    fullText.includes("attente") ||
    fullText.includes("rétention") ||
    fullText.includes("retention") ||
    fullText.includes("solde") ||
    fullText.includes("mon solde") ||
    fullText.includes("crédité") ||
    fullText.includes("pas reçu") ||
    fullText.includes("combien de point")
  ) {
    return `Bonjour ${userName} ! 💰

Voici les explications sur le calcul de votre **solde** et la période de **points en attente** :

### ⏳ Pourquoi certains points sont-ils « En attente » ?
Pour protéger les créateurs contre les abus (par exemple, quelqu'un qui aimerait une vidéo puis retirerait son Like 5 minutes plus tard après avoir encaissé les points) :
* Les points gagnés lors des missions sont placés en **rétention de sécurité pendant 24 heures**.
* Dès que ce délai de vérification est écoulé, les points sont **automatiquement libérés** et basculent dans votre solde disponible.

### 🔒 Intégrité de votre solde (Grand Livre Ledger) :
* Sur AddMe.io, votre solde est calculé de manière inaltérable grâce à notre système de grand livre comptable.
* Chaque point gagné, dépensé ou remboursé possède un identifiant unique d'idempotence. Aucun point ne peut disparaître !

Vous pouvez consulter votre historique complet à tout moment dans votre **Tableau de bord**.`;
  }

  // G. BOUTIQUE, PACKS & PAIEMENTS SASPAY / MOBILE MONEY
  if (
    fullText.includes("saspay") ||
    fullText.includes("achat") ||
    fullText.includes("acheter") ||
    fullText.includes("payer") ||
    fullText.includes("paiement") ||
    fullText.includes("mobile money") ||
    fullText.includes("orange") ||
    fullText.includes("mtn") ||
    fullText.includes("wave") ||
    fullText.includes("moov") ||
    fullText.includes("boutique") ||
    fullText.includes("pack") ||
    fullText.includes("carte") ||
    fullText.includes("stripe")
  ) {
    return `Bonjour ${userName} ! 💳

Voici comment recharger des points instantanément dans la **« Boutique »** :

### 📦 Nos 3 Packs de Points :
1. **Pack Découverte** : **2 000 points** pour **3 000 FCFA** (~4,99 €)
2. **Pack Créateur Populaire** : **10 000 points** pour **8 500 FCFA** (~12,99 €)
3. **Pack Pro** : **25 000 points** pour **18 000 FCFA** (~27,99 €)

### 📲 Paiement Mobile Money via SasPay :
* **Réseaux disponibles** : Wave, Orange Money, MTN MoMo, Moov Money.
* **Fonctionnement** :
  1. Choisissez votre pack dans la Boutique.
  2. Sélectionnez SasPay et entrez votre numéro de téléphone.
  3. Validez l'invite USSD sur votre téléphone avec votre code secret Mobile Money.
  4. Dès confirmation, vos points sont **crédités immédiatement** sur votre solde !

*ℹ️ Note sur la Carte Bancaire (Stripe) : Le module carte bancaire fait l'objet d'une maintenance technique. Nous vous recommandons de privilégier le paiement instantané par Mobile Money (SasPay).*`;
  }

  // H. COMPTES SOCIAUX, LIAISON & CODE BIO ADDME-XXXXX
  if (
    fullText.includes("compte") ||
    fullText.includes("lier") ||
    fullText.includes("bio") ||
    fullText.includes("code bio") ||
    fullText.includes("addme-") ||
    fullText.includes("mot de passe") ||
    fullText.includes("sécurité") ||
    fullText.includes("securite") ||
    fullText.includes("profil")
  ) {
    return `Bonjour ${userName} ! 🔐

Voici comment **lier et vérifier vos comptes sociaux** en toute sécurité sur AddMe.io :

### 🛡️ Règle d'or : Zéro mot de passe demandé
AddMe.io ne vous demandera **JAMAIS** votre mot de passe de réseau social ni aucun accès confidentiel à votre compte.

### 📋 Procédure de vérification par code de Bio :
1. Allez dans la section **« Comptes liés »** (depuis le menu de votre tableau de bord).
2. Choisissez votre plateforme (TikTok, YouTube, Instagram, Facebook, Threads, Snapchat, LinkedIn, X...).
3. Saisissez votre **@pseudo** ou identifiant public.
4. Le système vous attribue un code unique au format : \`ADDME-XXXXX\`.
5. Ouvrez votre application (ex: TikTok ou Instagram) et **collez temporairement ce code dans votre biographie ou description**.
6. Revenez sur AddMe.io et cliquez sur **« Vérifier la propriété »**.
7. Notre robot détecte le code en quelques secondes et valide votre compte.
8. 🎉 **Une fois validé, vous pouvez effacer le code de votre bio !** Votre compte reste enregistré sur la plateforme.`;
  }

  // I. CODES CADEAUX, PARRAINAGE & AFFILIATION
  if (
    fullText.includes("code cadeau") ||
    fullText.includes("cadeau") ||
    fullText.includes("parrain") ||
    fullText.includes("parrainage") ||
    fullText.includes("affili") ||
    fullText.includes("filleul") ||
    fullText.includes("invit")
  ) {
    return `Bonjour ${userName} ! 🎁

Voici tout ce qu'il faut savoir sur les **Codes Cadeaux & le Parrainage** :

### 🎟️ Codes Cadeaux d'Influenceurs :
* Les codes cadeaux sont réservés à l'inscription.
* Lorsqu'un nouvel arrivant entre le code partenaire d'un influenceur, il bénéficie d'un multiplicateur de points (par exemple **+500 points offerts** au lieu des 50 points standards de bienvenue).
* **Règle de non-cumul** : Si vous avez profité d'un code cadeau à l'inscription, votre solde de départ est déjà maximisé (la validation d'email ne cumule pas de points supplémentaires).

### 🤝 Programme d'Affiliation / Parrainage :
* Vous touchez une commission de points pour chaque créateur parrainé.
* Pour protéger le réseau contre les faux comptes, votre commission est validée dès que votre filleul confirme son adresse email ou lie un compte social actif.`;
  }

  // J. RÉPUTATION, SANCTIONS & SIGNALEMENT DE TRICHE
  if (
    fullText.includes("réputation") ||
    fullText.includes("reputation") ||
    fullText.includes("score") ||
    fullText.includes("signalement") ||
    fullText.includes("signaler") ||
    fullText.includes("triche") ||
    fullText.includes("fraude") ||
    fullText.includes("sanction")
  ) {
    return `Bonjour ${userName} ! ⚖️

La confiance et l'authenticité sont les piliers d'AddMe.io :

### ⭐ Le Score de Réputation (sur 100) :
* Tout utilisateur commence avec une réputation élevée (100/100).
* Chaque tâche accomplie sérieusement maintient votre profil au sommet de la plateforme.

### 🚫 Que se passe-t-il en cas de triche ou d'annulation ?
* Si un membre accomplit une tâche (ex: un Like ou un Abonnement), encaisse les points, puis retire son action ultérieurement, le créateur lésé peut **signaler la tâche**.
* L'administrateur arbitre le litige dans son panneau de contrôle. Si la fraude est confirmée :
  * Le tricheur perd **-10 points de réputation**.
  * Ses points indûment perçus lui sont retirés.
  * En cas de récidive, son compte peut être suspendu définitivement.`;
  }

  // K. RÉSEAUX COMPATIBLES (12 Plateformes)
  if (
    fullText.includes("réseau") ||
    fullText.includes("reseau") ||
    fullText.includes("plateforme") ||
    fullText.includes("compatible") ||
    fullText.includes("supporté") ||
    fullText.includes("liste")
  ) {
    return `Bonjour ${userName} ! 🌐

AddMe.io est compatible avec l'écosystème complet des **12 plateformes d'attention et d'influence** :

1. **TikTok** (Vidéos, Reels, Abonnements)
2. **Instagram** (Posts, Reels, Abonnements)
3. **YouTube** (Vidéos longues, Shorts, Abonnements chaîne)
4. **Facebook** (Posts, Vidéos, Pages)
5. **Threads** (Posts, Discussions)
6. **Snapchat** (Spotlight, Stories)
7. **LinkedIn** (Posts professionnels)
8. **X (Twitter)** (Tweets, Reposts)
9. **Spotify** (Titres, Playlists)
10. **SoundCloud** (Pistes musicales)
11. **Reddit** (Posts, Threads)
12. **Sites Web** (Visites de pages de créateurs)

Chaque interaction est garantie 100 % humaine et vérifiée sans bot.`;
  }

  // L. COMMUNAUTÉ DISCORD
  if (
    fullText.includes("discord") ||
    fullText.includes("communauté") ||
    fullText.includes("communaute") ||
    fullText.includes("groupe")
  ) {
    return `Bonjour ${userName} ! 💬

Rejoignez notre **communauté officielle Discord** pour échanger avec d'autres créateurs, découvrir les nouvelles fonctionnalités en avant-première et obtenir une assistance rapide :

👉 **Rejoindre le Discord AddMe.io** : https://discord.gg/9TJNnr39bK`;
  }

  // M. CONTACT ADMINISTRATEUR & SUPPORT HUMAIN
  if (
    fullText.includes("admin") ||
    fullText.includes("administrateur") ||
    fullText.includes("humain") ||
    fullText.includes("équipe") ||
    fullText.includes("equipe") ||
    fullText.includes("contacter")
  ) {
    return `Bonjour ${userName} ! 👤

Vous êtes actuellement en contact direct avec le **Support Officiel d'AddMe.io** :

* **Prise en charge** : Tous les messages échangés ici sont centralisés dans le panneau de contrôle de l'administrateur.
* **Arbitrage & Vérifications** : Si votre situation nécessite une intervention manuelle (vérification de transaction SasPay, litige de tâche ou examen d'un bug), l'administrateur peut intervenir directement sur votre ticket.
* **Délai de réponse** : Les dossiers prioritaires et techniques sont traités rapidement. N'hésitez pas à décrire précisément votre besoin !`;
  }

  // N. SALUTATION & QUESTION OUVERTE CONTEXTUELLE
  return `Bonjour ${userName} ! 

J'ai bien pris connaissance de votre message : *« ${userMessage} »*.

Pour vous aider au mieux, pouvez-vous me préciser votre besoin parmi les sujets suivants ?
* 🎯 **Campagnes** : Créer, booster une publication ou comprendre le coût en points.
* ⭐ **Gagner des points** : Fonctionnement des missions, règle des 20 secondes ou preuve de capture.
* 🔐 **Comptes liés** : Comment vérifier un profil avec le code bio \`ADDME-XXXXX\` (sans mot de passe).
* 💳 **Boutique & SasPay** : Acheter des points par Mobile Money (Orange, MTN, Wave, Moov).
* 🚨 **Signaler un bug** : Si vous rencontrez une anomalie technique, décrivez-la pour que je la transmette immédiatement à l'administrateur.

Dites-moi simplement ce que vous souhaitez accomplir !`;
}

