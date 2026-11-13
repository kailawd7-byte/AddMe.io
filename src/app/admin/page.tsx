"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  Coins,
  Settings,
  Share2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Video,
  ArrowRight,
  ExternalLink,
  Camera,
  Scale,
  Sliders,
  History,
  MessageSquare,
  Send,
  MessageCircle,
  Inbox,
  Reply,
  Headphones,
  Gift,
  Copy,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Link2,
  Sparkles,
  Bot,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeCampaigns: number;
  pendingSocialVerifications: number;
  pendingReports: number;
  circulatingPoints: number;
}

interface AdminUserItem {
  id: string;
  email: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  isEmailVerified: boolean;
  reputationScore: number;
  dailyTasksCompleted: number;
  balance: number;
  createdAt: string;
}

interface PendingAccountItem {
  id: string;
  userId: string;
  platform: string;
  identifier: string;
  verificationCode: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    reputationScore: number;
  };
}

interface ReportItem {
  id: string;
  campaignId: string;
  taskCompletionId: string;
  reason: string;
  status: "PENDING" | "UPHELD" | "DISMISSED";
  createdAt: string;
  campaign: {
    id: string;
    platform: string;
    actionType: string;
    videoUrl: string;
  };
  taskCompletion: {
    id: string;
    status: string;
    rewardPoints: number;
    screenshotUrl?: string | null;
  };
  reporterUser: {
    id: string;
    email: string;
  };
  reportedUser: {
    id: string;
    email: string;
    reputationScore: number;
  };
}

