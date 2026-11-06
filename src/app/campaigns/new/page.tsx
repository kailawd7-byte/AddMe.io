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
} from "lucide-react";
import { validateVideoPublicationUrl } from "@/lib/video-url-validator";

interface SocialAccount {
  id: string;
  platform: "TIKTOK" | "YOUTUBE";
  identifier: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
}

interface ActionRates {
  cost: number;
  reward: number;
}

export default function NewCampaignPage() {
  const router = useRouter();

  // User & Rates State
  const [balance, setBalance] = useState<number>(0);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [rates, setRates] = useState<Record<string, ActionRates>>({
    LIKE: { cost: 1.3, reward: 1.0 },
    COMMENT: { cost: 1.8, reward: 1.4 },
    SUBSCRIBE: { cost: 2.5, reward: 2.0 },
  });
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [actionType, setActionType] = useState<"LIKE" | "COMMENT" | "SUBSCRIBE">("LIKE");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [commentTemplate, setCommentTemplate] = useState<string>("");
  const [totalQuantity, setTotalQuantity] = useState<number>(10);
  const [dailyCap, setDailyCap] = useState<number>(5);

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
          if (ratesData.rates) setRates(ratesData.rates);
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
    ? validateVideoPublicationUrl(
        selectedPlatform,
        videoUrl,
        selectedAccount?.identifier
      )
    : null;

  // Calculs financiers en temps réel
  const currentCostPerUnit = rates[actionType]?.cost || 1.3;
  const totalCost = Number((totalQuantity * currentCostPerUnit).toFixed(2));
  const remainingBalance = Number((balance - totalCost).toFixed(2));
  const isBalanceSufficient = balance >= totalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAccountId) {
      setError("Veuillez sélectionner un compte social vérifié.");
      return;
    }

    if (urlValidation && !urlValidation.valid) {
      setError(urlValidation.error || "L'URL de la vidéo est invalide.");
      return;
    }

    if (!isBalanceSufficient) {
      setError(
        `Solde insuffisant : il vous manque ${(totalCost - balance).toFixed(1)} points pour créer cette campagne.`
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
          totalQuantity,
          dailyCap,
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
          Créer une nouvelle campagne
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Recevez des likes, commentaires ou abonnements 100% manuels sur une publication spécifique de votre choix.
        </p>
      </div>

      {/* Warning if 0 verified accounts */}
      {verifiedAccounts.length === 0 ? (
        <div className="p-8 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-white">Aucun compte social vérifié</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
              Pour garantir l'intégrité de la plateforme, vous devez prouver la propriété de votre pseudo TikTok ou chaîne YouTube via le code en bio avant de publier des campagnes.
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
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Columns: Form Inputs */}
          <div className="lg:col-span-2 space-y-6 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Compte Social */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                1. Compte Social Associé
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {verifiedAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.platform} : @{acc.identifier} (Vérifié ✓)
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Seules les vidéos appartenant à ce compte vérifié seront acceptées.
              </p>
            </div>

            {/* 2. Type d'action */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                2. Action Souhaitée
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: "LIKE", label: "Like", cost: rates.LIKE?.cost || 1.3 },
                  { type: "COMMENT", label: "Commentaire", cost: rates.COMMENT?.cost || 1.8 },
                  { type: "SUBSCRIBE", label: "Abonnement", cost: rates.SUBSCRIBE?.cost || 2.5 },
                ].map((act) => (
                  <button
                    key={act.type}
                    type="button"
                    onClick={() => setActionType(act.type as any)}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      actionType === act.type
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="text-sm font-bold">{act.label}</div>
                    <div className="text-xs text-indigo-400 font-medium mt-1">
                      {act.cost} pts/u
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. URL de la publication */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                3. URL de la Publication Vidéo
              </label>
              <input
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={
                  selectedPlatform === "TIKTOK"
                    ? `https://www.tiktok.com/@${selectedAccount?.identifier || "pseudo"}/video/...`
                    : "https://www.youtube.com/watch?v=... ou /shorts/..."
                }
                className={`w-full px-4 py-3 bg-slate-800/80 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none ${
                  urlValidation && !urlValidation.valid
                    ? "border-rose-500 focus:border-rose-500"
                    : urlValidation && urlValidation.valid
                    ? "border-emerald-500 focus:border-emerald-500"
                    : "border-slate-700 focus:border-indigo-500"
                }`}
              />

              {/* Real-time validation feedback */}
              {urlValidation && (
                <div className="mt-2 text-xs">
                  {urlValidation.valid ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Publication vidéo valide détectée.
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {urlValidation.error}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Consigne de commentaire (si COMMENT sélectionné) */}
            {actionType === "COMMENT" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Suggestion ou Consigne pour le Commentaire (Optionnel)
                </label>
                <textarea
                  rows={2}
                  value={commentTemplate}
                  onChange={(e) => setCommentTemplate(e.target.value)}
                  placeholder="Ex: Mentionnez votre avis sincère sur le produit présenté dans la vidéo."
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* 4. Quantité & Plafond Quotidien */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Quantité Totale Souhaitée
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Ex: 10, 25, 50 engagements
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Plafond par jour (Livraison)
                  </label>
                  <span className="text-xs text-indigo-400 font-bold">{dailyCap} / jour</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.min(totalQuantity, 50)}
                  value={Math.min(dailyCap, totalQuantity)}
                  onChange={(e) => setDailyCap(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Répartit les interactions dans le temps pour un signal naturel.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Summary Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-400" />
                  Récapitulatif Financier
                </span>
                <span className="text-xs font-semibold text-slate-400">Ledger</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Coût par unité :</span>
                  <span className="text-white font-medium">{currentCostPerUnit} pts</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Quantité commandée :</span>
                  <span className="text-white font-medium">× {totalQuantity}</span>
                </div>
                <div className="flex justify-between text-slate-300 font-semibold pt-2 border-t border-slate-800">
                  <span>Total débité :</span>
                  <span className="text-amber-300 font-bold text-sm">{totalCost} pts</span>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Votre solde actuel :</span>
                    <span className="text-white">{balance.toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Solde après création :</span>
                    <span
                      className={`font-semibold ${
                        remainingBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {remainingBalance.toFixed(1)} pts
                    </span>
                  </div>
                </div>
              </div>

              {!isBalanceSufficient && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" /> Solde insuffisant
                  </div>
                  <p>Il vous manque {(totalCost - balance).toFixed(1)} points pour cette campagne.</p>
                  <div className="pt-1 flex gap-2">
                    <Link
                      href="/tasks"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px]"
                    >
                      Gagner des points
                    </Link>
                    <Link
                      href="/shop"
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px]"
                    >
                      Acheter un pack
                    </Link>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !isBalanceSufficient || Boolean(urlValidation && !urlValidation.valid)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                {submitting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Lancer la campagne ({totalCost} pts)
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-500 text-center leading-relaxed">
                Distribution progressive garantie. Si vous annulez la campagne, les points non consommés vous seront intégralement remboursés.
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
