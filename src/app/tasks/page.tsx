"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Clock,
  Shield,
  AlertTriangle,
  Play,
  Heart,
  MessageCircle,
  UserPlus,
  Flame,
  Award,
  RefreshCw,
  Camera,
  Coins,
  ChevronRight,
  Info,
  Check,
  Copy,
} from "lucide-react";

interface QuotaInfo {
  dailyTasksCompleted: number;
  dailyTaskLimit: number;
  tasksRemainingToday: number;
  reputationScore: number;
  isReputationHealthy: boolean;
  canCompleteMoreTasks: boolean;
  daysActive: number;
}

interface TaskItem {
  taskId: string;
  campaignId: string;
  platform: "TIKTOK" | "YOUTUBE" | "INSTAGRAM";
  actionType: "LIKE" | "COMMENT" | "SUBSCRIBE";
  videoUrl: string;
  commentTemplate: string | null;
  rewardPoints: number;
  targetHandle: string;
  remainingSlots?: number;
  totalQuantity?: number;
  completedQuantity?: number;
  createdAt: string;
}

interface ActiveSession {
  completionId: string;
  taskId: string;
  videoUrl: string;
  platform: "TIKTOK" | "YOUTUBE" | "INSTAGRAM";
  actionType: "LIKE" | "COMMENT" | "SUBSCRIBE";
  commentTemplate: string | null;
  rewardPoints: number;
  minDurationSeconds: number;
  requiresScreenshot: boolean;
  startedAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  // État de la tâche en cours
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10);
  const [hasOpenedLink, setHasOpenedLink] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (platformFilter !== "ALL") params.append("platform", platformFilter);
      if (actionFilter !== "ALL") params.append("actionType", actionFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setQuota(data.quota);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [platformFilter, actionFilter]);

  // Gestion du chronomètre 10 secondes lorsque la session active change
  useEffect(() => {
    if (activeSession) {
      setSecondsRemaining(activeSession.minDurationSeconds || 10);
      setHasOpenedLink(false);
      setScreenshotUrl("");
      setCopiedTemplate(false);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  const handleStartTask = async (task: TaskItem) => {
    setStartingTaskId(task.taskId);
    setFeedback(null);

    try {
      const res = await fetch(`/api/tasks/${task.taskId}/start`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Impossible de démarrer la tâche." });
      } else {
        setActiveSession({
          completionId: data.completionId,
          taskId: data.taskId,
          videoUrl: data.videoUrl,
          platform: data.platform,
          actionType: data.actionType,
          commentTemplate: data.commentTemplate,
          rewardPoints: data.rewardPoints,
          minDurationSeconds: data.minDurationSeconds,
          requiresScreenshot: data.requiresScreenshot,
          startedAt: data.startedAt,
        });
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur réseau lors du démarrage de la tâche." });
    } finally {
      setStartingTaskId(null);
    }
  };

  const handleOpenVideo = () => {
    if (activeSession) {
      window.open(activeSession.videoUrl, "_blank", "noopener,noreferrer");
      setHasOpenedLink(true);
    }
  };

  const handleSubmitTask = async () => {
    if (!activeSession) return;
    if (secondsRemaining > 0) {
      setFeedback({
        type: "error",
        text: `Veuillez patienter encore ${secondsRemaining}s sur la publication avant de valider.`,
      });
      return;
    }

    if (activeSession.requiresScreenshot && !screenshotUrl.trim()) {
      setFeedback({
        type: "error",
        text: "Cette tâche fait l'objet d'un contrôle de conformité : veuillez fournir l'URL de votre capture d'écran.",
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/tasks/${activeSession.taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completionId: activeSession.completionId,
          screenshotUrl: screenshotUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Échec de validation de la tâche." });
      } else {
        setFeedback({
          type: "success",
          text: `Bravo ! Votre tâche est validée. +${activeSession.rewardPoints} points ont été directement crédités à votre solde !`,
        });
        setActiveSession(null);
        await fetchTasks();
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur de communication avec le serveur." });
    } finally {
      setSubmitting(false);
    }
  };

  const copyComment = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case "LIKE":
        return { label: "J'aime la vidéo", icon: Heart, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
      case "COMMENT":
        return { label: "Commenter la vidéo", icon: MessageCircle, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" };
      case "SUBSCRIBE":
        return { label: "S'abonner au créateur", icon: UserPlus, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      default:
        return { label: type, icon: Play, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Titre & Stratégie Cognitive */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Échange P2P Réel
              </span>
              <span className="text-xs text-slate-400">100% Manuel • Zéro bot</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-white">
              Gagner des points d&apos;engagement
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Interagissez avec les publications d&apos;autres créateurs vérifiés. Vos points sont garantis et crédités
              sur votre solde pour propulser vos propres vidéos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchTasks()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-sm font-medium transition"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition"
            >
              <Coins className="w-4 h-4" /> Dépenser mes points
            </Link>
          </div>
        </div>

        {/* Message d'alerte global (Succès / Erreur) */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 transition ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            )}
            <p className="text-sm font-medium leading-relaxed">{feedback.text}</p>
          </div>
        )}

        {/* Indicateurs de Réputation et de Quota Quotidien */}
        {quota && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Jauge Quota Quotidien */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" /> Quota du jour
                </span>
                <span className="text-xs font-bold text-slate-300">
                  {quota.dailyTasksCompleted} / {quota.dailyTaskLimit} effectuées
                </span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (quota.dailyTasksCompleted / Math.max(1, quota.dailyTaskLimit)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {quota.tasksRemainingToday > 0 ? (
                  <span>
                    Il vous reste <strong className="text-amber-400">{quota.tasksRemainingToday}</strong> tâche(s)
                    possible(s) aujourd&apos;hui.
                  </span>
                ) : (
                  <span className="text-rose-400 font-semibold">Plafond quotidien atteint. Revenez demain !</span>
                )}
              </p>
            </div>

            {/* Score de Réputation */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" /> Réputation P2P
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    quota.reputationScore >= 90
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : quota.reputationScore >= 70
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {quota.reputationScore.toFixed(0)} / 100
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-2">
                {quota.reputationScore >= 90
                  ? "Créateur exemplaire"
                  : quota.reputationScore >= 70
                  ? "Profil d'engagement actif"
                  : "Attention : risque de suspension (< 50)"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Chaque tâche validée renforce votre indice et débloque un quota journalier supérieur.
              </p>
            </div>

            {/* Période de Séquestre 24h & Sécurité */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" /> Séquestre anti-fraude
                </span>
                <span className="text-xs font-medium text-slate-400">Rétention 24h</span>
              </div>
              <p className="text-sm font-semibold text-white mt-2">Points garantis</p>
              <p className="text-xs text-slate-400 mt-1">
                Pour protéger les créateurs contre le désabonnement immédiat, vos points sont automatiquement libérés
                après 24h.
              </p>
            </div>
          </div>
        )}

        {/* MODAL / CONSOLE ACTIVE D'EXÉCUTION DE TÂCHE */}
        {activeSession && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
              {/* En-tête session */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                      activeSession.platform === "TIKTOK"
                        ? "bg-slate-800 text-rose-400 border border-rose-500/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}
                  >
                    {activeSession.platform === "TIKTOK" ? "TT" : "YT"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {getActionLabel(activeSession.actionType).label}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Sur la publication officielle de la campagne • Gain promis :{" "}
                      <span className="text-emerald-400 font-bold">+{activeSession.rewardPoints} points</span>
                    </p>
                  </div>
                </div>

                {/* Minuteur 10s */}
                <div
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border ${
                    secondsRemaining > 0
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  }`}
                >
                  <span className="text-lg font-extrabold leading-none">{secondsRemaining}</span>
                  <span className="text-[10px] uppercase font-semibold">sec</span>
                </div>
              </div>

              {/* Étape 1 : Ouvrir la vidéo */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                      1
                    </span>{" "}
                    Ouvrez la vidéo dans un nouvel onglet
                  </span>
                  {hasOpenedLink && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Lien ouvert
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Regardez la vidéo et effectuez l&apos;action demandée avec votre compte authentique.
                </p>
                <button
                  onClick={handleOpenVideo}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition border border-slate-700"
                >
                  <ExternalLink className="w-4 h-4 text-indigo-400" />
                  Ouvrir la publication {activeSession.platform === "TIKTOK" ? "TikTok" : "YouTube"}
                </button>
              </div>

              {/* Si Commentaire spécifique demandé */}
              {activeSession.actionType === "COMMENT" && activeSession.commentTemplate && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4" /> Modèle de commentaire suggéré
                    </span>
                    <button
                      onClick={() => copyComment(activeSession.commentTemplate!)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
                    >
                      {copiedTemplate ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copier
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm bg-slate-950/80 p-2.5 rounded-xl border border-indigo-900/50 font-mono text-slate-200">
                    &ldquo;{activeSession.commentTemplate}&rdquo;
                  </p>
                </div>
              )}

              {/* Étape 2 : Contrôle Aléatoire 10% avec Capture si demandé */}
              {activeSession.requiresScreenshot && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                    <Camera className="w-4 h-4" /> Contrôle aléatoire de conformité (10%)
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Cette tâche a été sélectionnée par le système anti-fraude. Veuillez fournir une capture d&apos;écran
                    prouvant votre action (ex: hébergée sur Imgur, Lightshot ou URL directe).
                  </p>
                  <input
                    type="url"
                    placeholder="https://i.imgur.com/exemple.png"
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Étape 3 : Validation de la tâche */}
              <div className="space-y-3 pt-2">
                <button
                  disabled={
                    secondsRemaining > 0 ||
                    submitting ||
                    (activeSession.requiresScreenshot && !screenshotUrl.trim())
                  }
                  onClick={handleSubmitTask}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition ${
                    secondsRemaining > 0 ||
                    (activeSession.requiresScreenshot && !screenshotUrl.trim())
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 cursor-pointer"
                  }`}
                >
                  {submitting ? (
                    "Validation en cours..."
                  ) : secondsRemaining > 0 ? (
                    `Patientez encore ${secondsRemaining}s sur la publication...`
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Valider l&apos;action & Réclamer +{activeSession.rewardPoints} points
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveSession(null)}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-300 py-2 transition"
                >
                  Fermer sans valider (la tâche sera réattribuée)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barre de Filtres de Recherche */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtre Réseau */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setPlatformFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  platformFilter === "ALL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Tous les réseaux
              </button>
              <button
                onClick={() => setPlatformFilter("TIKTOK")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  platformFilter === "TIKTOK" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                TikTok
              </button>
              <button
                onClick={() => setPlatformFilter("YOUTUBE")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  platformFilter === "YOUTUBE" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                YouTube
              </button>
              <button
                onClick={() => setPlatformFilter("INSTAGRAM")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  platformFilter === "INSTAGRAM"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Instagram
              </button>
            </div>

            {/* Filtre Action */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setActionFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  actionFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Toutes actions
              </button>
              <button
                onClick={() => setActionFilter("LIKE")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  actionFilter === "LIKE" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Likes
              </button>
              <button
                onClick={() => setActionFilter("COMMENT")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  actionFilter === "COMMENT" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Commentaires
              </button>
              <button
                onClick={() => setActionFilter("SUBSCRIBE")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  actionFilter === "SUBSCRIBE" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Abonnements
              </button>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            <strong className="text-slate-200">{tasks.length}</strong> tâche(s) disponible(s)
          </span>
        </div>

        {/* Liste des Tâches Disponibles */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Recherche des tâches disponibles...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Aucune tâche disponible pour l&apos;instant</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Toutes les tâches actuelles ont été accomplies ou vous avez déjà participé aux campagnes actives. Revenez
              très vite ou lancez votre propre campagne !
            </p>
            <div className="pt-2">
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
              >
                Lancer une campagne de visibilité
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tasks.map((task) => {
              const actionMeta = getActionLabel(task.actionType);
              const ActionIcon = actionMeta.icon;

              return (
                <div
                  key={task.taskId}
                  className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Badge réseau & Action */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 ${
                          task.platform === "TIKTOK"
                            ? "bg-slate-800 text-rose-400 border border-rose-500/20"
                            : task.platform === "INSTAGRAM"
                            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border border-pink-500/30"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}
                      >
                        {task.platform === "TIKTOK" ? "TikTok" : task.platform === "INSTAGRAM" ? "Instagram" : "YouTube"}
                      </span>

                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1">
                        +{task.rewardPoints} pts
                      </span>
                    </div>

                    {/* Titre / Action */}
                    <div>
                      <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
                        <ActionIcon className="w-4 h-4 text-indigo-400" />
                        <span>{actionMeta.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Créateur : <strong className="text-slate-300">@{task.targetHandle}</strong>
                      </p>
                    </div>

                    {/* Aperçu commentaire éventuel */}
                    {task.commentTemplate && (
                      <div className="text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-slate-400 italic line-clamp-2">
                        &ldquo;{task.commentTemplate}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Bouton d'action */}
                  <div className="pt-2 border-t border-slate-800/60">
                    <button
                      disabled={startingTaskId === task.taskId || Boolean(quota && !quota.canCompleteMoreTasks)}
                      onClick={() => handleStartTask(task)}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition ${
                        quota && !quota.canCompleteMoreTasks
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 group-hover:scale-[1.02]"
                      }`}
                    >
                      {startingTaskId === task.taskId ? (
                        "Réservation..."
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" /> Faire la tâche (+{task.rewardPoints} pts)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
