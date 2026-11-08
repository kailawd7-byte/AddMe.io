"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
} from "lucide-react";
import { validateVideoPublicationUrl } from "@/lib/video-url-validator";

interface SocialAccount {
  id: string;
  platform: string;
  identifier: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
}

export default function NewCampaignPage() {
  const router = useRouter();

  const [balance, setBalance] = useState<number>(0);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [actionType, setActionType] = useState<"LIKE" | "COMMENT" | "SUBSCRIBE">("LIKE");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [commentTemplate, setCommentTemplate] = useState<string>("");

  // Paramètres libres et intuitifs demandés par l'utilisateur :
  const [targetQuantity, setTargetQuantity] = useState<number>(10); // Nombre de personnes uniques
  const [rewardPerWorker, setRewardPerWorker] = useState<number>(1); // Points offerts par personne (1, 2, 3...)
  const [durationDays, setDurationDays] = useState<number>(5); // Durée en jours (0.5 pt / jour)

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
          setBalance(ratesData.balance ?? 0);
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

  const selectedPlatform = selectedAccount?.platform || "TIKTOK";
  const urlValidation = videoUrl
    ? validateVideoPublicationUrl(
      selectedPlatform,
      videoUrl,
      selectedAccount?.identifier
    )
    : null;

  // Calculs transparents :
  const interactionsCost = Number((targetQuantity * rewardPerWorker).toFixed(2));
  const durationFee = Number((durationDays * 0.5).toFixed(2)); // 0,5 pt par jour
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

    if (!urlValidation?.valid) {
      setError(
        urlValidation?.error || "Veuillez saisir un lien de publication valide."
      );
      return;
    }

    if (!isBalanceSufficient) {
      setError(
        `Solde insuffisant (${balance.toFixed(
          1
        )} pts disponibles pour ${totalCost} pts requis).`
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
          platform: selectedPlatform,
          actionType,
          videoUrl: videoUrl.trim(),
          commentTemplate:
            actionType === "COMMENT" ? commentTemplate.trim() : undefined,
          totalQuantity: targetQuantity,
          rewardPerWorker,
          durationDays,
          dailyCap: dailyPacing,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de lancer la campagne.");
      } else {
        router.push("/campaigns");
      }
    } catch {
      setError("Erreur réseau lors de la création de la campagne.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="h-10 w-10 border-3 border-[#5B3DF5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-[1100px] w-full mx-auto px-6 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-[#12122A] m-0 tracking-tight">
            Nouvelle campagne
          </h1>
          <p className="text-sm text-[#5A5A70] mt-0.5">
            Choisissez librement votre action, les points offerts par personne et
            la durée de diffusion.
          </p>
        </div>

        <span className="addme-card-static py-2.5 px-5 inline-flex items-center gap-2">
          <span className="text-xs text-[#5A5A70] font-medium">Solde :</span>
          <b className="text-[#5B3DF5] font-extrabold text-lg">
            {balance.toFixed(1)} pts
          </b>
        </span>
      </div>

      {verifiedAccounts.length === 0 ? (
        <div className="addme-card-static p-8 text-center space-y-4">
          <Share2 className="h-10 w-10 text-[#5B3DF5] mx-auto" />
          <h2 className="text-xl font-extrabold text-[#12122A]">
            Liez d’abord un compte TikTok, Instagram ou YouTube
          </h2>
          <p className="text-sm text-[#5A5A70] max-w-md mx-auto">
            Pour lancer une campagne, vous devez associer et vérifier au moins un
            profil social via un code en biographie.
          </p>
          <Link
            href="/dashboard/social-accounts"
            className="addme-btn addme-btn-primary"
          >
            Lier un compte social maintenant
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Colonne Gauche : Configuration en 4 étapes simples */}
          <div className="lg:col-span-7 space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Étape 1 : Compte Social & Lien de la publication */}
            <div className="addme-card-static space-y-4">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#5B3DF5]">
                Étape 1 · Votre publication
              </div>

              <div>
                <label className="block text-sm font-bold text-[#12122A] mb-2">
                  Sélectionnez votre compte social vérifié
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {verifiedAccounts.map((acc) => {
                    const isSelected = acc.id === selectedAccountId;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${isSelected
                            ? "bg-[#EEEAFF] border-[#5B3DF5] text-[#3A22C8]"
                            : "bg-[#F7F7FB] border-[#E3E3EE] text-[#12122A] hover:border-[#5B3DF5]"
                          }`}
                      >
                        <div>
                          <div className="font-bold text-sm">@{acc.identifier}</div>
                          <div className="text-xs opacity-75">{acc.platform}</div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-[#5B3DF5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#12122A] mb-1.5">
                  Lien de votre publication ({selectedPlatform})
                </label>
                <input
                  type="url"
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={
                    selectedPlatform === "TIKTOK"
                      ? "https://www.tiktok.com/@pseudo/video/1234567890"
                      : selectedPlatform === "INSTAGRAM"
                        ? "https://www.instagram.com/reel/Cxyz123/"
                        : "https://www.youtube.com/watch?v=... ou /shorts/..."
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#F7F7FB] border border-[#CFCFE0] text-sm text-[#12122A] focus:outline-none focus:border-[#5B3DF5] focus:bg-white"
                />
                {urlValidation && (
                  <p
                    className={`text-xs mt-1.5 font-semibold ${urlValidation.valid ? "text-emerald-600" : "text-rose-600"
                      }`}
                  >
                    {urlValidation.valid
                      ? "✓ Lien de publication valide"
                      : urlValidation.error}
                  </p>
                )}
              </div>
            </div>

            {/* Étape 2 : Action souhaitée */}
            <div className="addme-card-static space-y-4">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#5B3DF5]">
                Étape 2 · Action demandée
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "LIKE", label: "Like", icon: Heart },
                  { id: "COMMENT", label: "Commentaire", icon: MessageCircle },
                  { id: "SUBSCRIBE", label: "Abonnement", icon: UserPlus },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = actionType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setActionType(item.id as "LIKE" | "COMMENT" | "SUBSCRIBE")
                      }
                      className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${active
                          ? "bg-[#5B3DF5] border-[#5B3DF5] text-white shadow-md"
                          : "bg-[#F7F7FB] border-[#E3E3EE] text-[#12122A] hover:border-[#5B3DF5]"
                        }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-bold text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {actionType === "COMMENT" && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-[#5A5A70] mb-1.5">
                    Orientation ou exemple de commentaire souhaité (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={commentTemplate}
                    onChange={(e) => setCommentTemplate(e.target.value)}
                    placeholder="Ex: Donnez votre avis sincère sur le montage !"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7FB] border border-[#CFCFE0] text-sm text-[#12122A] focus:outline-none focus:border-[#5B3DF5]"
                  />
                </div>
              )}
            </div>

            {/* Étape 3 : Vos récompenses & volume (100% libre) */}
            <div className="addme-card-static space-y-5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#5B3DF5]">
                Étape 3 · Récompense par action & Nombre de personnes
              </div>

              {/* Points offerts à chaque personne */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-[#12122A]">
                    Points que vous offrez pour chaque action effectuée
                  </label>
                  <span className="px-2.5 py-1 rounded-lg bg-[#EEEAFF] text-[#3A22C8] font-extrabold text-xs">
                    {rewardPerWorker} pt{rewardPerWorker > 1 ? "s" : ""} / action
                  </span>
                </div>
                <p className="text-xs text-[#5A5A70] mb-3">
                  C’est vous qui décidez : plus vous offrez de points (ex: 2 ou 3
                  pts), plus votre publication s’affiche en haut de la liste des
                  tâches !
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {[1, 1.5, 2, 3, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRewardPerWorker(val)}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-extrabold transition-all ${rewardPerWorker === val
                          ? "bg-[#12122A] border-[#12122A] text-white"
                          : "bg-[#F7F7FB] border-[#E3E3EE] text-[#12122A] hover:border-[#5B3DF5]"
                        }`}
                    >
                      {val} pt{val > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre de personnes souhaitées */}
              <div className="pt-3 border-t border-[#E3E3EE]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-[#12122A]">
                    Nombre de personnes uniques souhaitées
                  </label>
                  <span className="font-extrabold text-[#5B3DF5] text-base">
                    {targetQuantity} personnes
                  </span>
                </div>
                <p className="text-xs text-[#5A5A70] mb-3">
                  Chaque personne ne peut agir qu’une seule fois sur votre
                  publication. Si vous choisissez {targetQuantity}, alors{" "}
                  {targetQuantity} personnes différentes feront l’action.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={200}
                    step={1}
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(Number(e.target.value))}
                    className="flex-1 accent-[#5B3DF5] cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={targetQuantity}
                    onChange={(e) =>
                      setTargetQuantity(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-20 px-3 py-2 rounded-xl bg-[#F7F7FB] border border-[#CFCFE0] text-center font-extrabold text-sm text-[#12122A]"
                  />
                </div>
              </div>

              {/* Durée de la mission en jours (0.5 pt / jour) */}
              <div className="pt-3 border-t border-[#E3E3EE]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-[#12122A]">
                    Durée de diffusion en jours (0,5 pt / jour)
                  </label>
                  <span className="font-extrabold text-[#12122A] text-sm">
                    {durationDays} jour{durationDays > 1 ? "s" : ""} (+
                    {durationFee} pts)
                  </span>
                </div>
                <p className="text-xs text-[#5A5A70] mb-3">
                  Pour faire durer votre campagne sur {durationDays} jour(s), le
                  coût de durée est de 0,5 pt par jour (soit {durationFee} pts).
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 3, 5, 7, 10].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationDays(d)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${durationDays === d
                          ? "bg-[#EEEAFF] border-[#5B3DF5] text-[#3A22C8]"
                          : "bg-[#F7F7FB] border-[#E3E3EE] text-[#5A5A70] hover:border-[#5B3DF5]"
                        }`}
                    >
                      {d} j ({d * 0.5} pt)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Droite : Récapitulatif clair & Lancement */}
          <div className="lg:col-span-5 sticky top-8 space-y-4">
            <div className="addme-card-static space-y-5 border-2 border-[#5B3DF5]">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#5B3DF5]">
                  Récapitulatif de votre mission
                </span>
                <h3 className="text-xl font-extrabold text-[#12122A] mt-0.5">
                  Calcul transparent des points
                </h3>
              </div>

              <div className="space-y-3 text-sm border-y border-[#E3E3EE] py-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#5A5A70]">
                    Personnes souhaitées × Récompense
                  </span>
                  <strong className="text-[#12122A]">
                    {targetQuantity} × {rewardPerWorker} pt = {interactionsCost}{" "}
                    pts
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#5A5A70]">
                    Durée ({durationDays} jour{durationDays > 1 ? "s" : ""} × 0,5
                    pt)
                  </span>
                  <strong className="text-[#12122A]">+{durationFee} pts</strong>
                </div>

                <div className="flex items-center justify-between text-xs text-[#5A5A70] pt-2 border-t border-[#E3E3EE]">
                  <span>Rythme estimé</span>
                  <span className="font-bold text-[#12122A]">
                    ~{dailyPacing} personne(s) / jour
                  </span>
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-[#12122A]">
                  Total à débiter :
                </span>
                <span className="text-3xl font-extrabold text-[#5B3DF5]">
                  {totalCost} pts
                </span>
              </div>

              {!isBalanceSufficient && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <p className="font-semibold">
                    Il vous manque {(totalCost - balance).toFixed(1)} pts pour
                    lancer cette campagne.
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/tasks"
                      className="font-bold text-[#5B3DF5] underline"
                    >
                      Gagner des points
                    </Link>
                    <span>•</span>
                    <Link
                      href="/shop"
                      className="font-bold text-[#5B3DF5] underline"
                    >
                      Acheter un pack
                    </Link>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !isBalanceSufficient}
                className="addme-btn addme-btn-primary w-full py-3.5 text-base disabled:opacity-50"
              >
                {submitting ? (
                  <span>Lancement en cours...</span>
                ) : (
                  <>
                    <span>Lancer la campagne ({totalCost} pts)</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
