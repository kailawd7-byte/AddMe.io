"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Play,
  Pause,
  XCircle,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Eye,
  X,
  Pencil,
} from "lucide-react";
import NumberStepper from "@/components/NumberStepper";

interface CompletionDetail {
  id: string;
  workerUserId: string;
  workerName?: string;
  workerEmailMasked?: string | null;
  workerHandle?: string | null;
  workerReputation?: number;
  rewardPoints?: number;
  actionType?: string;
  platform?: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  screenshotUrl?: string | null;
}

interface CampaignItem {
  id: string;
  platform: "TIKTOK" | "YOUTUBE" | "INSTAGRAM";
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
  socialAccount?: {
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
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Inspection des exécutions
  const [inspectCampaignId, setInspectCampaignId] = useState<string | null>(null);
  const [inspectCompletions, setInspectCompletions] = useState<CompletionDetail[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Signalement
  const [reportingCompletionId, setReportingCompletionId] = useState<string | null>(
    null
  );
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // Modification de campagne
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
  const [editPoints, setEditPoints] = useState<number>(1);
  const [editQuantity, setEditQuantity] = useState<number>(10);
  const [editDailyCap, setEditDailyCap] = useState<number>(10);
  const [editCommentTemplate, setEditCommentTemplate] = useState<string>("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleOpenEdit = (campaign: CampaignItem) => {
    setEditingCampaign(campaign);
    setEditPoints(campaign.rewardPerUnit);
    setEditQuantity(campaign.totalQuantity);
    setEditDailyCap(campaign.dailyCap || 10);
    setEditCommentTemplate(campaign.commentTemplate || "");
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    setEditSubmitting(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardPerWorker: editPoints,
          totalQuantity: editQuantity,
          dailyCap: editDailyCap,
          commentTemplate: editCommentTemplate.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Impossible de modifier la campagne.");
      } else {
        setFeedback({ type: "success", text: data.message });
        setEditingCampaign(null);
        await fetchCampaigns();
      }
    } catch {
      setEditError("Erreur réseau lors de la modification.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
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
        setFeedback({
          type: "error",
          text: data.error || "Erreur lors de la mise à jour.",
        });
      } else {
        setFeedback({ type: "success", text: data.message });
        await fetchCampaigns();
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur réseau." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelCampaign = async (campaignId: string) => {
    if (
      !confirm(
        "Annuler cette campagne ? Les points des actions non effectuées vous seront immédiatement remboursés."
      )
    ) {
      return;
    }

    setActionLoadingId(campaignId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Impossible d'annuler la campagne.",
        });
      } else {
        setFeedback({ type: "success", text: data.message });
        await fetchCampaigns();
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur réseau." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleInspect = async (campaignId: string) => {
    setInspectCampaignId(campaignId);
    setInspectLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        const extractedCompletions =
          data.completions ||
          (data.campaign?.tasks || []).flatMap((t: any) => t.completions || []);
        setInspectCompletions(extractedCompletions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingCompletionId || !reportReason.trim()) return;
    setSubmittingReport(true);

    try {
      const res = await fetch(`/api/tasks/${reportingCompletionId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Erreur lors du signalement.",
        });
      } else {
        setFeedback({ type: "success", text: data.message });
        setReportingCompletionId(null);
        setReportReason("");
        if (inspectCampaignId) await handleInspect(inspectCampaignId);
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur réseau." });
    } finally {
      setSubmittingReport(false);
    }
  };

  const filteredCampaigns =
    filter === "ALL"
      ? campaigns
      : campaigns.filter((c) => c.status === filter);

  const formatAction = (action: string) => {
    if (action === "LIKE") return "Like";
    if (action === "COMMENT") return "Commentaire";
    return "Abonnement";
  };

  return (
    <div className="flex-1 max-w-[1100px] w-full mx-auto px-6 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-[#12122A] m-0 tracking-tight">
            Mes campagnes
          </h1>
          <p className="text-sm text-[#5A5A70] mt-0.5">
            Suivez la progression de vos publications et gérez vos budgets de
            points.
          </p>
        </div>

        <Link href="/campaigns/new" className="addme-btn addme-btn-primary">
          <Plus className="h-4 w-4" />
          <span>Nouvelle campagne</span>
        </Link>
      </div>

      {/* Filtres Chips */}
      <div className="flex flex-wrap items-center gap-2.5">
        {[
          { id: "ALL", label: "Toutes" },
          { id: "ACTIVE", label: "En cours" },
          { id: "PAUSED", label: "En pause" },
          { id: "COMPLETED", label: "Terminées" },
          { id: "CANCELLED", label: "Annulées" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`addme-chip ${filter === item.id ? "on" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Liste des campagnes */}
      <div className="addme-card-static">
        {loading ? (
          <div className="py-12 text-center text-[#5A5A70]">
            <div className="h-8 w-8 border-3 border-[#5B3DF5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Chargement de vos campagnes...
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <b className="text-base font-bold text-[#12122A] block">
              Aucune campagne trouvée
            </b>
            <p className="text-sm text-[#5A5A70]">
              Lancez une campagne sur une de vos vidéos TikTok, Instagram ou
              YouTube pour recevoir de l’engagement réel.
            </p>
            <Link
              href="/campaigns/new"
              className="addme-btn addme-btn-primary text-xs"
            >
              Créer une campagne
            </Link>
          </div>
        ) : (
          <div>
            {filteredCampaigns.map((camp, idx) => {
              const pct = Math.min(
                100,
                Math.round(
                  ((camp.completedQuantity || 0) /
                    Math.max(1, camp.totalQuantity)) *
                    100
                )
              );
              const shortCode =
                camp.platform === "TIKTOK"
                  ? "TT"
                  : camp.platform === "INSTAGRAM"
                  ? "IG"
                  : "YT";
              const isBusy = actionLoadingId === camp.id;

              return (
                <div
                  key={camp.id}
                  className="p-4 sm:p-5 rounded-2xl border border-[#E3E3EE] dark:border-[#26243A] bg-white/70 dark:bg-[#151426] backdrop-blur-md space-y-3.5 transition-all mb-3.5 last:mb-0 shadow-xs"
                >
                  {/* En-tête : Miniature + Titre & Profil + Badge Statut */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="addme-thumb shrink-0 !w-11 !h-11 !rounded-xl !text-xs font-black">
                        {shortCode}
                      </div>
                      <div className="min-w-0">
                        <b className="block text-sm sm:text-base font-bold text-[#12122A] dark:text-white truncate">
                          Campagne #{idx + 1} · @{camp.socialAccount?.identifier || "profil"}
                        </b>
                        <div className="flex items-center gap-2 text-xs text-[#5A5A70] dark:text-[#A3A1BD] mt-0.5">
                          <span className="font-semibold text-[#5B3DF5] dark:text-[#A38EFF]">
                            {camp.platform} · {formatAction(camp.actionType)}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {camp.rewardPerUnit} pt/action
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        camp.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : camp.status === "PAUSED"
                          ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          : "bg-[#F7F7FB] text-[#5A5A70] dark:bg-[#1B1A26] dark:text-[#A3A1BD] border border-[#E3E3EE] dark:border-[#2E2C48]"
                      }`}
                    >
                      {camp.status === "ACTIVE"
                        ? "Active"
                        : camp.status === "PAUSED"
                        ? "En pause"
                        : camp.status === "COMPLETED"
                        ? "Terminée"
                        : "Annulée"}
                    </span>
                  </div>

                  {/* Barre de progression & Métriques complètes */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5A5A70] dark:text-[#A3A1BD]">
                        Budget : <strong className="text-[#12122A] dark:text-white font-bold">{camp.totalCost} pts</strong>
                      </span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-[#12122A] dark:text-white">{camp.completedQuantity} / {camp.totalQuantity}</span>
                        <span className="text-[#5B3DF5] dark:text-[#A38EFF]">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E3E3EE] dark:bg-[#2A2744] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#5B3DF5] to-[#EC4899] rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Lien Publication & Boutons d'Action */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E3E3EE] dark:border-[#26243A]">
                    <a
                      href={camp.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#5B3DF5] dark:text-[#A38EFF] hover:underline font-semibold"
                    >
                      <span>Voir la publication</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspect(camp.id)}
                        className="addme-btn addme-btn-ghost !py-1.5 !px-3 !text-xs !min-h-[34px]"
                        title="Voir les exécutions"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#5B3DF5] dark:text-[#A38EFF]" />
                        <span>Détails</span>
                      </button>

                      {(camp.status === "ACTIVE" || camp.status === "PAUSED") && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleOpenEdit(camp)}
                            className="addme-btn addme-btn-ghost !py-1.5 !px-3 !text-xs !min-h-[34px] text-[#5B3DF5] dark:text-[#A38EFF] hover:border-[#5B3DF5]"
                            title="Modifier la campagne"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Modifier</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleStatus(camp)}
                            className="addme-btn addme-btn-ghost !py-1.5 !px-2.5 !text-xs !min-h-[34px]"
                            title={
                              camp.status === "ACTIVE"
                                ? "Mettre en pause"
                                : "Reprendre"
                            }
                          >
                            {camp.status === "ACTIVE" ? (
                              <Pause className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleCancelCampaign(camp.id)}
                            className="addme-btn addme-btn-ghost !py-1.5 !px-2.5 !text-xs !min-h-[34px] text-rose-600 dark:text-rose-400 hover:border-rose-300"
                            title="Annuler et rembourser le solde restant"
                          >
                            <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal d'inspection des exécutions */}
      {inspectCampaignId && (
        <div className="fixed inset-0 z-50 bg-[#12122A]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="addme-card-static max-w-2xl w-full space-y-4 max-h-[85vh] overflow-y-auto">
            {(() => {
              const inspectedCamp = campaigns.find(
                (c) => c.id === inspectCampaignId
              );
              return (
                <div className="flex items-start justify-between border-b border-[#E3E3EE] dark:border-[#26243A] pb-3 gap-3">
                  <div>
                    <b className="text-lg font-extrabold text-[#12122A] dark:text-white block">
                      Historique des interactions reçues
                    </b>
                    {inspectedCamp && (
                      <span className="text-xs text-[#5A5A70] dark:text-[#A3A1BD]">
                        {inspectedCamp.platform} ·{" "}
                        {formatAction(inspectedCamp.actionType)} (@
                        {inspectedCamp.socialAccount?.identifier || "profil"}) •{" "}
                        <strong className="text-[#5B3DF5] dark:text-[#A38EFF]">
                          {inspectedCamp.completedQuantity} /{" "}
                          {inspectedCamp.totalQuantity} action
                          {inspectedCamp.totalQuantity > 1 ? "s" : ""} réalisée
                          {inspectedCamp.completedQuantity > 1 ? "s" : ""}
                        </strong>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectCampaignId(null);
                      setReportingCompletionId(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-[#F7F7FB] dark:hover:bg-[#1C1B2E] transition-colors"
                  >
                    <X className="h-5 w-5 text-[#5A5A70] dark:text-[#A3A1BD]" />
                  </button>
                </div>
              );
            })()}

            {inspectLoading ? (
              <div className="py-8 text-center text-sm text-[#5A5A70] dark:text-[#A3A1BD]">
                Chargement de l’historique des interactions...
              </div>
            ) : inspectCompletions.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#5A5A70] dark:text-[#A3A1BD]">
                Aucune exécution enregistrée pour le moment.
              </div>
            ) : (
              <div className="space-y-2.5">
                {inspectCompletions.map((comp, index) => {
                  const inspectedCamp = campaigns.find(
                    (c) => c.id === inspectCampaignId
                  );
                  const pts =
                    comp.rewardPoints ?? inspectedCamp?.rewardPerUnit ?? 1;
                  const statusLabel =
                    comp.status === "APPROVED" ||
                    comp.status === "PENDING_RETENTION"
                      ? "✓ Validé · Points crédités"
                      : comp.status === "IN_PROGRESS"
                      ? "⏳ En cours d’exécution"
                      : comp.status === "FLAGGED"
                      ? "⚠️ Litige signalé"
                      : comp.status;

                  const statusStyle =
                    comp.status === "APPROVED" ||
                    comp.status === "PENDING_RETENTION"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : comp.status === "IN_PROGRESS"
                      ? "bg-[#EEEAFF] text-[#3A22C8] border-[#D9D2FF] dark:bg-[#5B3DF5]/20 dark:text-[#A38EFF] dark:border-[#5B3DF5]/40"
                      : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";

                  return (
                    <div
                      key={comp.id}
                      className="p-4 rounded-xl bg-[#F7F7FB] dark:bg-[#1C1B2E] border border-[#E3E3EE] dark:border-[#26243A] flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-[#EEEAFF] dark:bg-[#5B3DF5]/20 text-[#5B3DF5] dark:text-[#A38EFF] font-extrabold text-xs flex items-center justify-center shrink-0 border border-[#D9D2FF] dark:border-[#5B3DF5]/40">
                          #{index + 1}
                        </div>

                        <div className="text-xs min-w-0">
                          <div className="font-bold text-[#12122A] dark:text-white flex flex-wrap items-center gap-2">
                            <span>
                              {comp.workerHandle
                                ? `@${comp.workerHandle}`
                                : comp.workerName ||
                                  `Membre #${comp.workerUserId.slice(0, 6)}`}
                            </span>
                            {comp.workerEmailMasked && (
                              <span className="text-[11px] font-normal text-[#5A5A70] dark:text-[#A3A1BD]">
                                ({comp.workerEmailMasked})
                              </span>
                            )}
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusStyle}`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <div className="text-[#5A5A70] dark:text-[#A3A1BD] mt-1 flex flex-wrap items-center gap-2">
                            <span>
                              {comp.submittedAt
                                ? `Validé le ${new Date(
                                    comp.submittedAt
                                  ).toLocaleString("fr-FR")}`
                                : `Démarré le ${new Date(
                                    comp.startedAt
                                  ).toLocaleString("fr-FR")}`}
                            </span>
                            <span>•</span>
                            <span className="font-extrabold text-[#5B3DF5] dark:text-[#A38EFF]">
                              +{pts} pt{pts > 1 ? "s" : ""} reçu
                              {pts > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      {comp.status !== "FLAGGED" &&
                        comp.status !== "IN_PROGRESS" && (
                          <button
                            type="button"
                            onClick={() => setReportingCompletionId(comp.id)}
                            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline shrink-0"
                          >
                            Signaler un litige
                          </button>
                        )}
                    </div>
                  );
                })}
              </div>
            )}

            {reportingCompletionId && (
              <form
                onSubmit={handleSubmitReport}
                className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-3"
              >
                <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Motif du signalement (ex: action non visible sur ma publication)
                </div>
                <input
                  type="text"
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Expliquez brièvement le problème..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#17162A] border border-rose-300 dark:border-rose-800 text-xs text-[#12122A] dark:text-white placeholder-[#5A5A70] dark:placeholder-[#A3A1BD] focus:outline-none focus:border-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportingCompletionId(null)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[#5A5A70] dark:text-[#A3A1BD] hover:bg-[#F7F7FB] dark:hover:bg-[#1C1B2E]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                  >
                    Envoyer le signalement
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Modification de Campagne */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#151426] border border-[#E3E3EE] dark:border-[#2E2C48] shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-[#E3E3EE] dark:border-[#26243A] pb-3">
              <div>
                <b className="text-base sm:text-lg font-extrabold text-[#12122A] dark:text-white block">
                  Modifier la campagne
                </b>
                <span className="text-xs text-[#5A5A70] dark:text-[#A3A1BD]">
                  {editingCampaign.platform} · @{editingCampaign.socialAccount?.identifier || "profil"} ({editingCampaign.actionType})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="p-1.5 rounded-lg text-[#5A5A70] dark:text-[#A3A1BD] hover:bg-[#F7F7FB] dark:hover:bg-[#1F1E33] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Points offerts par action */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#12122A] dark:text-white uppercase tracking-wider">
                    Points offerts par action
                  </label>
                  <span className="text-xs font-extrabold text-[#5B3DF5] dark:text-[#A38EFF]">
                    Actuel : {editingCampaign.rewardPerUnit} pt(s)
                  </span>
                </div>
                <NumberStepper
                  value={editPoints}
                  onChange={setEditPoints}
                  min={0.5}
                  max={100}
                  step={0.5}
                  suffix="pts / action"
                />
                <p className="text-[11px] text-[#5A5A70] dark:text-[#A3A1BD] mt-1">
                  Augmenter les points place votre campagne en tête de liste des créateurs.
                </p>
              </div>

              {/* Nombre de personnes uniques */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#12122A] dark:text-white uppercase tracking-wider">
                    Nombre total de personnes uniques
                  </label>
                  <span className="text-xs font-semibold text-[#5A5A70] dark:text-[#A3A1BD]">
                    Déjà livrées : <strong>{editingCampaign.completedQuantity}</strong>
                  </span>
                </div>
                <NumberStepper
                  value={editQuantity}
                  onChange={setEditQuantity}
                  min={Math.max(1, editingCampaign.completedQuantity)}
                  max={100000}
                  step={1}
                  suffix="personnes"
                />
                <p className="text-[11px] text-[#5A5A70] dark:text-[#A3A1BD] mt-1">
                  Vous pouvez augmenter le volume ou le réduire jusqu&apos;au nombre d&apos;actions déjà livrées.
                </p>
              </div>

              {/* Cadence quotidienne */}
              <div>
                <label className="block text-xs font-bold text-[#12122A] dark:text-white uppercase tracking-wider mb-1.5">
                  Rythme maximum par jour
                </label>
                <NumberStepper
                  value={editDailyCap}
                  onChange={setEditDailyCap}
                  min={1}
                  max={10000}
                  step={1}
                  suffix="actions / 24h"
                />
              </div>

              {/* Commentaire si applicable */}
              {editingCampaign.actionType === "COMMENT" && (
                <div>
                  <label className="block text-xs font-bold text-[#12122A] dark:text-white uppercase tracking-wider mb-1.5">
                    Orientation du commentaire
                  </label>
                  <input
                    type="text"
                    value={editCommentTemplate}
                    onChange={(e) => setEditCommentTemplate(e.target.value)}
                    placeholder="Ex: Donnez votre avis sincère sur le produit..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7FB] dark:bg-[#17162A] border border-[#CFCFE0] dark:border-[#383556] text-xs text-[#12122A] dark:text-white focus:outline-none focus:border-[#5B3DF5]"
                  />
                </div>
              )}

              {/* Bilan financier en direct */}
              {(() => {
                const completed = editingCampaign.completedQuantity || 0;
                const rem = Math.max(0, editQuantity - completed);
                const oldRem = Math.max(0, editingCampaign.totalQuantity - completed);
                const oldC = Number((oldRem * editingCampaign.rewardPerUnit).toFixed(2));
                const newC = Number((rem * editPoints).toFixed(2));
                const diff = Number((newC - oldC).toFixed(2));

                return (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      diff > 0
                        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                        : diff < 0
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                        : "bg-[#F7F7FB] dark:bg-[#1C1B2E] border-[#E3E3EE] dark:border-[#383556] text-[#5A5A70] dark:text-[#A3A1BD]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Actions restantes à exécuter :</span>
                      <span>{rem} action(s)</span>
                    </div>
                    <div className="flex items-center justify-between font-bold">
                      <span>Ajustement de solde :</span>
                      <span className="text-sm">
                        {diff > 0
                          ? `-${diff} pts (débit requis)`
                          : diff < 0
                          ? `+${Math.abs(diff)} pts (remboursement immédiat)`
                          : "0 pt (aucun impact)"}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E3E3EE] dark:border-[#26243A]">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#5A5A70] dark:text-[#A3A1BD] hover:bg-[#F7F7FB] dark:hover:bg-[#1C1B2E] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="addme-btn addme-btn-primary !py-2 !px-5 !text-xs font-bold"
                >
                  {editSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
