"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
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
  const [platform, setPlatform] = useState<"TIKTOK" | "INSTAGRAM" | "YOUTUBE">(
    "TIKTOK"
  );
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/social-accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
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
        setMessage({
          type: "error",
          text: data.error || "Impossible d'ajouter le compte.",
        });
      } else {
        setMessage({ type: "success", text: data.message });
        setIdentifier("");
        await fetchAccounts();
      }
    } catch {
      setMessage({
        type: "error",
        text: "Erreur réseau. Veuillez réessayer.",
      });
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
        setMessage({
          type: "error",
          text: data.error || "Échec de la vérification.",
        });
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
    if (!confirm("Retirer ce compte social de votre profil AddMe.io ?")) return;

    setDeletingId(accountId);
    setMessage(null);

    try {
      const res = await fetch(`/api/social-accounts/${accountId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "Impossible de supprimer le compte.",
        });
      } else {
        setMessage({ type: "success", text: data.message });
        await fetchAccounts();
      }
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la suppression." });
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex-1 max-w-[1100px] w-full mx-auto px-6 py-8 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-[32px] font-extrabold text-[#12122A] m-0 tracking-tight">
          Comptes liés
        </h1>
        <p className="text-sm text-[#5A5A70] mt-0.5">
          Associez vos profils TikTok, Instagram et YouTube sans jamais partager
          vos mots de passe.
        </p>
      </div>

      {/* Bandeau d'explication */}
      <div
        className="addme-card-static text-sm text-[#12122A] leading-relaxed"
        style={{ background: "#EEEAFF", borderColor: "#D9D2FF" }}
      >
        <strong>Comment fonctionne la vérification sans mot de passe ?</strong>{" "}
        Ajoutez votre pseudo ci-dessous, copiez le code unique généré (ex:{" "}
        <code className="font-mono font-bold text-[#3A22C8]">ADDME-8F92A</code>)
        dans la biographie de votre profil TikTok, Instagram ou YouTube, puis
        cliquez sur <strong>Vérifier la propriété</strong>.
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne Gauche : Ajouter un compte */}
        <div className="lg:col-span-5 addme-card-static space-y-5">
          <div className="flex items-center gap-2 font-extrabold text-base text-[#12122A]">
            <Plus className="h-5 w-5 text-[#5B3DF5]" />
            <span>Associer un nouveau profil</span>
          </div>

          <form onSubmit={handleAddAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] mb-2">
                Réseau social
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["TIKTOK", "INSTAGRAM", "YOUTUBE"] as const).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setPlatform(net)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all ${
                      platform === net
                        ? "bg-[#12122A] border-[#12122A] text-white"
                        : "bg-[#F7F7FB] border-[#E3E3EE] text-[#5A5A70] hover:border-[#5B3DF5]"
                    }`}
                  >
                    {net === "TIKTOK"
                      ? "TikTok"
                      : net === "INSTAGRAM"
                      ? "Instagram"
                      : "YouTube"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] mb-1.5">
                {platform === "TIKTOK"
                  ? "Pseudo TikTok"
                  : platform === "INSTAGRAM"
                  ? "Pseudo Instagram"
                  : "Identifiant de la chaîne YouTube"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5A5A70] font-bold text-sm">
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
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#F7F7FB] border border-[#CFCFE0] text-sm text-[#12122A] focus:outline-none focus:border-[#5B3DF5] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="addme-btn addme-btn-primary w-full"
            >
              {submitting ? (
                <span>Génération du code...</span>
              ) : (
                <>
                  <span>Ajouter ce compte</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Colonne Droite : Liste des comptes liés */}
        <div className="lg:col-span-7 addme-card-static space-y-4">
          <div className="flex items-center justify-between">
            <b className="text-base font-extrabold text-[#12122A]">
              Mes comptes enregistrés ({accounts.length})
            </b>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-[#5A5A70]">
              Chargement...
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#5A5A70] border-t border-[#E3E3EE]">
              Aucun compte associé pour le moment. Utilisez le formulaire à
              gauche pour ajouter TikTok, Instagram ou YouTube.
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((acc) => {
                const isVerified = acc.status === "VERIFIED";
                const shortCode =
                  acc.platform === "TIKTOK"
                    ? "TT"
                    : acc.platform === "INSTAGRAM"
                    ? "IG"
                    : "YT";

                return (
                  <div
                    key={acc.id}
                    className={`p-4 rounded-2xl border ${
                      isVerified
                        ? "bg-[#F7F7FB] border-[#E3E3EE]"
                        : "bg-[#EEEAFF]/40 border-[#D9D2FF]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="addme-thumb">{shortCode}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <b className="text-base font-extrabold text-[#12122A]">
                              @{acc.identifier}
                            </b>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E3E3EE] text-[#5B3DF5]">
                              {acc.platform}
                            </span>
                          </div>
                          <span className="text-xs text-[#5A5A70]">
                            Ajouté le{" "}
                            {new Date(acc.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                            <ShieldCheck className="h-4 w-4" />
                            Vérifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                            <Clock className="h-4 w-4" />
                            Code en attente
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(acc.id)}
                          disabled={deletingId === acc.id}
                          className="p-2 rounded-xl text-[#5A5A70] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer ce compte"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {!isVerified && (
                      <div className="mt-4 pt-4 border-t border-[#D9D2FF] space-y-3">
                        <p className="text-xs text-[#12122A]">
                          Placez ce code dans la biographie de votre profil{" "}
                          <strong>@{acc.identifier}</strong> puis validez :
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                          <div className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-[#CFCFE0] font-mono font-bold text-sm text-[#3A22C8]">
                            <span>{acc.verificationCode}</span>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(acc.verificationCode)
                              }
                              className="p-1.5 rounded-lg hover:bg-[#F7F7FB] text-[#5B3DF5]"
                            >
                              {copiedCode === acc.verificationCode ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={verifyingId === acc.id}
                            onClick={() => handleVerify(acc.id)}
                            className="addme-btn addme-btn-primary text-xs"
                          >
                            {verifyingId === acc.id
                              ? "Vérification..."
                              : "Vérifier la propriété"}
                          </button>
                        </div>
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
