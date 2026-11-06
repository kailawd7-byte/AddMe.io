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
} from "lucide-react";

interface CompletionDetail {
  id: string;
  workerUserId: string;
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
        setInspectCompletions(data.completions || []);
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
                <div key={camp.id} className="addme-row">
                  <div className="addme-thumb">{shortCode}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-base font-bold text-[#12122A]">
                        Campagne #{idx + 1} · @{camp.socialAccount?.identifier || "profil"}
                      </b>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          camp.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : camp.status === "PAUSED"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-[#F7F7FB] text-[#5A5A70] border border-[#E3E3EE]"
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

                    <div className="text-xs text-[#5A5A70] flex flex-wrap items-center gap-2 mt-1">
                      <span>
                        {camp.platform} · {formatAction(camp.actionType)}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-[#5B3DF5]">
                        {camp.rewardPerUnit} pt/action
                      </span>
                      <span>•</span>
                      <span>Budget : {camp.totalCost} pts</span>
                      <a
                        href={camp.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#5B3DF5] hover:underline font-semibold"
                      >
                        <span>Voir la publication</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-[#12122A]">
                        {camp.completedQuantity} / {camp.totalQuantity}
                      </div>
                      <div className="text-[11px] text-[#5A5A70]">{pct}% livré</div>
                    </div>
                    <i className="block w-[110px] h-2 rounded-full bg-[#E3E3EE] overflow-hidden">
                      <b
                        className="block h-full bg-[#5B3DF5] rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </i>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleInspect(camp.id)}
                      className="addme-btn addme-btn-ghost py-2 px-3 text-xs"
                      title="Voir les exécutions"
                    >
                      <Eye className="h-4 w-4 text-[#5B3DF5]" />
                      <span>Détails</span>
                    </button>

                    {(camp.status === "ACTIVE" || camp.status === "PAUSED") && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleStatus(camp)}
                          className="addme-btn addme-btn-ghost py-2 px-3 text-xs"
                          title={
                            camp.status === "ACTIVE"
                              ? "Mettre en pause"
                              : "Reprendre"
                          }
                        >
                          {camp.status === "ACTIVE" ? (
                            <Pause className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Play className="h-4 w-4 text-emerald-600" />
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleCancelCampaign(camp.id)}
                          className="addme-btn addme-btn-ghost py-2 px-3 text-xs text-rose-600 hover:border-rose-300"
                          title="Annuler et rembourser le solde restant"
                        >
                          <XCircle className="h-4 w-4 text-rose-600" />
                        </button>
                      </>
                    )}
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
          <div className="addme-card-static max-w-xl w-full space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E3E3EE] pb-3">
              <b className="text-lg font-extrabold text-[#12122A]">
                Historique des interactions reçues
              </b>
              <button
                type="button"
                onClick={() => setInspectCampaignId(null)}
                className="p-1.5 rounded-lg hover:bg-[#F7F7FB]"
              >
                <X className="h-5 w-5 text-[#5A5A70]" />
              </button>
            </div>

            {inspectLoading ? (
              <div className="py-8 text-center text-sm text-[#5A5A70]">
                Chargement...
              </div>
            ) : inspectCompletions.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#5A5A70]">
                Aucune exécution enregistrée pour le moment.
              </div>
            ) : (
              <div className="space-y-2">
                {inspectCompletions.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3.5 rounded-xl bg-[#F7F7FB] border border-[#E3E3EE] flex items-center justify-between gap-3"
                  >
                    <div className="text-xs">
                      <div className="font-bold text-[#12122A]">
                        Membre #{comp.workerUserId.slice(0, 6)} •{" "}
                        <span className="text-emerald-600">{comp.status}</span>
                      </div>
                      <div className="text-[#5A5A70] mt-0.5">
                        Validé le{" "}
                        {new Date(
                          comp.submittedAt || comp.startedAt
                        ).toLocaleString("fr-FR")}
                      </div>
                    </div>

                    {comp.status !== "FLAGGED" && (
                      <button
                        type="button"
                        onClick={() => setReportingCompletionId(comp.id)}
                        className="text-xs font-bold text-rose-600 hover:underline"
                      >
                        Signaler un litige
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {reportingCompletionId && (
              <form
                onSubmit={handleSubmitReport}
                className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3"
              >
                <div className="text-xs font-bold text-rose-900">
                  Motif du signalement (ex: action non visible sur ma publication)
                </div>
                <input
                  type="text"
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Expliquez brièvement le problème..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-rose-300 text-xs text-[#12122A]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportingCompletionId(null)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[#5A5A70]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                  >
                    Envoyer le signalement
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
