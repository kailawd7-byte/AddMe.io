"use client";

import { useEffect, useState, useRef } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Clock,
  AlertTriangle,
  RefreshCw,
  Camera,
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
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  // Session de tâche active (Chronomètre 10s)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(10);
  const [hasOpenedLink, setHasOpenedLink] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBalanceAndTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (platformFilter !== "ALL") params.append("platform", platformFilter);
      if (actionFilter !== "ALL") params.append("actionType", actionFilter);

      const [tasksRes, meRes] = await Promise.all([
        fetch(`/api/tasks?${params.toString()}`),
        fetch("/api/auth/me"),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
        setQuota(data.quota || null);
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.user) {
          setBalance(meData.user.balance ?? 0);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceAndTasks();
  }, [platformFilter, actionFilter]);

  // Chronomètre 10 secondes
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
        setFeedback({
          type: "error",
          text: data.error || "Impossible de démarrer cette tâche.",
        });
      } else {
        setActiveSession(data.session);
        // Ouverture automatique de la publication dans un nouvel onglet
        window.open(task.videoUrl, "_blank", "noopener,noreferrer");
        setHasOpenedLink(true);
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Erreur réseau lors du démarrage de la tâche.",
      });
    } finally {
      setStartingTaskId(null);
    }
  };

  const handleSubmitTask = async () => {
    if (!activeSession) return;
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
        setFeedback({
          type: "error",
          text: data.error || "Validation refusée.",
        });
      } else {
        setFeedback({
          type: "success",
          text:
            data.message ||
            `+${activeSession.rewardPoints} points crédités immédiatement à votre solde !`,
        });
        setActiveSession(null);
        await fetchBalanceAndTasks();
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Erreur réseau lors de la validation.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyCommentTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const formatPlatform = (platform: string) => {
    if (platform === "TIKTOK") return "TikTok";
    if (platform === "INSTAGRAM") return "Instagram";
    return "YouTube";
  };

  const formatAction = (action: string) => {
    if (action === "LIKE") return "Like";
    if (action === "COMMENT") return "Commentaire";
    return "Abonnement";
  };

  return (
    <div className="flex-1 max-w-[1100px] w-full mx-auto px-6 py-8 space-y-5">
      {/* En-tête : Titre + Carte Solde (Style exact Taches.dc.html) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-[#12122A] m-0 tracking-tight">
            Gagner des points
          </h1>
          {quota && (
            <p className="text-xs text-[#5A5A70] mt-0.5">
              Quota du jour : {quota.dailyTasksCompleted} / {quota.dailyTaskLimit} tâches •{" "}
              1 seule action par publication • Crédit direct
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchBalanceAndTasks}
            className="addme-btn addme-btn-ghost py-2.5 px-3.5 text-xs"
            title="Actualiser la liste"
          >
            <RefreshCw className="h-4 w-4 text-[#5A5A70]" />
            <span>Actualiser</span>
          </button>

          <span className="addme-card-static py-2.5 px-5 inline-flex items-center gap-2">
            <span className="text-xs text-[#5A5A70] font-medium">Solde :</span>
            <b className="text-[#5B3DF5] font-extrabold text-lg">
              {balance.toFixed(1)} pts
            </b>
          </span>
        </div>
      </div>

      {/* Filtres Chips (Style exact Taches.dc.html) */}
      <div className="flex flex-wrap items-center gap-2.5 my-4">
        <button
          type="button"
          onClick={() => {
            setPlatformFilter("ALL");
            setActionFilter("ALL");
          }}
          className={`addme-chip ${
            platformFilter === "ALL" && actionFilter === "ALL" ? "on" : ""
          }`}
        >
          Tous
        </button>

        {/* Filtres par Réseau */}
        <button
          type="button"
          onClick={() =>
            setPlatformFilter(platformFilter === "TIKTOK" ? "ALL" : "TIKTOK")
          }
          className={`addme-chip ${platformFilter === "TIKTOK" ? "on" : ""}`}
        >
          TikTok
        </button>
        <button
          type="button"
          onClick={() =>
            setPlatformFilter(
              platformFilter === "INSTAGRAM" ? "ALL" : "INSTAGRAM"
            )
          }
          className={`addme-chip ${platformFilter === "INSTAGRAM" ? "on" : ""}`}
        >
          Instagram
        </button>
        <button
          type="button"
          onClick={() =>
            setPlatformFilter(platformFilter === "YOUTUBE" ? "ALL" : "YOUTUBE")
          }
          className={`addme-chip ${platformFilter === "YOUTUBE" ? "on" : ""}`}
        >
          YouTube
        </button>

        <span className="h-5 w-[1px] bg-[#E3E3EE] mx-1 hidden sm:inline-block" />

        {/* Filtres par Action */}
        <button
          type="button"
          onClick={() =>
            setActionFilter(actionFilter === "LIKE" ? "ALL" : "LIKE")
          }
          className={`addme-chip ${actionFilter === "LIKE" ? "on" : ""}`}
        >
          Like
        </button>
        <button
          type="button"
          onClick={() =>
            setActionFilter(actionFilter === "COMMENT" ? "ALL" : "COMMENT")
          }
          className={`addme-chip ${actionFilter === "COMMENT" ? "on" : ""}`}
        >
          Commentaire
        </button>
        <button
          type="button"
          onClick={() =>
            setActionFilter(actionFilter === "SUBSCRIBE" ? "ALL" : "SUBSCRIBE")
          }
          className={`addme-chip ${actionFilter === "SUBSCRIBE" ? "on" : ""}`}
        >
          Abonnement
        </button>
      </div>

      {/* Bandeau d'instruction Lavande (#EEEAFF / #D9D2FF - Style exact Taches.dc.html) */}
      <div
        className="addme-card-static text-sm text-[#12122A] leading-relaxed"
        style={{ background: "#EEEAFF", borderColor: "#D9D2FF" }}
      >
        Ouvrez la publication, faites l’action vous-même, puis revenez valider.
        Un chronomètre de 10 secondes s’affiche pendant la tâche et vos points
        sont crédités <strong>immédiatement</strong> sur votre solde dès
        validation. Chaque publication ne peut être effectuée qu’
        <strong>une seule fois</strong>.
      </div>

      {/* Message de confirmation ou d'erreur */}
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

      {/* PANNEAU DE TÂCHE EN COURS D'EXÉCUTION (Chrono 10s actif) */}
      {activeSession && (
        <div className="addme-card-static border-2 border-[#5B3DF5] shadow-xl space-y-5 animate-up">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E3E3EE] pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3DF5]">
                Mission en cours • {formatPlatform(activeSession.platform)} ·{" "}
                {formatAction(activeSession.actionType)}
              </span>
              <h3 className="text-xl font-extrabold text-[#12122A] mt-0.5">
                Effectuez l’action puis validez vos +{activeSession.rewardPoints}{" "}
                pt{activeSession.rewardPoints > 1 ? "s" : ""}
              </h3>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#EEEAFF] text-[#3A22C8] font-extrabold text-sm">
              <Clock className="h-4 w-4 text-[#5B3DF5]" />
              {secondsRemaining > 0 ? (
                <span>Chronomètre : {secondsRemaining}s restantes</span>
              ) : (
                <span className="text-emerald-700">✓ Temps écoulé (Prêt)</span>
              )}
            </div>
          </div>

          {/* Barre de progression du chronomètre */}
          <div className="w-full h-2.5 rounded-full bg-[#E3E3EE] overflow-hidden">
            <div
              className="h-full bg-[#5B3DF5] transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  ((10 - secondsRemaining) / 10) * 100
                )}%`,
              }}
            />
          </div>

          {/* Modèle de commentaire si requis */}
          {activeSession.actionType === "COMMENT" &&
            activeSession.commentTemplate && (
              <div className="p-4 rounded-xl bg-[#F7F7FB] border border-[#E3E3EE] flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-[#5A5A70] block font-semibold mb-0.5">
                    Commentaire suggéré par le créateur :
                  </span>
                  <strong className="text-[#12122A] text-sm">
                    &ldquo;{activeSession.commentTemplate}&rdquo;
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyCommentTemplate(activeSession.commentTemplate!)
                  }
                  className="addme-btn addme-btn-ghost text-xs py-2 px-3"
                >
                  {copiedTemplate ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            )}

          {/* Contrôle aléatoire de capture d'écran si demandé */}
          {activeSession.requiresScreenshot && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Camera className="h-4 w-4 text-amber-600" />
                <span>
                  Contrôle de conformité : veuillez indiquer un lien de capture
                  ou preuve d’action
                </span>
              </div>
              <input
                type="text"
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                placeholder="Ex : https://imgur.com/... ou confirmation"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-sm text-[#12122A] focus:outline-none focus:border-[#5B3DF5]"
              />
            </div>
          )}

          {/* Boutons d'action de la session */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <a
              href={activeSession.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setHasOpenedLink(true)}
              className="addme-btn addme-btn-ghost text-xs"
            >
              <ExternalLink className="h-4 w-4 text-[#5B3DF5]" />
              <span>Rouvrir la publication ({activeSession.platform})</span>
            </a>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSession(null)}
                className="addme-btn addme-btn-ghost text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={secondsRemaining > 0 || submitting}
                onClick={handleSubmitTask}
                className="addme-btn addme-btn-primary disabled:opacity-50"
              >
                {submitting ? (
                  <span>Validation en cours...</span>
                ) : secondsRemaining > 0 ? (
                  <span>Patientez {secondsRemaining}s...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      Valider et recevoir +{activeSession.rewardPoints} pt
                      {activeSession.rewardPoints > 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LISTE DES TÂCHES DISPONIBLES (1 seule carte par publication - Style exact Taches.dc.html) */}
      <div className="addme-card-static">
        {loading ? (
          <div className="py-12 text-center text-[#5A5A70] space-y-3">
            <div className="h-8 w-8 border-3 border-[#5B3DF5] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Chargement des publications disponibles...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <b className="text-base font-bold text-[#12122A] block">
              Aucune nouvelle publication à afficher
            </b>
            <p className="text-sm text-[#5A5A70] max-w-md mx-auto">
              Vous avez déjà accompli toutes les publications disponibles pour ce
              filtre, ou aucune mission n’est en attente. Revenez dans quelques
              instants !
            </p>
          </div>
        ) : (
          <div>
            {tasks.map((task) => {
              const shortCode =
                task.platform === "TIKTOK"
                  ? "TT"
                  : task.platform === "INSTAGRAM"
                  ? "IG"
                  : "YT";
              const isStarting = startingTaskId === task.taskId;
              const isCurrentlyActive = activeSession?.taskId === task.taskId;

              return (
                <div key={task.taskId} className="addme-row">
                  <div className="addme-thumb">{shortCode}</div>

                  <div className="flex-1 min-w-0">
                    <b className="block text-base font-bold text-[#12122A] truncate">
                      Publication de {task.targetHandle || `@créateur`}
                    </b>
                    <div className="text-sm text-[#5A5A70] flex flex-wrap items-center gap-2 mt-0.5">
                      <span>
                        {formatPlatform(task.platform)} ·{" "}
                        {formatAction(task.actionType)}
                      </span>
                      {task.remainingSlots !== undefined && (
                        <>
                          <span>•</span>
                          <span className="text-xs">
                            {task.remainingSlots} place
                            {task.remainingSlots > 1 ? "s" : ""} restante
                            {task.remainingSlots > 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="text-[#5B3DF5] font-extrabold text-lg">
                    +{task.rewardPoints} pt{task.rewardPoints > 1 ? "s" : ""}
                  </span>

                  <button
                    type="button"
                    disabled={isStarting || isCurrentlyActive}
                    onClick={() => handleStartTask(task)}
                    className="addme-btn addme-btn-primary text-sm disabled:opacity-50"
                  >
                    {isStarting
                      ? "Ouverture..."
                      : isCurrentlyActive
                      ? "En cours..."
                      : "Faire la tâche"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
