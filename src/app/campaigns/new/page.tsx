"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Video,
  Coins,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Sliders,
  Calendar,
  Users,
} from "lucide-react";
import { validateVideoPublicationUrl } from "@/lib/video-url-validator";

interface SocialAccount {
  id: string;
  platform: "TIKTOK" | "YOUTUBE" | "INSTAGRAM";
  identifier: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
}

export default function NewCampaignPage() {
  const router = useRouter();

  // User State
  const [balance, setBalance] = useState<number>(0);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State (Paramètres Simplifiés)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [actionType, setActionType] = useState<"LIKE" | "COMMENT" | "SUBSCRIBE">("LIKE");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [commentTemplate, setCommentTemplate] = useState<string>("");

  // Nouveaux paramètres utilisateur intuitifs :
  const [targetQuantity, setTargetQuantity] = useState<number>(10); // Combien de personnes
  const [rewardPerWorker, setRewardPerWorker] = useState<number>(1.5); // Récompense offerte par action
  const [durationDays, setDurationDays] = useState<number>(5); // Durée de diffusion en jours

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ratesRes, meRes] = await Promise.all([
          fetch("/api/campaigns/rates"),
          fetch("/api/auth/me"),
        ]);

        if (ratesRes.ok) {
          const ratesData = await ratesRes.json();
          setBalance(ratesData.balance);
        }

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user?.socialAccounts) {
            setAccounts(meData.user.socialAccounts);
            const verified = meData.user.socialAccounts.filter(
              (a: SocialAccount) => a.status === "VERIFIED"
            );
            if (verified.length > 0) {
              setSelectedAccountId(verified[0].id);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const verifiedAccounts = accounts.filter((a) => a.status === "VERIFIED");
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Validation en temps réel de l'URL
  const selectedPlatform = selectedAccount?.platform || "TIKTOK";
  const urlValidation = videoUrl
    ? validateVideoPublicationUrl(selectedPlatform, videoUrl, selectedAccount?.identifier)
    : null;

  // Calculs financiers transparents
  const interactionsCost = Number((targetQuantity * rewardPerWorker).toFixed(2));
  const durationFee = Number((durationDays * 0.5).toFixed(2)); // 0.5 pt par jour de diffusion
  const totalCost = Number((interactionsCost + durationFee).toFixed(2));
  const isBalanceSufficient = balance >= totalCost;
  const dailyPacing = Math.max(1, Math.ceil(targetQuantity / durationDays));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccountId) {
      setError("Veuillez sélectionner un compte social vérifié.");
      return;
    }

    if (urlValidation && !urlValidation.valid) {
      setError(urlValidation.error || "L'URL de la publication est invalide.");
      return;
    }

    if (!isBalanceSufficient) {
      setError(
        `Solde insuffisant : il vous manque ${(totalCost - balance).toFixed(1)} points pour lancer cette campagne.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialAccountId: selectedAccountId,
          actionType,
          videoUrl,
          commentTemplate: actionType === "COMMENT" ? commentTemplate : undefined,
          totalQuantity: targetQuantity,
          rewardPerWorker,
          durationDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de créer la campagne.");
      } else {
        router.push("/campaigns");
        router.refresh();
      }
    } catch {
      setError("Erreur réseau lors de la création de la campagne.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="h-10 w-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Video className="h-7 w-7 text-indigo-400" />
          Lancer une nouvelle campagne
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Fixez vous-même vos récompenses et la durée souhaitée pour propulser vos publications TikTok, YouTube et Instagram.
        </p>
      </div>

      {/* Warning if 0 verified accounts */}
      {verifiedAccounts.length === 0 ? (
        <div className="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-white">Aucun compte social vérifié</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
              Pour garantir l'intégrité de la plateforme, vous devez lier votre profil TikTok, YouTube ou Instagram via le code en bio avant de créer des campagnes.
            </p>
          </div>
          <Link
            href="/dashboard/social-accounts"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md"
          >
            Lier et vérifier mon compte maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Étape 1 : Choix du compte social */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
                1. Votre profil vérifié
              </h2>
              <Link
                href="/dashboard/social-accounts"
                className="text-xs text-slate-400 hover:text-white"
              >
                + Ajouter un autre compte
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {verifiedAccounts.map((acc) => (
                <button
                  type="button"
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedAccountId === acc.id
                      ? "bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full mb-1 ${
                      acc.platform === "TIKTOK"
                        ? "bg-pink-500/20 text-pink-300"
                        : acc.platform === "INSTAGRAM"
                        ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-pink-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {acc.platform}
                  </span>
                  <div className="font-bold text-sm text-white truncate">@{acc.identifier}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Étape 2 : Type d'Action */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
              2. Action souhaitée sur votre publication
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { type: "LIKE", label: "Recevoir des Likes", desc: "Favorise le référencement algorithmique" },
                { type: "COMMENT", label: "Recevoir des Commentaires", desc: "Augmente la rétention et le débat" },
                { type: "SUBSCRIBE", label: "Gagner des Abonnés", desc: "Fidélise de vrais créateurs" },
              ].map((act) => (
                <button
                  type="button"
                  key={act.type}
                  onClick={() => setActionType(act.type as any)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    actionType === act.type
                      ? "bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold text-sm text-white">{act.label}</div>
                  <p className="text-xs text-slate-400 mt-1">{act.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Étape 3 : URL de la publication */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
              3. Lien direct de la publication (Vidéo / Reel / Shorts)
            </h2>

            <div>
              <input
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={
                  selectedPlatform === "TIKTOK"
                    ? "https://www.tiktok.com/@votre_compte/video/721234567890..."
                    : selectedPlatform === "INSTAGRAM"
                    ? "https://www.instagram.com/reel/C-xyz123/ ou /p/..."
                    : "https://www.youtube.com/watch?v=... ou /shorts/..."
                }
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />

              {urlValidation && (
                <div
                  className={`mt-2 text-xs flex items-center gap-1.5 ${
                    urlValidation.valid ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {urlValidation.valid ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Publication validée avec succès
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" /> {urlValidation.error}
                    </>
                  )}
                </div>
              )}
            </div>

            {actionType === "COMMENT" && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Idée ou consigne de commentaire (Optionnel)
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={commentTemplate}
                  onChange={(e) => setCommentTemplate(e.target.value)}
                  placeholder="Ex : Superbe montage ! / Quelle caméra as-tu utilisée ?"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs"
                />
              </div>
            )}
          </div>

          {/* Étape 4 : Paramètres Simplifiés (La Personnalisation Demandée) */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              4. Personnalisez votre campagne (Objectifs & Récompense)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Nombre de personnes souhaitées */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Combien de personnes ?
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-center text-lg"
                  />
                  <span className="text-xs text-slate-400 shrink-0">personnes</span>
                </div>
                <div className="flex gap-1.5">
                  {[5, 10, 20, 50].map((qty) => (
                    <button
                      type="button"
                      key={qty}
                      onClick={() => setTargetQuantity(qty)}
                      className={`flex-1 py-1 text-[11px] rounded-lg font-semibold transition ${
                        targetQuantity === qty
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Récompense offerte par personne */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Points offerts par personne
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={0.5}
                    min={0.5}
                    max={20}
                    value={rewardPerWorker}
                    onChange={(e) => setRewardPerWorker(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-center text-lg"
                  />
                  <span className="text-xs text-slate-400 shrink-0">pts / action</span>
                </div>
                <div className="flex gap-1.5">
                  {[1.0, 1.5, 2.0, 3.0].map((pts) => (
                    <button
                      type="button"
                      key={pts}
                      onClick={() => setRewardPerWorker(pts)}
                      className={`flex-1 py-1 text-[11px] rounded-lg font-semibold transition ${
                        rewardPerWorker === pts
                          ? "bg-amber-500 text-slate-950 font-bold"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {pts} pt
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Plus vous offrez de points, plus les créateurs feront votre tâche en priorité.
                </p>
              </div>

              {/* 3. Durée de la mission en jours */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Durée de diffusion
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-center text-lg"
                  />
                  <span className="text-xs text-slate-400 shrink-0">jours</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 3, 5, 7].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setDurationDays(d)}
                      className={`flex-1 py-1 text-[11px] rounded-lg font-semibold transition ${
                        durationDays === d
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {d}j
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Frais de diffusion : 0,5 point par jour ({durationFee} pts pour {durationDays} jours).
                </p>
              </div>
            </div>

            {/* Récapitulatif Transparent & Solde */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span>Coût des {targetQuantity} interactions :</span>
                  <strong className="text-white">{interactionsCost} pts</strong>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span>Frais de diffusion ({durationDays} jours à 0.5 pt/j) :</span>
                  <strong className="text-white">+{durationFee} pts</strong>
                </div>
                <div className="text-[11px] text-indigo-300">
                  Cadence algorithmique : ~{dailyPacing} interactions par jour.
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Total à débiter
                </span>
                <span className="text-3xl font-extrabold text-white">
                  {totalCost} <span className="text-sm font-bold text-amber-400">points</span>
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Votre solde : <strong className="text-amber-300">{balance.toFixed(1)} pts</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Bouton de validation */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/campaigns"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Annuler et revenir à mes campagnes
            </Link>

            <button
              type="submit"
              disabled={submitting || !isBalanceSufficient}
              className={`px-8 py-4 rounded-xl text-sm font-bold text-white transition-all shadow-xl flex items-center gap-2 ${
                isBalanceSufficient && !submitting
                  ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:scale-102"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              {submitting ? (
                "Lancement en cours..."
              ) : !isBalanceSufficient ? (
                `Solde insuffisant (Rechargez ${(totalCost - balance).toFixed(1)} pts)`
              ) : (
                <>
                  Lancer la campagne ({totalCost} pts)
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
