import fs from "fs";
import path from "path";
import crypto from "crypto";

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
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_FILE = path.join(process.cwd(), "prisma", "support_tickets.json");

// Cache mémoire synchrone
let ticketsCache: SupportTicket[] | null = null;

function loadTickets(): SupportTicket[] {
  if (ticketsCache) return ticketsCache;

  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
      ticketsCache = JSON.parse(raw);
      return ticketsCache || [];
    }
  } catch (err) {
    console.error("[SupportStorage] Erreur lecture fichier support :", err);
  }

  ticketsCache = [];
  return ticketsCache;
}

function saveTickets(tickets: SupportTicket[]) {
  ticketsCache = tickets;
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(tickets, null, 2), "utf-8");
  } catch (err) {
    console.error("[SupportStorage] Erreur écriture fichier support :", err);
  }
}

/**
 * Créer un nouveau ticket / message de support
 */
export async function createSupportTicket(params: {
  userId: string;
  userEmail: string;
  userName?: string;
  subject: string;
  category?: SupportTicket["category"];
  message: string;
}): Promise<SupportTicket> {
  const tickets = loadTickets();
  const now = new Date().toISOString();
  const ticketId = `ticket_${crypto.randomBytes(6).toString("hex")}`;
  const messageId = `msg_${crypto.randomBytes(6).toString("hex")}`;

  const displayName = params.userName || params.userEmail.split("@")[0] || "Utilisateur";

  const newTicket: SupportTicket = {
    id: ticketId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: displayName,
    subject: params.subject.trim(),
    category: params.category || "GENERAL",
    status: "OPEN",
    priority: "NORMAL",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: messageId,
        senderRole: "USER",
        senderId: params.userId,
        senderName: displayName,
        senderEmail: params.userEmail,
        content: params.message.trim(),
        createdAt: now,
      },
    ],
  };

  tickets.unshift(newTicket);
  saveTickets(tickets);
  return newTicket;
}

/**
 * Récupère les tickets d'un utilisateur spécifique
 */
export async function getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
  const tickets = loadTickets();
  return tickets
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Récupère tous les tickets pour l'administration avec filtres optionnels
 */
export async function getAllSupportTickets(options?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<SupportTicket[]> {
  let tickets = loadTickets();

  if (options?.status && options.status !== "ALL") {
    tickets = tickets.filter((t) => t.status === options.status);
  }

  if (options?.category && options.category !== "ALL") {
    tickets = tickets.filter((t) => t.category === options.category);
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    tickets = tickets.filter(
      (t) =>
        t.userName.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }

  return tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Récupère un ticket par son ID
 */
export async function getSupportTicketById(ticketId: string): Promise<SupportTicket | null> {
  const tickets = loadTickets();
  const found = tickets.find((t) => t.id === ticketId);
  return found || null;
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
  const tickets = loadTickets();
  const ticketIndex = tickets.findIndex((t) => t.id === params.ticketId);

  if (ticketIndex === -1) {
    throw new Error("Ticket introuvable.");
  }

  const now = new Date().toISOString();
  const messageId = `msg_${crypto.randomBytes(6).toString("hex")}`;

  const message: SupportMessage = {
    id: messageId,
    senderRole: params.senderRole,
    senderId: params.senderId,
    senderName: params.senderName,
    senderEmail: params.senderEmail,
    content: params.content.trim(),
    createdAt: now,
  };

  const current = tickets[ticketIndex];
  const nextStatus =
    params.newStatus ||
    (params.senderRole === "ADMIN" ? "ANSWERED" : "OPEN");

  const updated: SupportTicket = {
    ...current,
    status: nextStatus,
    updatedAt: now,
    messages: [...current.messages, message],
  };

  tickets[ticketIndex] = updated;
  saveTickets(tickets);
  return updated;
}

/**
 * Met à jour le statut d'un ticket (ADMIN)
 */
export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicket["status"]
): Promise<SupportTicket> {
  const tickets = loadTickets();
  const ticketIndex = tickets.findIndex((t) => t.id === ticketId);

  if (ticketIndex === -1) {
    throw new Error("Ticket introuvable.");
  }

  const now = new Date().toISOString();
  const updated: SupportTicket = {
    ...tickets[ticketIndex],
    status,
    updatedAt: now,
  };

  tickets[ticketIndex] = updated;
  saveTickets(tickets);
  return updated;
}

/**
 * Statistiques du support pour le dashboard admin
 */
export async function getSupportStats(): Promise<{
  totalTickets: number;
  pendingTickets: number;
  answeredTickets: number;
  resolvedTickets: number;
}> {
  const tickets = loadTickets();
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter((t) => t.status === "OPEN").length;
  const answeredTickets = tickets.filter((t) => t.status === "ANSWERED").length;
  const resolvedTickets = tickets.filter((t) => t.status === "RESOLVED").length;

  return {
    totalTickets,
    pendingTickets,
    answeredTickets,
    resolvedTickets,
  };
}
