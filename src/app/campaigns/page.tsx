"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Video,
  Plus,
  Play,
  Pause,
  XCircle,
  ExternalLink,
  Coins,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Eye,
  Camera,
  Check,
  X,
  FileText,
} from "lucide-react";

interface CompletionDetail {
  id: string;
  workerUserId: string;
  status: "IN_PROGRESS" | "PENDING_RETENTION" | "APPROVED" | "REJECTED" | "FLAGGED";
  startedAt: string;
  submittedAt: string | null;
  retentionEndsAt: string | null;
  screenshotUrl?: string | null;
}

interface CampaignItem {
  id: string;
  platform: "TIKTOK" | "YOUTUBE";
  actionType: "LIKE" | "COMMENT" | "SUBSCRIBE";
  videoUrl: string;
  commentTemplate: string | null;
  totalQuantity: number;
  completedQuantity: number;
  dailyCap: number;
  deliveredToday: number;
  costPerUnit: number;
  rewardPerUnit: number;
  totalCost: number;
  refundedPoints: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  socialAccount: {
    platform: string;
    identifier: string;
    status: string;
  };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // État du modal d'inspections des exécutions
  const [inspectCampaignId, setInspectCampaignId] = useState<string | null>(null);
  const [inspectCompletions, setInspectCompletions] = useState<CompletionDetail[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  // État du modal de signalement
  const [reportingCompletionId, setReportingCompletionId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleToggleStatus = async (campaign: CampaignItem) => {
    const nextStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setActionLoadingId(campaign.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Action impossible." });
      } else {
        setFeedback({ type: "success", text: data.message });
        await fetchCampaigns();
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur de connexion au serveur." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelCampaign = async (campaign: CampaignItem) => {
    const unconsumed = campaign.totalQuantity - campaign.completedQuantity;
    const refundEst = (unconsumed * campaign.costPerUnit).toFixed(1);

    if (
      !confirm(
        `Voulez-vous vraiment annuler cette campagne ?\n\n${unconsumed} tâche(s) restante(s) vous seront immédiatement remboursées pour un montant de ${refundEst} points sur votre solde.`
      )
    ) {
      return;
    }

    setActionLoadingId(campaign.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/cancel`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Impossible d'annuler la campagne." });
      } else {
        setFeedback({ type: "success", text: data.message });
        await fetchCampaigns();
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur réseau lors de l'annulation." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenInspectModal = async (campaignId: string) => {
    setInspectCampaignId(campaignId);
    setInspectLoading(true);
    setInspectCompletions([]);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        const completionsList: CompletionDetail[] = [];
        data.campaign.tasks.forEach((t: any) => {
          if (t.completions && t.completions.length > 0) {
            completionsList.push(...t.completions);
          }
        });
        setInspectCompletions(completionsList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportingCompletionId || reportReason.trim().length < 5) {
      alert("Veuillez indiquer un motif clair (au moins 5 caractères).");
      return;
    }

    setSubmittingReport(true);
    try {
      const res = await fetch(`/api/tasks/${reportingCompletionId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erreur lors du signalement.");
      } else {
        alert(data.message || "Signalement effectué avec succès.");
        setReportingCompletionId(null);
        setReportReason("");
        if (inspectCampaignId) {
          handleOpenInspectModal(inspectCampaignId);
        }
      }
    } catch {
      alert("Erreur réseau lors du signalement.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (filter === "ALL") return true;
    return c.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Video className="h-7 w-7 text-indigo-400" />
            Mes Campagnes
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Suivez la progression de vos engagements, inspectez les exécutions, mettez en pause ou annulez à tout
            moment.
          </p>
        </div>

        <Link
          href="/campaigns/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nouvelle campagne
        </Link>
      </div>

      {/* Global feedback message */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { key: "ALL", label: "Toutes" },
          { key: "ACTIVE", label: "Actives" },
          { key: "PAUSED", label: "En pause" },
          { key: "COMPLETED", label: "Terminées" },
          { key: "CANCELLED", label: "Annulées" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab.key
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Chargement de vos campagnes...
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="py-16 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Aucune campagne trouvée</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Vous n&apos;avez pas de campagne correspondant à ce filtre. Lancez votre première publication dès maintenant !
            </p>
          </div>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md"
          >
            Créer une campagne
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((camp) => {
            const isTikTok = camp.platform === "TIKTOK";
            const progress = Math.min(100, Math.round((camp.completedQuantity / camp.totalQuantity) * 100));
            const isLoading = actionLoadingId === camp.id;

            return (
              <div
                key={camp.id}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all space-y-5"
              >
                {/* Header row: Platform, Action, Status & Control Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-xs text-white ${
                        isTikTok
                          ? "bg-gradient-to-tr from-pink-600 to-rose-400 shadow-md shadow-pink-500/20"
                          : "bg-gradient-to-tr from-rose-600 to-red-500 shadow-md shadow-rose-500/20"
                      }`}
                    >
                      {isTikTok ? "TT" : "YT"}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">
                          {camp.actionType === "LIKE"
                            ? "Likes"
                            : camp.actionType === "COMMENT"
                            ? "Commentaires"
                            : "Abonnements"}
                        </span>
                        <span className="text-xs text-slate-400">
                          sur @{camp.socialAccount.identifier}
                        </span>
                      </div>
                      <a
                        href={camp.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 truncate max-w-xs sm:max-w-md"
                      >
                        {camp.videoUrl}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Status Badge & Controls */}
                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {camp.status === "ACTIVE" && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    )}
                    {camp.status === "PAUSED" && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                        <Pause className="h-3 w-3" />
                        En pause
                      </span>
                    )}
                    {camp.status === "COMPLETED" && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Terminée
                      </span>
                    )}
                    {camp.status === "CANCELLED" && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Annulée ({camp.refundedPoints} pts remboursés)
                      </span>
                    )}

                    {/* Inspect completions button */}
                    <button
                      onClick={() => handleOpenInspectModal(camp.id)}
                      title="Inspecter les actions reçues et signaler"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Exécutions ({camp.completedQuantity})</span>
                    </button>

                    {/* Pause / Resume action */}
                    {(camp.status === "ACTIVE" || camp.status === "PAUSED") && (
                      <button
                        onClick={() => handleToggleStatus(camp)}
                        disabled={isLoading}
                        title={camp.status === "ACTIVE" ? "Mettre en pause" : "Réactiver"}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        {camp.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                    )}

                    {/* Cancel action */}
                    {(camp.status === "ACTIVE" || camp.status === "PAUSED") && (
                      <button
                        onClick={() => handleCancelCampaign(camp)}
                        disabled={isLoading}
                        title="Annuler la campagne et rembourser les points restants"
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Optional comment preview */}
                {camp.commentTemplate && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300">
                    <span className="text-slate-500 font-semibold block mb-0.5">Consigne de commentaire :</span>
                    « {camp.commentTemplate} »
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">
                      Progression : <strong className="text-white">{camp.completedQuantity}</strong> sur{" "}
                      <strong>{camp.totalQuantity}</strong> validés
                    </span>
                    <span className="font-bold text-indigo-400">{progress}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer metrics: daily cap + points breakdown */}
                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>
                      Distribution progressive : <strong>{camp.deliveredToday} / {camp.dailyCap}</strong> max aujourd&apos;hui
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Coins className="h-3.5 w-3.5 text-amber-400" />
                      <span>Total : <strong>{camp.totalCost} pts</strong></span>
                    </div>
                    {camp.refundedPoints > 0 && (
                      <span className="text-emerald-400 font-medium">
                        (+{camp.refundedPoints} pts remboursés)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL D'INSPECTION DES EXÉCUTIONS & SIGNALEMENT */}
      {inspectCampaignId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-400" /> Exécutions de la campagne
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vérifiez les actions reçues. Vous disposez de 24h pour signaler une action non effectuée.
                </p>
              </div>
              <button
                onClick={() => setInspectCampaignId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {inspectLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Chargement des exécutions...</div>
              ) : inspectCompletions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Aucune exécution enregistrée pour cette campagne pour l&apos;instant.
                </div>
              ) : (
                inspectCompletions.map((comp) => {
                  const isPending = comp.status === "PENDING_RETENTION";
                  const isApproved = comp.status === "APPROVED";
                  const isFlagged = comp.status === "FLAGGED";

                  return (
                    <div
                      key={comp.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              isPending
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : isApproved
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isFlagged
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {isPending
                              ? "Séquestre 24h"
                              : isApproved
                              ? "Validé / Points remis"
                              : isFlagged
                              ? "Signalé en arbitrage"
                              : comp.status}
                          </span>
                          <span className="text-slate-400">
                            {comp.submittedAt ? new Date(comp.submittedAt).toLocaleString("fr-FR") : "En cours"}
                          </span>
                        </div>

                        {comp.screenshotUrl && (
                          <div className="pt-1">
                            <a
                              href={comp.screenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
                            >
                              <Camera className="w-3.5 h-3.5" /> Voir la preuve de capture d&apos;écran
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Bouton de signalement */}
                      <div>
                        {isFlagged ? (
                          <span className="text-rose-400 font-semibold flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Signalement en cours
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setReportingCompletionId(comp.id);
                              setReportReason("");
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold flex items-center gap-1.5 transition"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" /> Signaler (Non fait)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulaire de signalement intégré */}
            {reportingCompletionId && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase">
                    <ShieldAlert className="w-4 h-4" /> Signaler cette tâche comme non réalisée
                  </h4>
                  <button
                    onClick={() => setReportingCompletionId(null)}
                    className="text-xs text-rose-400 hover:text-white"
                  >
                    Annuler
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Indiquez le motif précis (ex: &quot;Aucun like reçu sur la vidéo après vérification&quot;,
                  &quot;Commentaire absent&quot;). Les points du travailleur seront immédiatement gelés en attente de vérification admin.
                </p>
                <textarea
                  rows={2}
                  placeholder="Motif du signalement (min. 5 caractères)..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <button
                  disabled={submittingReport || reportReason.trim().length < 5}
                  onClick={handleSubmitReport}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                    submittingReport || reportReason.trim().length < 5
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                  }`}
                >
                  {submittingReport ? "Envoi du signalement..." : "Confirmer le signalement & Geler les points"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
