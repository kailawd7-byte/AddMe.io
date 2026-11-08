"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Headphones,
} from "lucide-react";
import type { SupportTicket } from "@/lib/support";

const CATEGORIES = [
  { id: "GENERAL", label: "Général / Fonctionnement" },
  { id: "POINTS", label: "Points, Solde & Rechargement" },
  { id: "CAMPAIGN", label: "Mes Campagnes & Diffusion" },
  { id: "TASK", label: "Missions & Tâches (Chrono/Robot)" },
  { id: "ACCOUNT", label: "Comptes Sociaux & Bio" },
  { id: "BUG", label: "Signaler un problème technique" },
] as const;

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"NEW" | "HISTORY">("NEW");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulaire nouveau ticket
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportTicket["category"]>("GENERAL");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Vue détail ticket
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
    }
  }, [isOpen]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Erreur lors de l'envoi." });
      } else {
        setFeedback({
          type: "success",
          text: "Votre message a été transmis à l'équipe support. Vous recevrez une réponse dans votre historique !",
        });
        setSubject("");
        setMessage("");
        await fetchTickets();
        setTimeout(() => {
          setActiveTab("HISTORY");
          setExpandedTicketId(data.ticket?.id || null);
        }, 1200);
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur réseau. Veuillez réessayer." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;

    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText }),
      });

      if (res.ok) {
        setReplyText("");
        await fetchTickets();
      } else {
        const data = await res.json();
        alert(data.error || "Impossible d'envoyer la réponse.");
      }
    } catch {
      alert("Erreur de connexion.");
    } finally {
      setReplySubmitting(false);
    }
  };

  // Compter les réponses non lues ou en attente
  const answeredCount = tickets.filter((t) => t.status === "ANSWERED").length;

  return (
    <>
      {/* Bouton Flottant en bas à droite (uniquement dashboard) */}
      <aside aria-label="Support client" className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#5B3DF5] to-[#7B5EFA] text-white shadow-xl shadow-[#5B3DF5]/35 hover:shadow-2xl hover:shadow-[#5B3DF5]/50 hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Ouvrir le support client"
        >
          <div className="relative">
            <MessageSquare className="h-5 w-5 sm:h-5 sm:w-5" />
            {answeredCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-extrabold tracking-tight">
            Support client
          </span>
          {answeredCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-[10px] font-black text-white ml-0.5">
              {answeredCount}
            </span>
          )}
        </button>
      </aside>

      {/* Modal / Tiroir Flottant de Support */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-[#0B0A14]/60 backdrop-blur-xs">
          <div
            className="w-full sm:max-w-lg bg-white dark:bg-[#151426] border border-[#E3E3EE] dark:border-[#26243A] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[82vh] transition-all animate-up"
            style={{ width: "100%", maxWidth: "480px" }}
          >
            {/* En-tête du Modal Support */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#5B3DF5] via-[#4F30E8] to-[#3A22C8] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight m-0 text-white leading-tight">
                    Support Client AddMe.io
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-white/80 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    <span>Équipe disponible • Réponse rapide</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Onglets : Poser une question VS Mes demandes */}
            <div className="flex items-center border-b border-[#E3E3EE] dark:border-[#26243A] bg-[#F7F7FB] dark:bg-[#111020] px-4 pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("NEW")}
                className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "NEW"
                    ? "border-[#5B3DF5] text-[#5B3DF5] dark:text-[#A38EFF]"
                    : "border-transparent text-[#5A5A70] dark:text-[#A3A1BD] hover:text-[#12122A] dark:hover:text-white"
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Nouveau message</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("HISTORY")}
                className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 relative ${
                  activeTab === "HISTORY"
                    ? "border-[#5B3DF5] text-[#5B3DF5] dark:text-[#A38EFF]"
                    : "border-transparent text-[#5A5A70] dark:text-[#A3A1BD] hover:text-[#12122A] dark:hover:text-white"
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Mes conversations ({tickets.length})</span>
                {answeredCount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                )}
              </button>
            </div>

            {/* Corps du modal */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {activeTab === "NEW" ? (
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  {feedback && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                        feedback.type === "success"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                          : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                      }`}
                    >
                      {feedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      )}
                      <span>{feedback.text}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#12122A] dark:text-white mb-1.5">
                      Objet de votre demande
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ex: Question sur la validation d'une mission..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7FB] dark:bg-[#17162A] border border-[#CFCFE0] dark:border-[#383556] text-xs text-[#12122A] dark:text-white placeholder-[#5A5A70] dark:placeholder-[#A3A1BD] focus:outline-none focus:border-[#5B3DF5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#12122A] dark:text-white mb-1.5">
                      Catégorie
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7FB] dark:bg-[#17162A] border border-[#CFCFE0] dark:border-[#383556] text-xs text-[#12122A] dark:text-white focus:outline-none focus:border-[#5B3DF5]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#12122A] dark:text-white mb-1.5">
                      Détail de votre question ou message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Expliquez votre situation, le problème rencontré ou vos interrogations..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F7FB] dark:bg-[#17162A] border border-[#CFCFE0] dark:border-[#383556] text-xs text-[#12122A] dark:text-white placeholder-[#5A5A70] dark:placeholder-[#A3A1BD] focus:outline-none focus:border-[#5B3DF5]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="addme-btn addme-btn-primary w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{submitting ? "Transmission en cours..." : "Envoyer au support"}</span>
                  </button>

                  <p className="text-[11px] text-[#5A5A70] dark:text-[#A3A1BD] text-center">
                    Notre équipe consulte les messages en continu. Vous pourrez suivre l&apos;avancement dans l&apos;onglet « Mes conversations ».
                  </p>
                </form>
              ) : (
                /* Historique des tickets & fil de discussion */
                <div className="space-y-3">
                  {tickets.length === 0 ? (
                    <div className="py-12 text-center text-[#5A5A70] dark:text-[#A3A1BD] space-y-2">
                      <HelpCircle className="h-8 w-8 mx-auto opacity-40 text-[#5B3DF5]" />
                      <p className="text-xs font-medium">Vous n&apos;avez encore envoyé aucun message au support.</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("NEW")}
                        className="text-xs font-bold text-[#5B3DF5] dark:text-[#A38EFF] hover:underline"
                      >
                        Poser votre première question →
                      </button>
                    </div>
                  ) : (
                    tickets.map((t) => {
                      const isExpanded = expandedTicketId === t.id;
                      const statusStyle =
                        t.status === "ANSWERED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          : t.status === "RESOLVED"
                          ? "bg-[#EEEAFF] text-[#3A22C8] border-[#D9D2FF] dark:bg-[#5B3DF5]/20 dark:text-[#A38EFF] dark:border-[#5B3DF5]/40"
                          : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";

                      const statusLabel =
                        t.status === "ANSWERED"
                          ? "✓ Réponse de l'équipe"
                          : t.status === "RESOLVED"
                          ? "✓ Résolu"
                          : "⏳ En attente de réponse";

                      return (
                        <div
                          key={t.id}
                          className="rounded-2xl border border-[#E3E3EE] dark:border-[#26243A] bg-[#F7F7FB] dark:bg-[#19182C] overflow-hidden transition-all"
                        >
                          {/* En-tête du ticket dans la liste */}
                          <div
                            onClick={() =>
                              setExpandedTicketId(isExpanded ? null : t.id)
                            }
                            className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusStyle}`}>
                                  {statusLabel}
                                </span>
                                <span className="text-[11px] text-[#5A5A70] dark:text-[#A3A1BD]">
                                  {new Date(t.createdAt).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <b className="block text-xs sm:text-sm font-bold text-[#12122A] dark:text-white mt-1 truncate">
                                {t.subject}
                              </b>
                              <span className="text-[11px] text-[#5A5A70] dark:text-[#A3A1BD] block truncate mt-0.5">
                                {t.messages[t.messages.length - 1]?.content || ""}
                              </span>
                            </div>

                            <button type="button" className="text-[#5A5A70] dark:text-[#A3A1BD] p-1">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>

                          {/* Fil de discussion déplié */}
                          {isExpanded && (
                            <div className="p-3.5 border-t border-[#E3E3EE] dark:border-[#26243A] space-y-3 bg-white dark:bg-[#151426]">
                              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                {t.messages.map((m) => {
                                  const isAdmin = m.senderRole === "ADMIN";
                                  return (
                                    <div
                                      key={m.id}
                                      className={`p-3 rounded-xl text-xs space-y-1 ${
                                        isAdmin
                                          ? "bg-[#EEEAFF] dark:bg-[#5B3DF5]/20 border border-[#D9D2FF] dark:border-[#5B3DF5]/30 ml-4"
                                          : "bg-[#F7F7FB] dark:bg-[#1E1D32] border border-[#E3E3EE] dark:border-[#2E2C48] mr-4"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className={isAdmin ? "text-[#3A22C8] dark:text-[#A38EFF] flex items-center gap-1" : "text-[#12122A] dark:text-white"}>
                                          {isAdmin ? "🛡️ Support AddMe.io" : "Vous"}
                                        </span>
                                        <span className="text-[10px] text-[#5A5A70] dark:text-[#A3A1BD] font-normal">
                                          {new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                      </div>
                                      <p className="text-[#12122A] dark:text-[#F4F3FA] whitespace-pre-wrap leading-relaxed m-0">
                                        {m.content}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Formulaire de réponse de l'utilisateur */}
                              <div className="pt-2 border-t border-[#E3E3EE] dark:border-[#26243A] flex items-center gap-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Répondre au support..."
                                  className="flex-1 px-3 py-2 rounded-xl bg-[#F7F7FB] dark:bg-[#19182C] border border-[#CFCFE0] dark:border-[#383556] text-xs text-[#12122A] dark:text-white focus:outline-none focus:border-[#5B3DF5]"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendReply(t.id);
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  disabled={replySubmitting || !replyText.trim()}
                                  onClick={() => handleSendReply(t.id)}
                                  className="p-2.5 rounded-xl bg-[#5B3DF5] text-white hover:bg-[#4F30E8] disabled:opacity-50 transition-colors"
                                  title="Envoyer"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
