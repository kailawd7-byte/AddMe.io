"use client";

import { useEffect, useState } from "react";
import {
  Share2,
  Plus,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  ExternalLink,
  Lock,
  ArrowRight,
  Info,
} from "lucide-react";

interface SocialAccount {
  id: string;
  platform: "TIKTOK" | "YOUTUBE" | "INSTAGRAM";
  identifier: string;
  verificationCode: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  verifiedAt: string | null;
  createdAt: string;
}

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [platform, setPlatform] = useState<"TIKTOK" | "YOUTUBE" | "INSTAGRAM">("TIKTOK");
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Feedback messages
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/social-accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/social-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, identifier }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Impossible d'ajouter le compte." });
      } else {
        setMessage({ type: "success", text: data.message });
        setIdentifier("");
        await fetchAccounts();
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau. Veuillez réessayer." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (accountId: string) => {
    setVerifyingId(accountId);
    setMessage(null);

    try {
      const res = await fetch(`/api/social-accounts/${accountId}/verify`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Échec de la vérification." });
      } else {
        setMessage({ type: "success", text: data.message });
        await fetchAccounts();
      }
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la vérification." });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce compte social ?")) return;

    setDeletingId(accountId);
    setMessage(null);

    try {
      const res = await fetch(`/api/social-accounts/${accountId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Impossible de retirer le compte." });
      } else {
        setMessage({ type: "success", text: "Compte retiré avec succès." });
        await fetchAccounts();
      }
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la suppression." });
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Share2 className="h-7 w-7 text-indigo-400" />
          Liaison de comptes sociaux
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Liez vos comptes TikTok et YouTube pour publier des campagnes de vidéos. Chaque compte est unique à un utilisateur et vérifié sans jamais demander de mot de passe.
        </p>
      </div>

      {/* Security Disclaimer Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs sm:text-sm text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold">
          <Lock className="h-4 w-4 text-emerald-400" />
          Règles de sécurité absolues :
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400 pt-1">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span><strong>Aucun mot de passe :</strong> Nous ne demandons jamais d'accès ni d'identifiants à vos réseaux sociaux.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span><strong>Preuve par code bio :</strong> Un code temporaire à placer dans votre profil garantit votre propriété légitime.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span><strong>Unicité stricte :</strong> Un compte social ne peut être lié qu'à un seul utilisateur sur AddMe.io.</span>
          </li>
        </ul>
      </div>

      {/* Global message banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Add form (1 col) + Connected accounts (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Formulaire d'ajout */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Plus className="h-5 w-5 text-indigo-400" />
            Lier un nouveau compte
          </div>

          <form onSubmit={handleAddAccount} className="space-y-5">
            {/* Platform Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Sélectionnez le réseau social
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform("TIKTOK")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    platform === "TIKTOK"
                      ? "bg-pink-500/20 border-pink-500/60 text-pink-300 shadow-md"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  TikTok
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("INSTAGRAM")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    platform === "INSTAGRAM"
                      ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-pink-500 text-pink-200 shadow-md"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500" />
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("YOUTUBE")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    platform === "YOUTUBE"
                      ? "bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-md"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  YouTube
                </button>
              </div>
            </div>

            {/* Identifier input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {platform === "TIKTOK"
                  ? "Pseudo TikTok"
                  : platform === "INSTAGRAM"
                  ? "Pseudo Instagram"
                  : "Identifiant de la chaîne YouTube"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-medium text-sm">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    platform === "TIKTOK"
                      ? "mon_pseudo_tiktok"
                      : platform === "INSTAGRAM"
                      ? "mon_pseudo_instagram"
                      : "MaChaineYouTube"
                  }
                  className="w-full pl-8 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Entrez le pseudo sans espaces. Un code unique sera généré.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Ajouter le compte
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Connected Accounts List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Mes comptes enregistrés</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                {accounts.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Chargement de vos comptes...
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
              <Share2 className="h-10 w-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">Aucun compte social associé</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ajoutez votre premier compte TikTok ou YouTube à gauche pour commencer à publier des campagnes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => {
                const isVerified = acc.status === "VERIFIED";
                const isTikTok = acc.platform === "TIKTOK";
                const isInstagram = acc.platform === "INSTAGRAM";

                return (
                  <div
                    key={acc.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                      isVerified
                        ? "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                        : "bg-slate-900/95 border-amber-500/30 shadow-lg shadow-amber-500/5"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Account details */}
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white ${
                            isTikTok
                              ? "bg-gradient-to-tr from-pink-600 to-rose-400 shadow-md shadow-pink-500/20"
                              : isInstagram
                              ? "bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 shadow-md shadow-pink-500/20"
                              : "bg-gradient-to-tr from-rose-600 to-red-500 shadow-md shadow-rose-500/20"
                          }`}
                        >
                          {isTikTok ? "TT" : isInstagram ? "IG" : "YT"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">
                              @{acc.identifier}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isTikTok
                                  ? "bg-pink-500/20 text-pink-300"
                                  : isInstagram
                                  ? "bg-purple-500/20 text-pink-200 border border-pink-500/30"
                                  : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {acc.platform}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            Ajouté le {new Date(acc.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>

                      {/* Right: Status badge & Actions */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {isVerified ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Vérifié</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                            <Clock className="h-4 w-4 text-amber-400" />
                            <span>Code en attente</span>
                          </div>
                        )}

                        <button
                          onClick={() => handleDelete(acc.id)}
                          disabled={deletingId === acc.id}
                          title="Supprimer ce compte"
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Pending Verification Instructions Banner */}
                    {!isVerified && (
                      <div className="mt-5 pt-5 border-t border-slate-800/80 space-y-4">
                        <div className="text-xs text-slate-300 leading-relaxed">
                          <strong>Étape obligatoire :</strong> Pour prouver que vous êtes le propriétaire du compte{" "}
                          <span className="text-white font-medium">@{acc.identifier}</span>, copiez ce code et placez-le dans la <strong>biographie</strong> ou <strong>description</strong> de votre profil {acc.platform === "TIKTOK" ? "TikTok" : acc.platform === "INSTAGRAM" ? "Instagram" : "YouTube"}.
                        </div>

                        {/* Code Copy Box */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <div className="flex-1 flex items-center justify-between px-4 py-2.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-sm text-indigo-300">
                            <span>{acc.verificationCode}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(acc.verificationCode)}
                              className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Copier le code"
                            >
                              {copiedCode === acc.verificationCode ? (
                                <Check className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleVerify(acc.id)}
                            disabled={verifyingId === acc.id}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                          >
                            {verifyingId === acc.id ? (
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4" />
                                Vérifier la propriété
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Astuce : Dès que la vérification est réussie, vous pourrez immédiatement supprimer le code de votre bio.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

