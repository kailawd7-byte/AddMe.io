"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Gift,
  Loader2,
} from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const [giftValidation, setGiftValidation] = useState<{
    status: "idle" | "checking" | "valid" | "invalid";
    message?: string;
    multiplier?: number;
    bonusPoints?: number;
    influencerName?: string;
  }>({ status: "idle" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    bonusPoints: number;
    verificationCode?: string;
    verificationToken: string;
    verificationUrl: string;
  } | null>(null);

  // Extraction intelligente de code cadeau même si l'usager colle une URL complète
  const parseGiftCodeInput = (raw: string): string => {
    let text = (raw || "").trim();
    if (
      text.includes("http") ||
      text.includes("?ref=") ||
      text.includes("?code=") ||
      text.includes("&ref=") ||
      text.includes("&code=")
    ) {
      try {
        const urlToParse = text.startsWith("http") ? text : `https://${text}`;
        const url = new URL(urlToParse);
        const extracted = url.searchParams.get("ref") || url.searchParams.get("code");
        if (extracted) {
          return extracted.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        }
      } catch {
        const match = text.match(/[?&](?:ref|code)=([a-zA-Z0-9_-]+)/i);
        if (match && match[1]) {
          return match[1].toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        }
      }
    }
    return text.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  };

  // Vérification de code cadeau
  const verifyCode = async (codeToVerify: string) => {
    const clean = parseGiftCodeInput(codeToVerify);
    if (!clean) {
      setGiftValidation({ status: "idle" });
      return;
    }
    if (clean.length < 3) {
      setGiftValidation({
        status: "invalid",
        message: "Code trop court (3 caractères minimum)",
      });
      return;
    }

    setGiftValidation((prev) => ({ ...prev, status: "checking" }));
    try {
      const res = await fetch(`/api/gift-codes/validate?code=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.valid) {
        setGiftValidation({
          status: "valid",
          message: data.message,
          multiplier: data.multiplier || 4,
          bonusPoints: data.bonusPoints || 200,
          influencerName: data.influencerName,
        });
      } else {
        setGiftValidation({
          status: "invalid",
          message: data.message || "Code cadeau invalide ou expiré.",
        });
      }
    } catch {
      setGiftValidation({
        status: "invalid",
        message: "Impossible de vérifier le code actuellement.",
      });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "google_not_configured") {
        setError(
          "Configuration Google requise : Pour analyser et lister les comptes réels de votre navigateur, ajoutez vos clés GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans le fichier .env."
        );
      }

      // Pré-remplissage automatique via lien d'affiliation ?ref=CODE ou ?code=CODE
      const refParam = params.get("ref") || params.get("code");
      if (refParam) {
        const cleaned = refParam.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        setGiftCode(cleaned);
        verifyCode(cleaned);
      }
    }
  }, []);

  // Détection en direct avec debounce lors de la saisie manuelle du code
  useEffect(() => {
    if (!giftCode) {
      setGiftValidation({ status: "idle" });
      return;
    }
    const timer = setTimeout(() => {
      verifyCode(giftCode);
    }, 450);
    return () => clearTimeout(timer);
  }, [giftCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (typeof window !== "undefined" && email) {
        localStorage.setItem("addme-last-email", email.trim().toLowerCase());
      }

      const payload: { email: string; password: string; giftCode?: string } = {
        email,
        password,
      };

      if (giftCode.trim()) {
        payload.giftCode = giftCode.trim().toUpperCase();
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error || "Une erreur est survenue lors de l'inscription."
        );
      } else {
        const creditedBonus =
          data.bonusPoints ||
          (giftValidation.status === "valid" ? 200 : 50);

        setSuccessData({
          message: data.message,
          bonusPoints: creditedBonus,
          verificationCode: data.verificationCode || data.verificationToken,
          verificationToken: data.verificationToken,
          verificationUrl: data.verificationUrl,
        });
      }
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const isGiftValid = giftValidation.status === "valid";
  const userBonusDisplay = isGiftValid
    ? (giftValidation.bonusPoints ?? 200)
    : 50;

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="addme-card-static w-full max-w-md space-y-6 shadow-xl animate-up">
        <div className="text-center">
          {isGiftValid ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/15 via-[#EEEAFF] to-emerald-500/20 border border-emerald-300 text-emerald-800 text-xs font-extrabold mb-3 shadow-xs">
              <Gift className="h-3.5 w-3.5 text-emerald-600 animate-bounce" />
              <span>+{userBonusDisplay} points offerts (Bonus x{giftValidation.multiplier ?? 4} activé !)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFF] text-[#3A22C8] text-xs font-extrabold mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#5B3DF5]" />
              +50 points offerts à l’inscription
            </div>
          )}
          <h1 className="text-[28px] font-extrabold text-[#12122A] tracking-tight">
            Créer un compte
          </h1>
          <p className="mt-1 text-sm text-[#5A5A70]">
            Rejoignez l’échange d’engagement réel sur TikTok, Instagram et
            YouTube.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successData ? (
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-700 text-center space-y-4 shadow-2xl animate-up">
            <div className="h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Compte créé avec succès !
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
              Vos <strong className="text-amber-400 font-black">+{successData.bonusPoints} points de bienvenue</strong> ont été crédités sur votre compte !
            </p>

            <div className="py-4 px-6 rounded-2xl bg-slate-950 border-2 border-indigo-500/70 shadow-[0_0_25px_rgba(91,61,245,0.3)] space-y-2 inline-block w-full max-w-xs mx-auto">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                Votre code de confirmation :
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-black tracking-[0.25em] text-amber-300 select-all py-1">
                {successData.verificationCode || successData.verificationToken || "VÉRIFIEZ EMAIL"}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-tight">
              Un email contenant ce code à 6 chiffres vous a également été envoyé pour sécuriser votre compte.
            </p>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href={`/verify-email?code=${encodeURIComponent(successData.verificationCode || successData.verificationToken || "")}`}
                className="addme-btn addme-btn-primary w-full py-3.5 text-sm font-bold shadow-lg"
              >
                <span>Confirmer mon adresse email</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-slate-400 hover:text-white py-1.5 transition"
              >
                Accéder directement au tableau de bord &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] mb-1.5">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A5A70]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="createur@exemple.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F7FB] border border-[#CFCFE0] text-sm text-[#12122A] focus:outline-none focus:border-[#5B3DF5] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A5A70]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F7F7FB] border border-[#CFCFE0] text-sm text-[#12122A] focus:outline-none focus:border-[#5B3DF5] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5A5A70] hover:text-[#12122A]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-[11px]">
                <span
                  className={`font-semibold ${
                    hasMinLength ? "text-emerald-600" : "text-[#5A5A70]"
                  }`}
                >
                  ✓ 8+ caractères
                </span>
                <span
                  className={`font-semibold ${
                    hasLetter ? "text-emerald-600" : "text-[#5A5A70]"
                  }`}
                >
                  ✓ 1 lettre
                </span>
                <span
                  className={`font-semibold ${
                    hasNumber ? "text-emerald-600" : "text-[#5A5A70]"
                  }`}
                >
                  ✓ 1 chiffre
                </span>
              </div>
            </div>

            {/* Champ Code Cadeau / Parrainage (Optionnel) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70]">
                  Code Cadeau / Parrainage <span className="text-[10px] lowercase text-[#8A8A9E]">(optionnel)</span>
                </label>
                {isGiftValid && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Bonus x{giftValidation.multiplier ?? 4}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A5A70]">
                  <Gift className={`h-4 w-4 ${isGiftValid ? "text-emerald-600" : "text-[#5A5A70]"}`} />
                </div>
                <input
                  type="text"
                  value={giftCode}
                  onChange={(e) => {
                    const parsed = parseGiftCodeInput(e.target.value);
                    setGiftCode(parsed);
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData("text");
                    const parsed = parseGiftCodeInput(pastedText);
                    if (parsed && parsed !== pastedText) {
                      e.preventDefault();
                      setGiftCode(parsed);
                    }
                  }}
                  placeholder="EX: TIKTOK200, INFLUENCEUR..."
                  className={`w-full pl-10 pr-10 py-3 rounded-xl bg-[#F7F7FB] border text-sm font-mono uppercase tracking-wider focus:outline-none transition-all ${
                    isGiftValid
                      ? "border-emerald-500 bg-emerald-50/30 text-emerald-950 font-bold focus:border-emerald-600"
                      : giftValidation.status === "invalid"
                      ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500"
                      : "border-[#CFCFE0] text-[#12122A] focus:border-[#5B3DF5] focus:bg-white"
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  {giftValidation.status === "checking" && (
                    <Loader2 className="h-4 w-4 animate-spin text-[#5B3DF5]" />
                  )}
                  {isGiftValid && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  {giftValidation.status === "invalid" && (
                    <XCircle className="h-4 w-4 text-rose-500" />
                  )}
                </div>
              </div>

              {/* Message de statut en direct */}
              {giftValidation.status === "valid" && (
                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-emerald-700 font-semibold leading-tight">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{giftValidation.message}</span>
                </div>
              )}
              {giftValidation.status === "invalid" && (
                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-rose-600 font-semibold leading-tight">
                  <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{giftValidation.message}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || giftValidation.status === "checking"}
              className="addme-btn addme-btn-primary w-full py-3.5 transition-all shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span>Création en cours...</span>
              ) : (
                <>
                  <span>
                    Créer mon compte · {userBonusDisplay} pts offerts {isGiftValid ? "(Bonus x4)" : ""}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Option Google placée sous le bouton Créer mon compte */}
          <div className="space-y-4 pt-1">
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-[#E3E3EE] dark:border-[#26243A] w-full" />
              <span className="bg-white dark:bg-[#151426] px-3 text-[11px] font-bold uppercase tracking-wider text-[#5A5A70] dark:text-[#A3A1BD] absolute">
                ou
              </span>
            </div>

            <GoogleAuthButton mode="register" emailHint={email} />
          </div>
        </div>
      )}

        <div className="text-center text-xs text-[#5A5A70] pt-2 border-t border-[#E3E3EE]">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="font-bold text-[#5B3DF5] hover:underline"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
