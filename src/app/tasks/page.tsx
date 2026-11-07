"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Clock,
  AlertTriangle,
  RefreshCw,
  Camera,
  Check,
  Copy,
  XCircle,
  ShieldCheck,
  PauseCircle,
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
  campaignId?: string;
  videoUrl: string;
  platform: "TIKTOK" | "YOUTUBE" | "INSTAGRAM";
  actionType: "LIKE" | "COMMENT" | "SUBSCRIBE";
  commentTemplate: string | null;
  rewardPoints: number;
  targetHandle?: string;
  minDurationSeconds: number;
  secondsRemaining?: number;
  requiresScreenshot: boolean;
  startedAt: string;
}

const REQUIRED_DURATION_SEC = 20;

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  // Session de tâche active (Chronomètre 20s + Robot de vérification)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    REQUIRED_DURATION_SEC
  );
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotFileName, setScreenshotFileName] = useState("");
  const [showProofFallback, setShowProofFallback] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeBannerRef = useRef<HTMLDivElement | null>(null);

  // Suivi précis du temps réellement passé hors de l'onglet AddMe.io (sur la publication cible)
  const accumulatedExternalMsRef = useRef<number>(0);
  const leftPageAtRef = useRef<number | null>(null);

  const fetchBalanceAndTasks = useCallback(async () => {
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

        if (data.activeSession) {
          setActiveSession((prev) => {
            if (prev?.completionId === data.activeSession.completionId) {
              return prev;
            }
            // Si la session est restaurée après un rechargement de page, initialiser le temps écoulé
            const minDur =
              data.activeSession.minDurationSeconds || REQUIRED_DURATION_SEC;
            const initialRem =
              typeof data.activeSession.secondsRemaining === "number"
                ? data.activeSession.secondsRemaining
                : minDur;
            accumulatedExternalMsRef.current = Math.max(
              0,
              (minDur - initialRem) * 1000
            );
            leftPageAtRef.current = null;
            setSecondsRemaining(initialRem);
            return data.activeSession;
          });
        }
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
  }, [platformFilter, actionFilter]);

  useEffect(() => {
    fetchBalanceAndTasks();
  }, [fetchBalanceAndTasks]);

  const handleSubmitTask = useCallback(
    async (sessionOverride?: ActiveSession) => {
      const targetSession = sessionOverride || activeSession;
      if (!targetSession || submitting) return;

      setSubmitting(true);
      setFeedback(null);

      // Calcul du temps total passé sur la publication externe
      let currentExternalMs = accumulatedExternalMsRef.current;
      if (leftPageAtRef.current !== null) {
        currentExternalMs += Date.now() - leftPageAtRef.current;
      }
      const externalTimeSpentSeconds = Math.round(currentExternalMs / 1000);

      try {
        const res = await fetch(`/api/tasks/${targetSession.taskId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            completionId: targetSession.completionId,
            screenshotUrl: screenshotUrl.trim() || undefined,
            externalTimeSpentSeconds,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.requiresProofFallback) {
            setShowProofFallback(true);
          }
          setFeedback({
            type: "error",
            text:
              data.error ||
              "🤖 IA Sentinel Anti-Fraude : Action non détectée. Veuillez effectuer l'action sur la publication puis réessayer.",
          });
        } else {
          setFeedback({
            type: "success",
            text:
              data.message ||
              `🤖 Action vérifiée par l'IA Sentinel ! +${targetSession.rewardPoints} points ont été crédités immédiatement à votre solde !`,
          });
          setActiveSession(null);
          setScreenshotUrl("");
          setScreenshotFileName("");
          setShowProofFallback(false);
          accumulatedExternalMsRef.current = 0;
          leftPageAtRef.current = null;
          await fetchBalanceAndTasks();
          // Synchroniser immédiatement le solde affiché dans la Sidebar à gauche
          window.dispatchEvent(new Event("addme:balance-updated"));
        }
      } catch {
        setFeedback({
          type: "error",
          text: "Erreur réseau lors de la vérification par le robot.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [activeSession, submitting, screenshotUrl, fetchBalanceAndTasks]
  );

  // Chronomètre 20 secondes intelligent : ne décompte que lorsque l'utilisateur est sur la publication externe !
  // Si l'utilisateur referme TikTok/YouTube/Instagram avant les 20s, le chronomètre se met en pause.
  useEffect(() => {
    if (!activeSession) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const minDur = activeSession.minDurationSeconds || REQUIRED_DURATION_SEC;

    const handleLeaveAddMe = () => {
      if (leftPageAtRef.current === null) {
        leftPageAtRef.current = Date.now();
      }
      setIsTimerPaused(false);
    };

    const handleReturnToAddMe = () => {
      if (leftPageAtRef.current !== null) {
        accumulatedExternalMsRef.current += Date.now() - leftPageAtRef.current;
        leftPageAtRef.current = null;
      }
      const totalElapsedSec = accumulatedExternalMsRef.current / 1000;
      const rem = Math.max(0, Math.ceil(minDur - totalElapsedSec));
      setSecondsRemaining(rem);
      setIsTimerPaused(rem > 0);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleLeaveAddMe();
      } else {
        handleReturnToAddMe();
      }
    };

    window.addEventListener("blur", handleLeaveAddMe);
    window.addEventListener("focus", handleReturnToAddMe);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const updateClock = () => {
      // Vérifie si l'utilisateur est actuellement hors de la page AddMe.io (sur TikTok/YouTube/Instagram)
      const isUserAwayOnSocialTab =
        document.visibilityState === "hidden" || !document.hasFocus();

      if (isUserAwayOnSocialTab) {
        if (leftPageAtRef.current === null) {
          leftPageAtRef.current = Date.now();
        }
        setIsTimerPaused(false);
      } else {
        if (leftPageAtRef.current !== null) {
          accumulatedExternalMsRef.current +=
            Date.now() - leftPageAtRef.current;
          leftPageAtRef.current = null;
        }
      }

      const activeAwayMs =
        leftPageAtRef.current !== null
          ? Date.now() - leftPageAtRef.current
          : 0;
      const totalExternalSec =
        (accumulatedExternalMsRef.current + activeAwayMs) / 1000;
      const remaining = Math.max(0, Math.ceil(minDur - totalExternalSec));

      setSecondsRemaining(remaining);
      if (!isUserAwayOnSocialTab && remaining > 0) {
        setIsTimerPaused(true);
      } else {
        setIsTimerPaused(false);
      }
    };

    updateClock();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(updateClock, 250);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("blur", handleLeaveAddMe);
      window.removeEventListener("focus", handleReturnToAddMe);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
        const sessionData: ActiveSession = data.session || data;
        const minDur = sessionData.minDurationSeconds || REQUIRED_DURATION_SEC;

        // Réinitialisation du compteur de présence externe à 20s
        accumulatedExternalMsRef.current = 0;
        leftPageAtRef.current = Date.now();
        setSecondsRemaining(minDur);
        setIsTimerPaused(false);
        setActiveSession(sessionData);
        setScreenshotUrl("");
        setScreenshotFileName("");
        setShowProofFallback(false);
        setCopiedTemplate(false);

        // Ouverture automatique de la publication dans un nouvel onglet
        window.open(task.videoUrl, "_blank", "noopener,noreferrer");

        setTimeout(() => {
          activeBannerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 150);
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

  const handleReopenPublication = () => {
    if (!activeSession) return;
    leftPageAtRef.current = Date.now();
    setIsTimerPaused(false);
    setFeedback(null);
    window.open(activeSession.videoUrl, "_blank", "noopener,noreferrer");
  };

  const handleCancelTask = async () => {
    if (!activeSession) return;
    setCancelling(true);
    try {
      await fetch(`/api/tasks/${activeSession.taskId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completionId: activeSession.completionId }),
      });
      setActiveSession(null);
      setScreenshotUrl("");
      setScreenshotFileName("");
      setShowProofFallback(false);
      accumulatedExternalMsRef.current = 0;
      leftPageAtRef.current = null;
      await fetchBalanceAndTasks();
    } catch {
      setActiveSession(null);
    } finally {
      setCancelling(false);
    }
  };

  const copyCommentTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setScreenshotUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
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

  const minDur = activeSession?.minDurationSeconds || REQUIRED_DURATION_SEC;

  return (
    <div className="flex-1 max-w-[1100px] w-full mx-auto px-6 py-8 space-y-5">
      {/* En-tête : Titre + Carte Solde */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-[#12122A] m-0 tracking-tight">
            Gagner des points
          </h1>
          {quota && (
            <p className="text-xs text-[#5A5A70] mt-0.5">
              Quota du jour : {quota.dailyTasksCompleted} / {quota.dailyTaskLimit} tâches •{" "}
              Chronomètre 20s • Vérification par Robot Anti-Fraude
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

      {/* Filtres Chips */}
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

      {/* Bandeau d'instruction Lavande (#EEEAFF / #D9D2FF) */}
      <div
        className="addme-card-static text-sm text-[#12122A] leading-relaxed"
        style={{ background: "#EEEAFF", borderColor: "#D9D2FF" }}
      >
        Ouvrez la publication, restez dessus au moins{" "}
        <strong>20 secondes</strong> et effectuez réellement l’action demandée.
        Si vous refermez la page trop tôt, le chronomètre se met en pause. Au
        moment de valider, notre{" "}
        <strong>Robot de Vérification Anti-Fraude</strong> contrôle en direct
        sur le réseau social que le compteur (Like, Abonnement ou Commentaire) a
        bien augmenté avant de créditer vos points.
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

      {/* PANNEAU DE TÂCHE EN COURS D'EXÉCUTION (Chrono 20s + Robot Anti-Fraude) */}
      {activeSession && (
        <div
          ref={activeBannerRef}
          className="addme-card-static border-2 border-[#5B3DF5] bg-white shadow-xl space-y-5 animate-up"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E3E3EE] pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3DF5] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>
                  Contrôle par Robot Actif •{" "}
                  {formatPlatform(activeSession.platform)} ·{" "}
                  {formatAction(activeSession.actionType)}
                  {activeSession.targetHandle
                    ? ` (@${activeSession.targetHandle})`
                    : ""}
                </span>
              </span>
              <h3 className="text-xl font-extrabold text-[#12122A] mt-0.5">
                Effectuez le {formatAction(activeSession.actionType).toLowerCase()}{" "}
                sur {formatPlatform(activeSession.platform)} puis lancez la
                vérification (+{activeSession.rewardPoints} pt
                {activeSession.rewardPoints > 1 ? "s" : ""})
              </h3>
            </div>

            <div
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm ${
                secondsRemaining === 0
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  : isTimerPaused
                  ? "bg-amber-50 border border-amber-300 text-amber-800"
                  : "bg-[#EEEAFF] text-[#3A22C8]"
              }`}
            >
              {secondsRemaining === 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>✓ 20s écoulées — Prêt pour vérification Robot !</span>
                </>
              ) : isTimerPaused ? (
                <>
                  <PauseCircle className="h-4 w-4 text-amber-600" />
                  <span>
                    En pause ({secondsRemaining}s restantes) — Restez sur{" "}
                    {formatPlatform(activeSession.platform)}
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-[#5B3DF5] animate-spin" />
                  <span>Chronomètre : {secondsRemaining}s restantes</span>
                </>
              )}
            </div>
          </div>

          {/* Barre de progression du chronomètre 20s */}
          <div className="w-full h-3 rounded-full bg-[#E3E3EE] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                secondsRemaining === 0
                  ? "bg-emerald-500"
                  : isTimerPaused
                  ? "bg-amber-500"
                  : "bg-[#5B3DF5]"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(5, ((minDur - secondsRemaining) / minDur) * 100)
                )}%`,
              }}
            />
          </div>

          {/* Alerte si l'utilisateur a refermé la publication avant les 20 secondes */}
          {isTimerPaused && secondsRemaining > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex items-center justify-between gap-3">
              <span>
                ⚠️ Vous êtes revenu sur AddMe.io avant la fin des 20 secondes (il
                reste <strong>{secondsRemaining}s</strong>). Le chronomètre ne
                défile que pendant que vous êtes sur la publication{" "}
                {formatPlatform(activeSession.platform)}.
              </span>
              <button
                type="button"
                onClick={handleReopenPublication}
                className="addme-btn addme-btn-primary py-2 px-3.5 text-xs shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Reprendre sur {formatPlatform(activeSession.platform)}</span>
              </button>
            </div>
          )}

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

          {/* Module Agent IA Vision : Capture d'écran de preuve (affiché si le compteur public est masqué/retardé ou sur demande) */}
          {(activeSession.requiresScreenshot || showProofFallback) && (
            <div className="p-4 rounded-xl bg-[#EEEAFF] border border-[#D9D2FF] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#3A22C8]">
                  <Camera className="h-4 w-4 text-[#5B3DF5]" />
                  <span>
                    🤖 Agent IA Vision : Importez une capture d’écran prouvant votre{" "}
                    {formatAction(activeSession.actionType).toLowerCase()} sur{" "}
                    {formatPlatform(activeSession.platform)}
                  </span>
                </div>
                {screenshotFileName && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    ✓ {screenshotFileName}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="addme-btn addme-btn-primary py-2 px-4 text-xs cursor-pointer">
                  <Camera className="h-3.5 w-3.5" />
                  <span>
                    {screenshotFileName
                      ? "Changer la capture d’écran"
                      : "Choisir une capture d’écran (Téléphone / PC)"}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleProofFileChange}
                    className="hidden"
                  />
                </label>

                <span className="text-xs text-[#5A5A70]">
                  L’IA inspecte visuellement que le bouton d’action est bien activé avant de créditer vos points.
                </span>
              </div>
            </div>
          )}

          {/* Boutons d'action de la session */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleReopenPublication}
              className="addme-btn addme-btn-ghost text-xs"
            >
              <ExternalLink className="h-4 w-4 text-[#5B3DF5]" />
              <span>
                Rouvrir la publication ({formatPlatform(activeSession.platform)})
              </span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={cancelling || submitting}
                onClick={handleCancelTask}
                className="addme-btn addme-btn-ghost text-xs text-rose-600 hover:bg-rose-50"
              >
                <XCircle className="h-4 w-4" />
                <span>{cancelling ? "Annulation..." : "Annuler"}</span>
              </button>
              <button
                type="button"
                disabled={secondsRemaining > 0 || submitting}
                onClick={() => handleSubmitTask()}
                className="addme-btn addme-btn-primary disabled:opacity-50"
              >
                {submitting ? (
                  <span>🤖 Vérification par le robot en cours...</span>
                ) : secondsRemaining > 0 ? (
                  <span>Patientez {secondsRemaining}s sur la publication...</span>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>
                      Vérifier mon action & Recevoir +{activeSession.rewardPoints} pt
                      {activeSession.rewardPoints > 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LISTE DES TÂCHES DISPONIBLES */}
      <div className="addme-card-static">
        {loading ? (
          <div className="py-12 text-center text-[#5A5A70] space-y-3">
            <div className="h-8 w-8 border-3 border-[#5B3DF5] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Chargement des publications disponibles...</p>
          </div>
        ) : tasks.length === 0 && !activeSession ? (
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
              const isCurrentlyActive =
                activeSession?.taskId === task.taskId ||
                (activeSession?.campaignId &&
                  activeSession.campaignId === task.campaignId);

              return (
                <div key={task.taskId} className="addme-row">
                  <div className="addme-thumb">{shortCode}</div>

                  <div className="flex-1 min-w-0">
                    <b className="block text-base font-bold text-[#12122A] truncate">
                      Publication de @{task.targetHandle || `créateur`}
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

                  {isCurrentlyActive ? (
                    <button
                      type="button"
                      disabled={secondsRemaining > 0 || submitting}
                      onClick={() => handleSubmitTask()}
                      className="addme-btn addme-btn-primary text-sm disabled:opacity-60"
                    >
                      {submitting
                        ? "🤖 Vérification..."
                        : secondsRemaining > 0
                        ? `Chrono : ${secondsRemaining}s...`
                        : `Vérifier (+${task.rewardPoints} pt${
                            task.rewardPoints > 1 ? "s" : ""
                          })`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isStarting}
                      onClick={() => handleStartTask(task)}
                      className="addme-btn addme-btn-primary text-sm disabled:opacity-50"
                    >
                      {isStarting ? "Inspection Robot..." : "Faire la tâche"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
