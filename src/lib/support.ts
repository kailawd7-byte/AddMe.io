import crypto from "crypto";
import prisma from "./prisma.ts";
import { askUserSupportAI } from "./ai-secretary.ts";

export interface SupportMessage {
  id: string;
  senderRole: "USER" | "ADMIN";
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: "GENERAL" | "POINTS" | "CAMPAIGN" | "TASK" | "ACCOUNT" | "BUG";
  status: "OPEN" | "ANSWERED" | "RESOLVED";
  priority: "LOW" | "NORMAL" | "HIGH";
  isTechnicalBug?: boolean;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Génère une réponse d'assistance et de diagnostic intelligente de la Secrétaire IA.
 * Si le signalement est vague ou court, l'IA pose des questions de cadrage pour centraliser le bug.
 */
function generateAISupportDiagnosis({
  displayName,
  subject,
  message,
}: {
  displayName: string;
  subject: string;
  message: string;
}): string {
  const text = `${subject} ${message}`.toLowerCase();

  // Analyse si le message manque de précisions techniques
  const isVague =
    message.trim().length < 80 ||
    (!text.includes("tiktok") &&
      !text.includes("instagram") &&
      !text.includes("youtube") &&
      !text.includes("saspay") &&
      !text.includes("mobile money") &&
      !text.includes("point") &&
      !text.includes("code") &&
      !text.includes("chrono") &&
      !text.includes("tâche") &&
      !text.includes("campagne"));

  if (isVague) {
    return `🚨 Bonjour ${displayName},

J'ai bien analysé votre signalement technique concernant : « ${subject.trim()} ».

### 🛠️ Prise en charge & Transmission à l'Administrateur :
1. **Signalement enregistré** : Votre ticket a été automatiquement classé en **Incident Technique Prioritaire (BUG)**.
2. **Notification dans le Panel Administrateur** : L'administrateur d'AddMe.io a été immédiatement notifié dans sa console de supervision.
3. **Investigation & Test par l'Administrateur** : L'administrateur va personnellement tester et tenter de reproduire la situation pour vérifier si l'anomalie est fondée techniquement ou s'il s'agit d'une mauvaise manipulation, et apporter le correctif approprié.

### 📋 Pour nous aider à tester et reproduire au plus vite :
Pourriez-vous apporter ces quelques précisions en répondant simplement à ce message :
* 📱 **Fonctionnalité concernée** : S'agit-il du menu Campagnes, d'une tâche (Like/Abonnement), de la liaison d'un compte social (TikTok, Instagram...), ou d'un paiement SasPay ?
* 🔗 **Identifiant ou lien direct** de la publication concernée (si applicable).
* ⚠️ **Comportement exact constaté** (ex : chronomètre 20s bloqué, bouton inactif, message d'erreur précis affiché...).
* 💻 **Votre appareil & navigateur** (ex : smartphone Chrome/Safari, ou PC).

L'administrateur ou l'équipe technique reviendra vers vous directement ici dès que les vérifications auront été effectuées. Merci pour votre patience !`;
  }

  return `🚨 Bonjour ${displayName},

Merci d'avoir transmis ces informations détaillées concernant : « ${subject.trim()} ».

### 🛠️ Prise en charge & Transmission à l'Administrateur :
1. **Signalement technique enregistré** : Votre ticket a été classé en **Incident Technique (BUG)** avec tous vos éléments de contexte.
2. **Notification dans le Panel Administrateur** : L'incident est désormais visible en priorité haute dans la console d'administration d'AddMe.io.
3. **Investigation & Test par l'Administrateur** : L'administrateur va personnellement tester et reproduire le problème sur la plateforme pour isoler l'origine de l'anomalie et appliquer le correctif nécessaire.

Vous recevrez une réponse directement sur ce fil de discussion dès que les vérifications et tests auront été réalisés. Merci de votre confiance !`;
}

/**
 * Transforme un enregistrement Prisma en SupportTicket sérialisable
 */
function formatPrismaTicket(ticket: any): SupportTicket {
  return {
    id: ticket.id,
    userId: ticket.userId,
    userEmail: ticket.userEmail,
    userName: ticket.userName,
    subject: ticket.subject,
    category: ticket.category as SupportTicket["category"],
    status: ticket.status as SupportTicket["status"],
    priority: ticket.priority as SupportTicket["priority"],
    isTechnicalBug: Boolean(ticket.isTechnicalBug),
    createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : String(ticket.createdAt),
    updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : String(ticket.updatedAt),
    messages: (ticket.messages || []).map((m: any) => ({
      id: m.id,
      senderRole: m.senderRole as "USER" | "ADMIN",
      senderId: m.senderId,
      senderName: m.senderName,
      senderEmail: m.senderEmail,
      content: m.content,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
    })),
  };
}

/**
 * Créer un nouveau ticket / message de support (Enregistré dans PostgreSQL)
 */
export async function createSupportTicket(params: {
  userId: string;
  userEmail: string;
  userName?: string;
  subject: string;
  category?: SupportTicket["category"];
  message: string;
}): Promise<SupportTicket> {
  const ticketId = `ticket_${crypto.randomBytes(6).toString("hex")}`;
  const messageId = `msg_${crypto.randomBytes(6).toString("hex")}`;
  const displayName = params.userName || params.userEmail.split("@")[0] || "Utilisateur";

  const bugKeywords = [
    "bug",
    "erreur",
    "bloqué",
    "bloque",
    "bloquer",
    "plante",
    "planté",
    "crash",
    "panne",
    "ne marche pas",
    "ne fonctionne pas",
    "problème technique",
    "impossible de",
    "page blanche",
    "exception",
    "fail",
  ];
  const combinedText = `${params.subject} ${params.message}`.toLowerCase();
  const isBug =
    params.category === "BUG" ||
    bugKeywords.some((kw) => combinedText.includes(kw));

  const messagesToCreate = [
    {
      id: messageId,
      senderRole: "USER",
      senderId: params.userId,
      senderName: displayName,
      senderEmail: params.userEmail,
      content: params.message.trim(),
    },
  ];

  let aiContent = "";
  if (isBug) {
    aiContent = generateAISupportDiagnosis({
      displayName,
      subject: params.subject,
      message: params.message,
    });
  } else {
    try {
      aiContent = await askUserSupportAI({
        userMessage: params.message,
        userName: displayName,
        subject: params.subject,
      });
    } catch {
      aiContent = `Bonjour ${displayName} ! J'ai bien reçu votre message concernant « ${params.subject.trim()} ». Comment puis-je vous aider plus précisément sur AddMe.io ?`;
    }
  }

  if (aiContent) {
    const aiMessageId = `msg_ai_${crypto.randomBytes(6).toString("hex")}`;
    messagesToCreate.push({
      id: aiMessageId,
      senderRole: "ADMIN",
      senderId: "system_ai_secretary",
      senderName: "Assistant IA AddMe.io",
      senderEmail: "support@addme.io",
      content: aiContent,
    });
  }

  const created = await prisma.supportTicket.create({
    data: {
      id: ticketId,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: displayName,
      subject: params.subject.trim(),
      category: isBug ? "BUG" : params.category || "GENERAL",
      status: "ANSWERED",
      priority: isBug ? "HIGH" : "NORMAL",
      isTechnicalBug: isBug,
      messages: {
        create: messagesToCreate,
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return formatPrismaTicket(created);
}

/**
 * Récupère les tickets d'un utilisateur spécifique (depuis PostgreSQL)
 */
export async function getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return tickets.map(formatPrismaTicket);
}

/**
 * Récupère tous les tickets pour l'administration avec filtres optionnels
 */
export async function getAllSupportTickets(options?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<SupportTicket[]> {
  const where: any = {};

  if (options?.status && options.status !== "ALL") {
    where.status = options.status;
  }

  if (options?.category && options.category !== "ALL") {
    where.category = options.category;
  }

  if (options?.search) {
    const q = options.search.trim();
    where.OR = [
      { userName: { contains: q, mode: "insensitive" } },
      { userEmail: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { id: { contains: q, mode: "insensitive" } },
    ];
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return tickets.map(formatPrismaTicket);
}

/**
 * Récupère un ticket par son ID
 */
export async function getSupportTicketById(ticketId: string): Promise<SupportTicket | null> {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return ticket ? formatPrismaTicket(ticket) : null;
}

/**
 * Répondre à un ticket (par l'administrateur ou par l'utilisateur)
 */
export async function replyToSupportTicket(params: {
  ticketId: string;
  senderRole: "USER" | "ADMIN";
  senderId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  newStatus?: SupportTicket["status"];
}): Promise<SupportTicket> {
  const messageId = `msg_${crypto.randomBytes(6).toString("hex")}`;
  const nextStatus =
    params.newStatus ||
    (params.senderRole === "ADMIN" ? "ANSWERED" : "OPEN");

  // Ajouter le message
  await prisma.supportMessage.create({
    data: {
      id: messageId,
      ticketId: params.ticketId,
      senderRole: params.senderRole,
      senderId: params.senderId,
      senderName: params.senderName,
      senderEmail: params.senderEmail,
      content: params.content.trim(),
    },
  });

  // Mettre à jour le statut et la date du ticket
  const updated = await prisma.supportTicket.update({
    where: { id: params.ticketId },
    data: {
      status: nextStatus,
      updatedAt: new Date(),
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return formatPrismaTicket(updated);
}

/**
 * Met à jour le statut d'un ticket (ADMIN)
 */
export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicket["status"]
): Promise<SupportTicket> {
  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      updatedAt: new Date(),
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return formatPrismaTicket(updated);
}

/**
 * Statistiques du support pour le dashboard admin
 */
export async function getSupportStats(): Promise<{
  totalTickets: number;
  pendingTickets: number;
  answeredTickets: number;
  resolvedTickets: number;
  openBugsCount: number;
}> {
  const [totalTickets, pendingTickets, answeredTickets, resolvedTickets, openBugsCount] =
    await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.supportTicket.count({ where: { status: "ANSWERED" } }),
      prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
      prisma.supportTicket.count({
        where: {
          OR: [{ isTechnicalBug: true }, { category: "BUG" }],
          NOT: { status: "RESOLVED" },
        },
      }),
    ]);

  return {
    totalTickets,
    pendingTickets,
    answeredTickets,
    resolvedTickets,
    openBugsCount,
  };
}

/**
 * Récupère les tickets de bugs techniques en attente d'investigation ou de test
 */
export async function getOpenBugTickets(): Promise<SupportTicket[]> {
  const tickets = await prisma.supportTicket.findMany({
    where: {
      OR: [{ isTechnicalBug: true }, { category: "BUG" }],
      NOT: { status: "RESOLVED" },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return tickets.map(formatPrismaTicket);
}
