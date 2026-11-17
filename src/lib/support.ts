import crypto from "crypto";
import prisma from "./prisma.ts";

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
    return `🤖 Bonjour ${displayName},

J'ai bien pris note de votre signalement technique concernant « ${subject.trim()} ».

Afin que l'équipe technique puisse identifier précisément l'origine du problème et le résoudre rapidement, pourriez-vous m'apporter quelques précisions en répondant simplement à ce message :

1. 📱 **Fonctionnalité concernée** : S'agit-il du lancement d'une campagne, de la réalisation d'une tâche P2P, de la liaison d'un compte réseau social (TikTok, Instagram, YouTube), d'un achat de points SasPay ou d'un code cadeau ?
2. 🔗 **Identifiant ou lien** : Avez-vous le lien de la publication ou l'ID de la tâche/campagne concernée ?
3. ⚠️ **Comportement constaté** : Que se passe-t-il exactement ? (Ex : chrono 20s bloqué, bouton grisé ou inactif, solde non mis à jour, message d'erreur affiché...)
4. 💻 **Appareil & navigateur** : Utilisez-vous un smartphone, une tablette ou un ordinateur (avec Chrome, Safari, etc.) ?

Dès réception de vos détails (ou d'une capture d'écran), votre dossier sera transmis avec tous ces éléments pour investigation. Merci de votre retour !`;
  }

  return `🤖 Bonjour ${displayName},

Merci d'avoir pris le temps de nous transmettre ces informations détaillées concernant « ${subject.trim()} ».

Votre signalement technique a été enregistré avec tous ces éléments de contexte et classé en priorité d'assistance pour l'administrateur et l'équipe technique d'AddMe.io.

Vous recevrez une notification ainsi qu'une réponse directement ici dès que la vérification aura été effectuée. Merci de votre confiance !`;
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

  if (isBug) {
    const aiMessageId = `msg_ai_${crypto.randomBytes(6).toString("hex")}`;
    const aiContent = generateAISupportDiagnosis({
      displayName,
      subject: params.subject,
      message: params.message,
    });

    messagesToCreate.push({
      id: aiMessageId,
      senderRole: "ADMIN",
      senderId: "system_ai_secretary",
      senderName: "Secrétaire IA AddMe.io",
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
      status: isBug ? "ANSWERED" : "OPEN",
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