function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"USERS" | "SOCIAL" | "REPORTS" | "SETTINGS" | "AUDIT" | "SUPPORT" | "GIFT_CODES" | "AI_ASSISTANT">("USERS");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Onglet Secrétaire IA & Co-Pilote
  const [aiChatMessages, setAiChatMessages] = useState<
    Array<{ sender: "admin" | "ai"; text: string; time: string }>
  >([
    {
      sender: "ai",
      text: "Bonjour ! Je suis votre Secrétaire IA AddMe.io. Je surveille l'activité de vos créateurs, les signalements, les tickets support et l'intégrité comptable du grand livre Ledger. Comment puis-je vous assister aujourd'hui ?",
      time: "Maintenant",
    },
  ]);
  const [aiInputMessage, setAiInputMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiAuditReport, setAiAuditReport] = useState<string | null>(null);
  const [aiAuditLoading, setAiAuditLoading] = useState(false);

  // Onglet Codes Cadeaux & Influenceurs
  const [giftCodes, setGiftCodes] = useState<any[]>([]);
  const [giftCodesLoading, setGiftCodesLoading] = useState(false);
  const [giftCodesSearch, setGiftCodesSearch] = useState("");
  const [isCreateGiftModalOpen, setIsCreateGiftModalOpen] = useState(false);
  const [newGiftCode, setNewGiftCode] = useState("");
  const [newInfluencerEmail, setNewInfluencerEmail] = useState("");
  const [newGiftDescription, setNewGiftDescription] = useState("");
  const [newMultiplier, setNewMultiplier] = useState<number>(4.0);
  const [newInfluencerBonus, setNewInfluencerBonus] = useState<number>(100.0);
  const [newMaxUses, setNewMaxUses] = useState<string>("");
  const [newExpiresAt, setNewExpiresAt] = useState<string>("");
  const [createGiftSubmitting, setCreateGiftSubmitting] = useState(false);
  const [copiedCodeOnlyId, setCopiedCodeOnlyId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Onglet Support Client (Répertoire & Messagerie)
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportStats, setSupportStats] = useState<{ totalTickets: number; pendingTickets: number } | null>(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportFilter, setSupportFilter] = useState<string>("ALL");
  const [supportCategoryFilter, setSupportCategoryFilter] = useState<string>("ALL");
  const [supportSearch, setSupportSearch] = useState<string>("");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<string>("");
  const [adminReplySubmitting, setAdminReplySubmitting] = useState<boolean>(false);

  // Onglet Utilisateurs
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [adjustingUser, setAdjustingUser] = useState<AdminUserItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>("10");
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Onglet Comptes Sociaux
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccountItem[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);

  // Onglet Signalements
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Onglet Paramètres Système
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Onglet Audit
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 403 || res.status === 401) {
        setUnauthorized(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userSearch) params.append("search", userSearch);
      if (userStatusFilter) params.append("status", userStatusFilter);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSocialAccounts = async () => {
    setSocialLoading(true);
    try {
      const res = await fetch("/api/admin/social-accounts");
      if (res.ok) {
        const data = await res.json();
        setPendingAccounts(data.accounts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSocialLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await fetch("/api/admin/reports?status=PENDING");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs?limit=40");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSupportTickets = async () => {
    setSupportLoading(true);
    try {
      const q = new URLSearchParams();
      if (supportFilter !== "ALL") q.set("status", supportFilter);
      if (supportCategoryFilter !== "ALL") q.set("category", supportCategoryFilter);
      if (supportSearch.trim()) q.set("search", supportSearch.trim());

      const res = await fetch(`/api/admin/support?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSupportTickets(data.tickets || []);
        setSupportStats(data.stats || null);
        if (selectedTicket) {
          const updated = (data.tickets || []).find((t: any) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleAdminReply = async (ticketId: string) => {
    if (!adminReplyText.trim()) {
      alert("Veuillez saisir votre message de réponse.");
      return;
    }

    setAdminReplySubmitting(true);
    try {
      const res = await fetch(`/api/admin/support/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: adminReplyText.trim(),
          newStatus: "ANSWERED",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur lors de l'envoi de la réponse.");
      } else {
        setFeedback({ type: "success", text: "Réponse envoyée avec succès à l'usager !" });
        setAdminReplyText("");
        await fetchSupportTickets();
      }
    } catch {
      alert("Erreur réseau.");
    } finally {
      setAdminReplySubmitting(false);
    }
  };

  const handleMarkResolved = async (ticketId: string) => {
    setAdminReplySubmitting(true);
    try {
      // Si l'administrateur a saisi une note spécifique, on l'envoie, sinon un message standardisé de résolution
      const contentToSend =
        adminReplyText.trim() ||
        "✓ Votre demande a été traitée et résolue par notre équipe support. N'hésitez pas à nous recontacter si vous avez d'autres questions !";

      const res = await fetch(`/api/admin/support/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: contentToSend,
          newStatus: "RESOLVED",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur lors de la clôture du ticket.");
      } else {
        setFeedback({
          type: "success",
          text: "Demande marquée comme résolue et notification transmise à l'usager !",
        });
        setAdminReplyText("");
        await fetchSupportTickets();
      }
    } catch {
      alert("Erreur réseau.");
    } finally {
      setAdminReplySubmitting(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: "OPEN" | "ANSWERED" | "RESOLVED") => {
    try {
      const res = await fetch(`/api/admin/support/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchSupportTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendToAI = async (messageToSend?: string) => {
    const text = (messageToSend || aiInputMessage).trim();
    if (!text) return;

    const userMsg = {
      sender: "admin" as const,
      text,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setAiChatMessages((prev) => [...prev, userMsg]);
    if (!messageToSend) setAiInputMessage("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/admin/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          userMessage: text,
          platformStats: {
            totalUsers: stats?.totalUsers,
            activeCampaigns: stats?.activeCampaigns,
            pendingSocialVerifications: stats?.pendingSocialVerifications,
            pendingReports: stats?.pendingReports,
            circulatingPoints: stats?.circulatingPoints,
            openTickets: supportStats?.pendingTickets,
          },
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setAiChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.reply,
            time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      setAiChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Désolée, une erreur de communication est survenue avec le service d'intelligence artificielle.",
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateAIDraft = async () => {
    if (!selectedTicket) return;
    setAiDraftLoading(true);
    try {
      const res = await fetch("/api/admin/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "support_draft",
          ticketContext: selectedTicket,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setAdminReplyText(data.reply);
        setFeedback({
          type: "success",
          text: "✨ Proposition de réponse rédigée avec succès par votre Secrétaire IA !",
        });
      }
    } catch {
      alert("Erreur lors de la génération de la réponse par l'IA.");
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleRunAIAudit = async () => {
    setAiAuditLoading(true);
    try {
      const res = await fetch("/api/admin/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "audit",
          platformStats: {
            totalUsers: stats?.totalUsers,
            activeCampaigns: stats?.activeCampaigns,
            pendingSocialVerifications: stats?.pendingSocialVerifications,
            pendingReports: stats?.pendingReports,
            circulatingPoints: stats?.circulatingPoints,
            openTickets: supportStats?.pendingTickets,
          },
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setAiAuditReport(data.reply);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiAuditLoading(false);
    }
  };

  const fetchGiftCodes = async () => {
    setGiftCodesLoading(true);
    try {
      const res = await fetch("/api/admin/gift-codes");
      if (res.ok) {
        const data = await res.json();
        setGiftCodes(data.codes || []);
      }
    } catch (err) {
      console.error("Erreur fetchGiftCodes:", err);
    } finally {
      setGiftCodesLoading(false);
    }
  };

  const handleCreateGiftCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGiftCode.trim() || !newInfluencerEmail.trim()) {
      setFeedback({
        type: "error",
        text: "Le code cadeau et l'adresse email de l'influenceur affilié sont obligatoires.",
      });
      return;
    }

    setCreateGiftSubmitting(true);
    try {
      const res = await fetch("/api/admin/gift-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newGiftCode,
          influencerEmail: newInfluencerEmail,
          description: newGiftDescription,
          multiplier: newMultiplier,
          influencerBonus: newInfluencerBonus,
          maxUses: newMaxUses ? Number(newMaxUses) : null,
          expiresAt: newExpiresAt ? newExpiresAt : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Impossible de créer le code cadeau.",
        });
      } else {
        setFeedback({
          type: "success",
          text: data.message || `Code « ${newGiftCode} » créé avec succès !`,
        });
        setIsCreateGiftModalOpen(false);
        setNewGiftCode("");
        setNewInfluencerEmail("");
        setNewGiftDescription("");
        setNewMaxUses("");
        setNewExpiresAt("");
        await fetchGiftCodes();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Erreur réseau lors de la création du code cadeau.",
      });
    } finally {
      setCreateGiftSubmitting(false);
    }
  };

  const handleToggleGiftCode = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/gift-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setFeedback({
          type: "success",
          text: `Code ${!currentActive ? "activé" : "désactivé"} avec succès.`,
        });
        await fetchGiftCodes();
      } else {
        const d = await res.json();
        setFeedback({ type: "error", text: d.error || "Erreur mise à jour statut." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur réseau lors de la mise à jour." });
    }
  };

  const handleDeleteGiftCode = async (id: string, codeName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le code « ${codeName} » ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/gift-codes/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeedback({
          type: "success",
          text: `Code « ${codeName} » supprimé avec succès.`,
        });
        await fetchGiftCodes();
      } else {
        const d = await res.json();
        setFeedback({ type: "error", text: d.error || "Erreur suppression code." });
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur réseau lors de la suppression." });
    }
  };

  const handleCopyCodeOnly = (code: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCodeOnlyId(id);
    setTimeout(() => setCopiedCodeOnlyId(null), 2500);
  };

  const handleCopyReferralLink = (code: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://addme.io";
    const link = `${origin}/register?ref=${code}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  useEffect(() => {
    setMounted(true);
    const init = async () => {
      setLoading(true);
      await fetchStats();
      await fetchUsers();
      await fetchSupportTickets();
      await fetchGiftCodes();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === "SOCIAL") fetchSocialAccounts();
    if (activeTab === "REPORTS") fetchReports();
    if (activeTab === "SETTINGS") fetchSettings();
    if (activeTab === "AUDIT") fetchAuditLogs();
    if (activeTab === "SUPPORT") fetchSupportTickets();
    if (activeTab === "GIFT_CODES") fetchGiftCodes();
  }, [activeTab]);

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    const reason = prompt(`Indiquez le motif de ce changement de statut vers ${newStatus} :`);
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur modification statut.");
      } else {
        setFeedback({ type: "success", text: data.message });
        fetchUsers();
        fetchStats();
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handleAdjustPointsSubmit = async () => {
    if (!adjustingUser) return;
    const amountNum = parseFloat(adjustAmount);
    if (isNaN(amountNum) || amountNum === 0) {
      alert("Veuillez indiquer un montant numérique valide non nul.");
      return;
    }
    if (!adjustReason || adjustReason.trim().length < 5) {
      alert("Veuillez indiquer un motif précis d'au moins 5 caractères.");
      return;
    }

    setAdjustSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${adjustingUser.id}/adjust-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum, reason: adjustReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur ajustement points.");
      } else {
        setFeedback({ type: "success", text: data.message });
        setAdjustingUser(null);
        setAdjustReason("");
        fetchUsers();
        fetchStats();
      }
    } catch {
      alert("Erreur réseau.");
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleModerateSocial = async (accountId: string, decision: "VERIFY" | "REJECT") => {
    try {
      const res = await fetch(`/api/admin/social-accounts/${accountId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur modération.");
      } else {
        setFeedback({ type: "success", text: data.message });
        fetchSocialAccounts();
        fetchStats();
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handleResolveReport = async (reportId: string, resolution: "UPHELD" | "DISMISSED") => {
    const adminNotes = prompt(
      resolution === "UPHELD"
        ? "Confirmer la fraude : motif de la sanction (le travailleur perdra 10 pts de réputation) :"
        : "Rejeter le signalement : motif de la décision (les points seront remis au travailleur) :"
    );
    if (adminNotes === null) return;

    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur arbitrage.");
      } else {
        setFeedback({ type: "success", text: data.message });
        fetchReports();
        fetchStats();
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur sauvegarde paramètre.");
      } else {
        setFeedback({ type: "success", text: data.message });
      }
    } catch {
      alert("Erreur réseau.");
    } finally {
      setSettingsSaving(false);
    }
  };

  if (!mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mb-4" />
        <span className="text-sm text-slate-400">Chargement de la console d&apos;administration...</span>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold">Accès Réservé aux Administrateurs</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md">
          Cette zone est strictement protégée. Veuillez vous connecter avec le compte administrateur certifié
          (<code>admin@addme.io</code>).
        </p>
        <Link
          href="/login"
          className="mt-6 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête Administration */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Zone Contrôle & Arbitrage
              </span>
              <span className="text-xs text-slate-400">Rôle : SUPER_ADMIN</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-white">
              Console d&apos;Administration AddMe.io
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Supervision des utilisateurs, arbitrage des litiges, modération des comptes sociaux et tarification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Retour Dashboard Utilisateur
            </Link>
          </div>
        </div>

        {/* Message d'Alerte Global */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 transition ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            <p className="text-sm font-medium">{feedback.text}</p>
          </div>
        )}

        {/* Statistiques Système Clés */}
        {stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Membres Réels</span>
                <span className="text-2xl font-black text-white mt-1 block">{stats.totalUsers}</span>
                <span className="text-[11px] text-emerald-400 mt-1 block">✓ Base nettoyée</span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Campagnes Actives</span>
                <span className="text-2xl font-black text-indigo-400 mt-1 block">{stats.activeCampaigns}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">En cours de diffusion</span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Comptes à Vérifier</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">{stats.pendingSocialVerifications}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Profils en attente</span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Signalements / Litiges</span>
                <span className="text-2xl font-black text-rose-400 mt-1 block">{stats.pendingReports}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">À arbitrer</span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block uppercase">Points en Circulation</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats.circulatingPoints} pts</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Grand livre Ledger</span>
              </div>
            </div>

            {/* Guide Pédagogique des Outils Admin */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-indigo-950/40 border border-indigo-900/40 space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-sm">
                <FileText className="w-4 h-4 text-[#FFB84D]" />
                <span>Guide rapide des 6 outils de contrôle de votre Dashboard Admin</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <b className="text-white block mb-1">1. Utilisateurs</b>
                  Visualisez vos membres inscrits, leur réputation et solde. Suspendez ou ajustez manuellement les points.
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <b className="text-white block mb-1">2. Comptes Sociaux</b>
                  Vérifiez ou rejetez les profils sociaux soumis par les membres après contrôle de leur bio.
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <b className="text-white block mb-1">3. Signalements</b>
                  Arbitrez les litiges ouverts par les créateurs en cas d&apos;action non réalisée pour sanctionner la fraude.
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <b className="text-white block mb-1">4. Tarifs & Plafonds</b>
                  Configurez le bonus d&apos;inscription, la rémunération par tâche et les quotas quotidiens.
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <b className="text-white block mb-1">5. Journal d&apos;Audit</b>
                  Consultez l&apos;historique immuable de chaque opération sensible réalisée sur la plateforme.
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <b className="text-white block mb-1">6. Support Client</b>
                  Répertoire des messages : répondez aux questions des usagers et suivez les échanges.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglets de Navigation Admin */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab("USERS")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition ${
              activeTab === "USERS" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" /> Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab("SOCIAL")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition relative ${
              activeTab === "SOCIAL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Share2 className="w-4 h-4" /> Comptes Sociaux ({stats?.pendingSocialVerifications || 0})
          </button>
          <button
            onClick={() => setActiveTab("REPORTS")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition relative ${
              activeTab === "REPORTS" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Scale className="w-4 h-4" /> Signalements ({stats?.pendingReports || 0})
          </button>
          <button
            onClick={() => setActiveTab("SETTINGS")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition ${
              activeTab === "SETTINGS" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" /> Tarifs & Plafonds
          </button>
          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition ${
              activeTab === "AUDIT" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" /> Journal d&apos;Audit
          </button>
          <button
            onClick={() => setActiveTab("SUPPORT")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition relative ${
              activeTab === "SUPPORT" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#FFB84D]" />
            <span>Support Client</span>
            {supportStats && supportStats.pendingTickets > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] font-black text-white">
                {supportStats.pendingTickets}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("GIFT_CODES")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition relative ${
              activeTab === "GIFT_CODES" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <Gift className="w-4 h-4 text-emerald-400" />
            <span>Codes Cadeaux & Influenceurs</span>
            {giftCodes.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                {giftCodes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("AI_ASSISTANT")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition relative ${
              activeTab === "AI_ASSISTANT" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#FFB84D] animate-pulse" />
            <span>Secrétaire IA & Co-Pilote</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
              Actif
            </span>
          </button>
        </div>

        {/* CONTENU ONGLET 1 : UTILISATEURS */}
        {activeTab === "USERS" && (
          <div className="space-y-4">
            {/* Barre de Recherche Utilisateurs */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher par email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                  className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={userStatusFilter}
                  onChange={(e) => {
                    setUserStatusFilter(e.target.value);
                    setTimeout(fetchUsers, 50);
                  }}
                  className="bg-slate-950 border border-slate-700 text-xs rounded-xl px-3 py-1.5 text-slate-300"
                >
                  <option value="">Tous les statuts</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="SUSPENDED">Suspendu</option>
                  <option value="BANNED">Banni</option>
                </select>
                <button
                  onClick={fetchUsers}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold"
                >
                  Filtrer
                </button>
              </div>
            </div>

            {/* Tableau Utilisateurs */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Solde</th>
                    <th className="py-3 px-4">Réputation</th>
                    <th className="py-3 px-4">Inscrit le</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 font-semibold text-white">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === "ADMIN" ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : u.status === "SUSPENDED"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400">{u.balance.toFixed(1)} pts</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold ${
                            u.reputationScore >= 80
                              ? "text-emerald-400"
                              : u.reputationScore >= 50
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {u.reputationScore.toFixed(0)}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setAdjustingUser(u)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-semibold"
                        >
                          ± Points
                        </button>
                        {u.status === "ACTIVE" ? (
                          <button
                            onClick={() => handleUpdateUserStatus(u.id, "SUSPENDED")}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold"
                          >
                            Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateUserStatus(u.id, "ACTIVE")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-semibold"
                          >
                            Réactiver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal d'ajustement de points */}
            {adjustingUser && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" /> Ajuster les points de {adjustingUser.email}
                    </h3>
                    <button
                      onClick={() => setAdjustingUser(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Solde actuel : <strong className="text-white">{adjustingUser.balance.toFixed(1)} points</strong>.
                    Chaque ajustement est journalisé dans le Grand Livre et l&apos;Audit Log.
                  </p>
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1">
                      Montant (+ pour créditer, - pour débiter) :
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1">
                      Motif d&apos;audit obligatoire (min. 5 caractères) :
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Dédommagement incident technique, régularisation..."
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500"
                    />
                  </div>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      disabled={adjustSubmitting}
                      onClick={handleAdjustPointsSubmit}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                    >
                      {adjustSubmitting ? "Traitement..." : "Appliquer l'ajustement"}
                    </button>
                    <button
                      onClick={() => setAdjustingUser(null)}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTENU ONGLET 2 : COMPTES SOCIAUX EN ATTENTE */}
        {activeTab === "SOCIAL" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-400" /> Comptes Sociaux en Attente de Vérification
              </h3>
              <button
                onClick={fetchSocialAccounts}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Actualiser
              </button>
            </div>

            {socialLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Chargement des comptes...</div>
            ) : pendingAccounts.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                Aucun compte social en attente de vérification pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            acc.platform === "TIKTOK"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}
                        >
                          {acc.platform}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Demandé le {new Date(acc.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-2">@{acc.identifier}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Membre : {acc.user.email}</p>

                      <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Code à vérifier en bio :</span>
                        <code className="text-amber-400 font-mono font-bold text-sm tracking-wider">
                          {acc.verificationCode}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => handleModerateSocial(acc.id, "VERIFY")}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Valider le compte
                      </button>
                      <button
                        onClick={() => handleModerateSocial(acc.id, "REJECT")}
                        className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition"
                      >
                        Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTENU ONGLET 3 : SIGNALEMENTS & ARBITRAGE */}
        {activeTab === "REPORTS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-rose-400" /> Arbitrage des Tâches Signalées
              </h3>
              <button
                onClick={fetchReports}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Actualiser
              </button>
            </div>

            {reportsLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Chargement des signalements...</div>
            ) : reports.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                Aucun signalement en attente. L&apos;écosystème fonctionne harmonieusement.
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-6 rounded-3xl bg-slate-900/80 border border-rose-500/30 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                          Signalé par : {rep.reporterUser.email}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          Action contestée : {rep.campaign.actionType} sur {rep.campaign.platform}
                        </h4>
                      </div>
                      <a
                        href={rep.campaign.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
                      >
                        Ouvrir la publication <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block font-semibold">Travailleur accusé :</span>
                        <p className="text-white font-medium">{rep.reportedUser.email}</p>
                        <p className="text-slate-400">
                          Score de réputation actuel :{" "}
                          <strong className="text-amber-400">{rep.reportedUser.reputationScore.toFixed(0)}/100</strong>
                        </p>
                        <p className="text-slate-400">
                          Rémunération suspendue :{" "}
                          <strong className="text-emerald-400">+{rep.taskCompletion.rewardPoints} pts</strong>
                        </p>
                      </div>

                      <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block font-semibold">Motif du signalement :</span>
                        <p className="text-rose-200 italic">&ldquo;{rep.reason}&rdquo;</p>
                        {rep.taskCompletion.screenshotUrl && (
                          <div className="pt-1">
                            <a
                              href={rep.taskCompletion.screenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <Camera className="w-3.5 h-3.5" /> Voir la preuve capture fournie
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handleResolveReport(rep.id, "UPHELD")}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition"
                      >
                        Confirmer la fraude (Rejeter la tâche & Sanction -10 réputation)
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, "DISMISSED")}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                      >
                        Rejeter le signalement (Approuver la tâche & Libérer les points)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTENU ONGLET 4 : TARIFS & PARAMÈTRES SYSTÈME */}
        {activeTab === "SETTINGS" && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" /> Paramétrage Économique & Plafonds
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Règle d&apos;or : la récompense travailleur doit toujours être strictement inférieure au coût créateur.
                </p>
              </div>
            </div>

            {settingsLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Chargement des paramètres...</div>
            ) : (
              <div className="space-y-4">
                {[
                  { key: "cost_like", label: "Coût créateur par Like (pts)", default: "1.3" },
                  { key: "reward_like", label: "Récompense travailleur par Like (pts)", default: "1.0" },
                  { key: "cost_comment", label: "Coût créateur par Commentaire (pts)", default: "1.8" },
                  { key: "reward_comment", label: "Récompense travailleur par Commentaire (pts)", default: "1.4" },
                  { key: "cost_subscribe", label: "Coût créateur par Abonnement (pts)", default: "2.5" },
                  { key: "reward_subscribe", label: "Récompense travailleur par Abonnement (pts)", default: "2.0" },
                  { key: "base_daily_task_limit", label: "Plafond quotidien initial de tâches par utilisateur", default: "20" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{item.label}</span>
                      <code className="text-[10px] text-slate-500 font-mono">{item.key}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={settings[item.key] || item.default}
                        onBlur={(e) => handleSaveSetting(item.key, e.target.value)}
                        className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTENU ONGLET 5 : JOURNAL D'AUDIT SYSTÈME */}
        {activeTab === "AUDIT" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" /> Journal d&apos;Audit Immuable
              </h3>
              <button
                onClick={fetchAuditLogs}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Actualiser
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Acteur</th>
                    <th className="py-3 px-4">Cible</th>
                    <th className="py-3 px-4">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-indigo-400">{log.action}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{log.actor?.email || "Système"}</td>
                      <td className="py-3 px-4 text-slate-400">{log.target?.email || "-"}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 6 : RÉPERTOIRE & SUPPORT CLIENT */}
        {activeTab === "SUPPORT" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-indigo-400" /> Répertoire des Messages & Support Client
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consultez les demandes des usagers, suivez les échanges et apportez vos réponses officielles.
                </p>
              </div>

              <button
                onClick={fetchSupportTickets}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Actualiser ({supportTickets.length})
              </button>
            </div>

            {/* Barre de Recherche et Filtres */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={supportSearch}
                  onChange={(e) => setSupportSearch(e.target.value)}
                  placeholder="Rechercher par nom, email, identifiant ou contenu..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {/* Filtres de statut */}
                {(
                  [
                    { id: "ALL", label: "Tous" },
                    { id: "OPEN", label: "⏳ En attente" },
                    { id: "ANSWERED", label: "✓ Répondu" },
                    { id: "RESOLVED", label: "✓ Résolu" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSupportFilter(f.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      supportFilter === f.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout 2 Colonnes : Répertoire de gauche + Fil de discussion de droite */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Colonne Gauche : Liste des usagers et demandes */}
              <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                {supportLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Chargement des messages...
                  </div>
                ) : supportTickets.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 space-y-2">
                    <Inbox className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs font-medium">Aucun message ne correspond à ce filtre.</p>
                  </div>
                ) : (
                  supportTickets.map((ticket) => {
                    const isSelected = selectedTicket?.id === ticket.id;
                    const lastMsg = ticket.messages[ticket.messages.length - 1];

                    const statusPill =
                      ticket.status === "OPEN"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : ticket.status === "ANSWERED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";

                    const statusText =
                      ticket.status === "OPEN"
                        ? "En attente"
                        : ticket.status === "ANSWERED"
                        ? "Répondu"
                        : "Résolu";

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/40"
                            : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                        }`}
                      >
                        {/* En-tête usager */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <b className="text-xs font-bold text-white truncate">
                                {ticket.userName}
                              </b>
                              <span className="text-[11px] text-slate-400 truncate">
                                ({ticket.userEmail})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                              ID: {ticket.userId} • Ticket #{ticket.id.slice(-6)}
                            </span>
                          </div>

                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${statusPill}`}>
                            {statusText}
                          </span>
                        </div>

                        {/* Sujet et extrait du message */}
                        <div className="mt-2.5">
                          <span className="text-xs font-bold text-indigo-300 block truncate">
                            {ticket.subject}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {lastMsg?.content || ""}
                          </p>
                        </div>

                        {/* Date et catégorie */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-semibold border border-slate-800">
                            {ticket.category}
                          </span>
                          <span>
                            {new Date(ticket.updatedAt).toLocaleString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Colonne Droite : Fil de discussion complet & Réponse */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 min-h-[500px] flex flex-col justify-between">
                {selectedTicket ? (
                  <>
                    <div className="space-y-4">
                      {/* En-tête de la conversation */}
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-white">
                              {selectedTicket.subject}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                              #{selectedTicket.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                            <span>Usager : <strong className="text-white">{selectedTicket.userName}</strong> ({selectedTicket.userEmail})</span>
                            <span>•</span>
                            <span className="font-mono text-slate-500">UID: {selectedTicket.userId}</span>
                          </div>
                        </div>

                        {/* Actions rapides sur le statut */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateTicketStatus(selectedTicket.id, "OPEN")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              selectedTicket.status === "OPEN"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                            }`}
                          >
                            En attente
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateTicketStatus(selectedTicket.id, "ANSWERED")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              selectedTicket.status === "ANSWERED"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                            }`}
                          >
                            Répondu
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateTicketStatus(selectedTicket.id, "RESOLVED")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              selectedTicket.status === "RESOLVED"
                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                            }`}
                          >
                            Résolu
                          </button>
                        </div>
                      </div>

                      {/* Fil des messages échangés */}
                      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        {selectedTicket.messages.map((msg: any) => {
                          const isAdmin = msg.senderRole === "ADMIN";
                          return (
                            <div
                              key={msg.id}
                              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
                                isAdmin
                                  ? "bg-indigo-950/40 border-indigo-800/60 ml-6"
                                  : "bg-slate-950/80 border-slate-800 mr-6"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className={isAdmin ? "text-indigo-300 flex items-center gap-1.5" : "text-white flex items-center gap-1.5"}>
                                  {isAdmin ? "🛡️ Support Officiel AddMe.io" : `👤 ${msg.senderName} (${msg.senderEmail})`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {new Date(msg.createdAt).toLocaleString("fr-FR")}
                                </span>
                              </div>
                              <p className="text-slate-200 whitespace-pre-wrap m-0">
                                {msg.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Zone de rédaction de la réponse Administrateur */}
                    <div className="pt-3 border-t border-slate-800 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-white">
                        <div className="flex items-center gap-2">
                          <Reply className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Répondre à {selectedTicket.userName} :</span>
                        </div>
                        <button
                          type="button"
                          disabled={aiDraftLoading}
                          onClick={handleGenerateAIDraft}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-60"
                          title="L'IA Secrétaire analyse le problème et formule une proposition de réponse complète"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                          <span>{aiDraftLoading ? "Rédaction par l'IA..." : "Générer la réponse avec l'IA Secrétaire"}</span>
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        placeholder={`Rédigez ici votre réponse claire et explicite pour guider ${selectedTicket.userName}...`}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />

                      <div className="flex flex-wrap items-center justify-end gap-2.5">
                        <button
                          type="button"
                          disabled={adminReplySubmitting || !adminReplyText.trim()}
                          onClick={() => handleAdminReply(selectedTicket.id)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                          title="Envoyer la réponse personnalisée rédigée ci-dessus"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{adminReplySubmitting ? "Envoi..." : "Envoyer la réponse"}</span>
                        </button>

                        <button
                          type="button"
                          disabled={adminReplySubmitting || selectedTicket.status === "RESOLVED"}
                          onClick={() => handleMarkResolved(selectedTicket.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                          title="Clôturer le ticket et notifier l'usager que son problème a été résolu"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {selectedTicket.status === "RESOLVED"
                              ? "✓ Déjà résolu"
                              : "Marquer comme résolu"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="my-auto py-16 text-center text-slate-500 space-y-3">
                    <MessageCircle className="w-12 h-12 mx-auto text-slate-700" />
                    <div>
                      <b className="text-slate-300 text-sm block">Sélectionnez une conversation</b>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Cliquez sur un usager dans le répertoire à gauche pour consulter l&apos;intégralité de ses messages et lui apporter votre réponse.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 7 : CODES CADEAUX & MARKETING D'INFLUENCE */}
        {activeTab === "GIFT_CODES" && (
          <div className="space-y-6">
            {/* Cartes de Métriques Clés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Codes Actifs</span>
                  <Gift className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {giftCodes.filter((c) => c.isActive).length}{" "}
                  <span className="text-xs text-slate-500 font-normal">/ {giftCodes.length} total</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Codes cadeaux opérationnels pour l&apos;acquisition
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Inscriptions Filleuls</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-indigo-300">
                  {giftCodes.reduce((sum, c) => sum + (c.usesCount || 0), 0)}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Utilisateurs inscrits grâce aux codes partenaires
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Filleuls Vérifiés</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {giftCodes.reduce((sum, c) => sum + (c.verifiedCount || 0), 0)}
                  <span className="text-xs text-emerald-500/80 font-normal ml-2">
                    ({giftCodes.reduce((sum, c) => sum + (c.usesCount || 0), 0) > 0
                      ? Math.round(
                          (giftCodes.reduce((sum, c) => sum + (c.verifiedCount || 0), 0) /
                            giftCodes.reduce((sum, c) => sum + (c.usesCount || 0), 0)) *
                            100
                        )
                      : 0}
                    % conv.)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Comptes vérifiés ayant débloqué la récompense influenceur
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Points Distribués</span>
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-300">
                  {giftCodes
                    .reduce((sum, c) => sum + (c.totalDistributedPoints || 0), 0)
                    .toLocaleString("fr-FR")}
                  <span className="text-xs text-slate-500 font-normal ml-1">pts</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Grand Livre : bonus filleuls (x4) + primes d&apos;influenceurs
                </p>
              </div>
            </div>

            {/* Barre de Recherche & Bouton Nouveau Code */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher par code, email influenceur ou description..."
                  value={giftCodesSearch}
                  onChange={(e) => setGiftCodesSearch(e.target.value)}
                  className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
                {giftCodesSearch && (
                  <button
                    onClick={() => setGiftCodesSearch("")}
                    className="text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchGiftCodes}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Rafraîchir la liste"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${giftCodesLoading ? "animate-spin" : ""}`} />
                  <span>Actualiser</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCreateGiftModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer un Code Cadeau</span>
                </button>
              </div>
            </div>

            {/* Note d'Information Anti-Fraude */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <b className="text-white block">Règle Anti-Fraude & Rémunération des Influenceurs :</b>
                <p className="text-slate-300 leading-relaxed m-0">
                  Le nouvel utilisateur reçoit immédiatement son bonus x4 (+200 pts) dès son inscription. En revanche, pour prévenir les robots et faux comptes, <strong>l&apos;influenceur affilié ne reçoit sa prime (+100 pts) qu&apos;une fois le compte filleul officiellement vérifié</strong> (adresse email validée). Tout code cadeau doit impérativement être rattaché à un compte utilisateur existant.
                </p>
              </div>
            </div>

            {/* Tableau des Codes Cadeaux */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3.5 px-4">Code & Lien Partenaire</th>
                      <th className="py-3.5 px-4">Influenceur Affilié</th>
                      <th className="py-3.5 px-4">Bonus Filleul</th>
                      <th className="py-3.5 px-4">Gain Influenceur</th>
                      <th className="py-3.5 px-4">Inscriptions & Conversion</th>
                      <th className="py-3.5 px-4">Limites & Validité</th>
                      <th className="py-3.5 px-4">Statut</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {giftCodesLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                          Chargement des codes cadeaux...
                        </td>
                      </tr>
                    ) : giftCodes.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-500 space-y-3">
                          <Gift className="w-12 h-12 mx-auto text-slate-700" />
                          <div>
                            <b className="text-slate-300 text-sm block">Aucun code cadeau configuré</b>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                              Cliquez sur « Créer un Code Cadeau » pour générer votre premier code de marketing d&apos;influence affilié à un créateur.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      giftCodes
                        .filter((gc) => {
                          if (!giftCodesSearch.trim()) return true;
                          const t = giftCodesSearch.toLowerCase();
                          return (
                            gc.code.toLowerCase().includes(t) ||
                            gc.influencer.email.toLowerCase().includes(t) ||
                            (gc.description && gc.description.toLowerCase().includes(t))
                          );
                        })
                        .map((gc) => {
                          const isCodeOnlyCopied = copiedCodeOnlyId === gc.id;
                          const isLinkCopied = copiedLinkId === gc.id;
                          return (
                            <tr key={gc.id} className="hover:bg-slate-800/30 transition">
                              {/* Code & Lien */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-mono font-black text-xs tracking-wider">
                                      {gc.code}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyCodeOnly(gc.code, gc.id)}
                                      className={`px-2 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                                        isCodeOnlyCopied
                                          ? "bg-emerald-600 text-white border-emerald-500 font-bold shadow-xs"
                                          : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800"
                                      }`}
                                      title="Copier uniquement le code (ex: KAILAWD13)"
                                    >
                                      {isCodeOnlyCopied ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-white" />
                                          <span className="text-[10px] font-bold text-white">Code copié</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span className="text-[10px] text-slate-400">Copier code</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  {gc.description && (
                                    <p className="text-[11px] text-slate-400 line-clamp-1 m-0">
                                      {gc.description}
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* Influenceur */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-white block">
                                    {gc.influencer.email}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <span
                                      className={`px-1.5 py-0.2 rounded font-bold ${
                                        gc.influencer.status === "ACTIVE"
                                          ? "bg-emerald-950 text-emerald-300"
                                          : "bg-rose-950 text-rose-300"
                                      }`}
                                    >
                                      {gc.influencer.status}
                                    </span>
                                    <span className="text-slate-400">
                                      ⭐ Rép : {gc.influencer.reputationScore}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Bonus Filleul */}
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1 font-bold text-indigo-300">
                                  <Sparkles className="w-3 h-3 text-indigo-400" />
                                  +{gc.userBonusPoints} pts (x{gc.multiplier})
                                </span>
                              </td>

                              {/* Gain Influenceur */}
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                                  <Coins className="w-3 h-3 text-amber-400" />
                                  +{gc.influencerBonus} pts / vérifié
                                </span>
                              </td>

                              {/* Statistiques */}
                              <td className="py-3.5 px-4">
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-white">
                                    {gc.usesCount} inscrit{gc.usesCount > 1 ? "s" : ""} ·{" "}
                                    <span className="text-emerald-400">{gc.verifiedCount} vérifié{gc.verifiedCount > 1 ? "s" : ""}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                    <span>Taux : <strong className="text-white">{gc.conversionRate}%</strong></span>
                                    <span>·</span>
                                    <span>Total : <strong className="text-amber-300">{gc.totalDistributedPoints} pts</strong></span>
                                  </div>
                                </div>
                              </td>

                              {/* Limites & Validité */}
                              <td className="py-3.5 px-4 text-xs text-slate-400">
                                <div className="space-y-0.5">
                                  <div>
                                    Quota :{" "}
                                    <strong className="text-white">
                                      {gc.maxUses ? `${gc.usesCount} / ${gc.maxUses}` : "Illimité"}
                                    </strong>
                                  </div>
                                  <div>
                                    Expire :{" "}
                                    <strong className="text-white">
                                      {gc.expiresAt
                                        ? new Date(gc.expiresAt).toLocaleDateString("fr-FR")
                                        : "Permanent"}
                                    </strong>
                                  </div>
                                </div>
                              </td>

                              {/* Statut Toggle */}
                              <td className="py-3.5 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleGiftCode(gc.id, gc.isActive)}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                    gc.isActive
                                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 hover:bg-emerald-900"
                                      : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                                  }`}
                                  title="Cliquer pour activer ou désactiver ce code"
                                >
                                  {gc.isActive ? (
                                    <>
                                      <ToggleRight className="w-4 h-4 text-emerald-400" />
                                      <span>Actif</span>
                                    </>
                                  ) : (
                                    <>
                                      <ToggleLeft className="w-4 h-4 text-slate-500" />
                                      <span>Inactif</span>
                                    </>
                                  )}
                                </button>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyReferralLink(gc.code, gc.id)}
                                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                                      isLinkCopied
                                        ? "bg-emerald-600 text-white border-emerald-500 font-bold"
                                        : "bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800"
                                    }`}
                                    title="Copier le lien public d'inscription (?ref=...)"
                                  >
                                    {isLinkCopied ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-white" />
                                        <span>Lien copié</span>
                                      </>
                                    ) : (
                                      <>
                                        <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>Lien</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteGiftCode(gc.id, gc.code)}
                                    className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-900/40 transition"
                                    title="Supprimer ce code cadeau"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal de Création de Code Cadeau */}
            {isCreateGiftModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl animate-up">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Gift className="w-5 h-5 text-emerald-400" />
                      <span>Créer un Code Cadeau d&apos;Influenceur</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsCreateGiftModalOpen(false)}
                      className="text-slate-400 hover:text-white transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateGiftCode} className="space-y-4">
                    {/* Code Cadeau */}
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Code Cadeau <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newGiftCode}
                        onChange={(e) =>
                          setNewGiftCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                        }
                        placeholder="EX: TIKTOK200, INSTA50, PARTENAIRE"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white uppercase placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Caractères alphanumériques majuscules uniquement (3 caractères minimum).
                      </p>
                    </div>

                    {/* Email de l'influenceur (OBLIGATOIRE) */}
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Email de l&apos;Influenceur Affilié <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newInfluencerEmail}
                        onChange={(e) => setNewInfluencerEmail(e.target.value)}
                        placeholder="influenceur@exemple.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-amber-400/90 mt-1">
                        ⚠️ Ce compte doit impérativement exister sur AddMe.io. Il recevra 100 points à chaque fois qu&apos;un compte filleul sera vérifié.
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-xs text-slate-300 font-bold block mb-1">
                        Description / Contexte du Partenariat
                      </label>
                      <input
                        type="text"
                        value={newGiftDescription}
                        onChange={(e) => setNewGiftDescription(e.target.value)}
                        placeholder="Ex: Campagne TikTok @influenceur_tech - Novembre 2026"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Grille Multiplicateur & Prime Influenceur */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-300 font-bold block mb-1">
                          Multiplicateur Filleul
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="10"
                          value={newMultiplier}
                          onChange={(e) => setNewMultiplier(Number(e.target.value) || 4.0)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Défaut 4.0 = {Math.round(50 * newMultiplier)} pts offerts au nouvel inscrit.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-300 font-bold block mb-1">
                          Prime Influenceur (pts)
                        </label>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={newInfluencerBonus}
                          onChange={(e) => setNewInfluencerBonus(Number(e.target.value) || 100.0)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold text-amber-300"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Attribués à l&apos;influenceur dès vérification du compte filleul.
                        </p>
                      </div>
                    </div>

                    {/* Grille Quota max & Date expiration */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-300 font-bold block mb-1">
                          Quota Max d&apos;Utilisations
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newMaxUses}
                          onChange={(e) => setNewMaxUses(e.target.value)}
                          placeholder="Illimité"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-300 font-bold block mb-1">
                          Date d&apos;Expiration
                        </label>
                        <input
                          type="date"
                          value={newExpiresAt}
                          onChange={(e) => setNewExpiresAt(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsCreateGiftModalOpen(false)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={createGiftSubmitting || !newGiftCode.trim() || !newInfluencerEmail.trim()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {createGiftSubmitting ? "Création en cours..." : "Créer et Lier le Code"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTENU ONGLET 8 : SECRÉTAIRE IA & CO-PILOTE */}
        {activeTab === "AI_ASSISTANT" && (
          <div className="space-y-6">
            {/* Bannière Exécutive IA */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 flex-shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">
                      Secrétaire IA & Co-Pilote AddMe.io
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      En ligne 24/7
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Intelligence administrative connectée à l&apos;architecture d&apos;AddMe.io (chrono 20s, Sentinel Vision, Ledger immuable, SasPay Mobile Money, codes cadeaux et support client). Posez vos questions ou lancez un diagnostic.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunAIAudit}
                disabled={aiAuditLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 whitespace-nowrap self-start md:self-auto cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>
                  {aiAuditLoading ? "Audit en cours..." : "Lancer un Diagnostic Global"}
                </span>
              </button>
            </div>

            {/* Rapport d'Audit Dynamique (si généré) */}
            {aiAuditReport && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Rapport d&apos;Audit & Diagnostic Synthétique du Système</span>
                  </div>
                  <button
                    onClick={() => setAiAuditReport(null)}
                    className="text-xs text-slate-400 hover:text-white transition"
                  >
                    Fermer le rapport
                  </button>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 max-h-96 overflow-y-auto">
                  {aiAuditReport}
                </div>
              </div>
            )}

            {/* Interface Deux Colonnes : Raccourcis Opérationnels + Console de Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne Gauche : Raccourcis Opérationnels en 1 clic */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Requêtes Fréquentes & Raccourcis
                </h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSendToAI(
                        "Peux-tu me faire un bilan synthétique de l'activité sur la plateforme et de l'état des points en circulation ?"
                      )
                    }
                    className="w-full text-left p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 hover:text-white transition group flex items-start gap-3 cursor-pointer"
                  >
                    <span className="text-base">📊</span>
                    <div>
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition">
                        Bilan de santé & Métriques
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Statut des utilisateurs, campagnes actives et points
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendToAI(
                        "Rappelle-moi le fonctionnement exact du robot anti-fraude, du chrono 20s et de la vérification Gemini Vision."
                      )
                    }
                    className="w-full text-left p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 hover:text-white transition group flex items-start gap-3 cursor-pointer"
                  >
                    <span className="text-base">🛡️</span>
                    <div>
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition">
                        Règles Anti-Fraude Sentinel
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Focus timer 20s, IA Vision & validation des tâches
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendToAI(
                        "Quels sont les forfaits d'achat de points disponibles sur la boutique et les taux de conversion Mobile Money ?"
                      )
                    }
                    className="w-full text-left p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 hover:text-white transition group flex items-start gap-3 cursor-pointer"
                  >
                    <span className="text-base">💰</span>
                    <div>
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition">
                        Tarifs Forfaits SasPay
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        De 3 000 FCFA à 18 000 FCFA (Mobile Money)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendToAI(
                        "Comment fonctionnent les codes cadeaux partenaires, le bonus filleul et la prime influenceur ?"
                      )
                    }
                    className="w-full text-left p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 hover:text-white transition group flex items-start gap-3 cursor-pointer"
                  >
                    <span className="text-base">🎁</span>
                    <div>
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition">
                        Codes Cadeaux & Affiliation
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Bonus x4 / x10 et commission influenceur par compte vérifié
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendToAI(
                        "Quelles sont les directives officielles pour répondre aux réclamations des utilisateurs sur les tâches ou paiements ?"
                      )
                    }
                    className="w-full text-left p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 hover:text-white transition group flex items-start gap-3 cursor-pointer"
                  >
                    <span className="text-base">💬</span>
                    <div>
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition">
                        Directives Support Client
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Politique de réponse aux réclamations et litiges
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendToAI(
                        "Explique-moi comment la table LedgerEntry garantit l'immuabilité et l'absence de double-crédit."
                      )
                    }
                    className="w-full text-left p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 hover:text-white transition group flex items-start gap-3 cursor-pointer"
                  >
                    <span className="text-base">🔒</span>
                    <div>
                      <div className="font-semibold text-white group-hover:text-indigo-300 transition">
                        Intégrité Comptable Ledger
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Comptabilité en partie double et clés d&apos;idempotence
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Colonne Droite (2/3) : Console de Dialogue Interactive */}
              <div className="lg:col-span-2 flex flex-col h-[650px] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                {/* En-tête Console */}
                <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Secrétaire Administrative & Support</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Connectée à la base de connaissance AddMe.io & Gemini
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800">
                    SUPER_ADMIN CONSOLE
                  </span>
                </div>

                {/* Fil des Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {aiChatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        msg.sender === "admin" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.sender === "ai" && (
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-md">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                          msg.sender === "admin"
                            ? "bg-indigo-600 text-white rounded-tr-none shadow-md"
                            : "bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm"
                        }`}
                      >
                        <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                        <div
                          className={`text-[9px] mt-2 font-mono ${
                            msg.sender === "admin" ? "text-indigo-200 text-right" : "text-slate-500"
                          }`}
                        >
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  ))}

                  {aiLoading && (
                    <div className="flex gap-3 items-center text-slate-400 text-xs italic">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/50 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                        <span>La Secrétaire IA analyse votre demande et rédige sa réponse...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Saisie de Message */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendToAI();
                  }}
                  className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={aiInputMessage}
                    onChange={(e) => setAiInputMessage(e.target.value)}
                    placeholder="Posez une question à la secrétaire IA ou demandez un conseil..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !aiInputMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Envoyer</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return <AdminDashboard />;
}

