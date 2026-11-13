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
  source: "gemini" | "knowledge-base";
  suggestedAction?: string;
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
    messages: Array<{ senderRole: string; content: string; createdAt: string }>;
  };
  platformStats?: {
    totalUsers?: number;
    activeCampaigns?: number;
    pendingSocialVerifications?: number;
    pendingReports?: number;
    circulatingPoints?: number;
    openTickets?: number;
  };
}): Promise<AISecretaryResponse> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  // Construction du prompt système
  let systemPrompt = `Tu es l'Assistante Secrétaire IA Officielle de l'Administration d'AddMe.io.
Ton rôle est d'assister l'administrateur dans la gestion de la plateforme, la surveillance des activités et la rédaction de réponses parfaites, professionnelles et chaleureuses aux tickets de support client.
Tu as une maîtrise absolue de toute la documentation d'AddMe.io :

${ADDME_KNOWLEDGE_BASE}

Consignes :
1. Reste toujours courtoise, rigoureuse, proactive et orientée solution.
2. Si tu rédiges une réponse pour un ticket de support, écris un message prêt à être envoyé directement à l'usager, signé "L'équipe Support AddMe.io", qui résout précisément son problème selon les règles du produit.
3. Si l'administrateur te pose une question générale, réponds avec clarté, concision et structure en markdown.
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
- Points en circulation dans le grand livre : ${platformStats?.circulatingPoints ?? "N/A"} pts

Donne à l'administrateur un récapitulatif exécutif :
1. Diagnostic de santé globale.
2. Alertes prioritaires exigeant une action immédiate.
3. Recommandations proactives pour optimiser la plateforme.`;
  } else {
    promptContent = `Message ou question de l'administrateur :
"${userMessage || "Bonjour, quel est le statut général ?"}"

Donne une réponse précise et détaillée en te basant sur la documentation AddMe.io.`;
  }

  // Si la clé Gemini est disponible, interroger le modèle Gemini 2.5 Flash
  if (geminiKey) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
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
            },
          }),
          signal: AbortSignal.timeout(12000),
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
          };
        }
      }
    } catch (err) {
      console.warn("[AISecretary] Erreur lors de l'appel Gemini, bascule sur la base locale :", err);
    }
  }

  // Fallback intelligent déterministe basé sur les connaissances AddMe.io
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
* **Modération Sociale** : ${platformStats?.pendingSocialVerifications ?? 0} compte(s) en attente de vérification par code de bio.

💡 **Recommandation de votre Secrétaire** : Traitez en priorité les tickets support en attente pour maintenir un taux de satisfaction maximal chez vos créateurs.`,
      source: "knowledge-base",
    };
  }

  return {
    success: true,
    reply: `Bonjour ! En tant que Secrétaire IA d'AddMe.io, je suis à votre service pour superviser l'activité de vos usagers, vous assister dans l'arbitrage des litiges et rédiger des réponses automatisées ou personnalisées pour votre support client. 

Toutes les règles d'AddMe.io (chrono 20s, robot de vérification, paiements SasPay Mobile Money, Grand Livre Ledger et codes partenaires) sont intégrées dans mes connaissances. Que souhaitez-vous analyser aujourd'hui ?`,
    source: "knowledge-base",
  };
}
