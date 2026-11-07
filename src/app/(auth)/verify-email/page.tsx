"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Coins,
  ArrowRight,
  KeyRound,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const tokenParam =
    searchParams.get("token") || searchParams.get("code") || "";

  const [inputCode, setInputCode] = useState(tokenParam);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [bonusPoints, setBonusPoints] = useState(10);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const executeVerification = async (codeToSubmit: string) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToSubmit, token: codeToSubmit }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setSuccessMessage(data.message);
        if (data.bonusPoints) setBonusPoints(data.bonusPoints);
      } else {
        setErrorMessage(
          data.error || "Code ou lien de vérification invalide."
        );
      }
    } catch {
      setErrorMessage(
        "Impossible de joindre le serveur. Vérifiez votre connexion."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenParam) {
      executeVerification(tokenParam);
      setCheckingStatus(false);
      return;
    }

    const checkAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth/verify-email");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUserEmail(data.email);
            if (data.isEmailVerified) {
              setSuccess(true);
              setSuccessMessage(
                "Votre adresse email est déjà pleinement vérifiée et active !"
              );
            } else if (data.activeCode) {
              setDemoCode(data.activeCode);
              setInputCode(data.activeCode);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkAuthStatus();
  }, [tokenParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setErrorMessage("Veuillez saisir votre code de vérification.");
      return;
    }
    executeVerification(inputCode.trim());
  };

  const handleInstantVerification = () => {
    executeVerification(demoCode || "DIRECT_AUTH");
  };

  if (checkingStatus) {
    return (
      <div className="addme-card-static w-full max-w-md text-center space-y-4 shadow-xl">
        <div className="h-10 w-10 border-3 border-[#5B3DF5] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#5A5A70]">Vérification de votre compte...</p>
      </div>
    );
  }

  return (
    <div className="addme-card-static w-full max-w-md text-center space-y-6 shadow-xl animate-up">
      {success ? (
        <div className="space-y-5">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFF] text-[#3A22C8] text-xs font-extrabold mb-3">
              <Coins className="h-4 w-4 text-[#5B3DF5]" />+{bonusPoints} Points
              débloqués !
            </div>
            <h2 className="text-2xl font-extrabold text-[#12122A]">
              Email vérifié avec succès
            </h2>
            <p className="mt-2 text-sm text-[#5A5A70] leading-relaxed">
              {successMessage ||
                "Votre compte est maintenant vérifié. Vos points de bienvenue ont été crédités."}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/dashboard/social-accounts"
              className="addme-btn addme-btn-primary w-full"
            >
              <span>Lier un compte TikTok, Instagram ou YouTube</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-bold text-[#5A5A70] hover:text-[#12122A] py-1"
            >
              Accéder au tableau de bord
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="h-14 w-14 rounded-2xl bg-[#EEEAFF] text-[#5B3DF5] flex items-center justify-center mx-auto">
            <KeyRound className="h-7 w-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFF] text-[#3A22C8] text-xs font-extrabold mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#5B3DF5]" />
              Bonus de +50 points à l'inscription
            </div>
            <h2 className="text-2xl font-extrabold text-[#12122A]">
              Vérification de l’email
            </h2>
            <p className="mt-1.5 text-xs text-[#5A5A70] leading-relaxed">
              {userEmail ? (
                <>
                  Pour activer votre compte{" "}
                  <strong className="text-[#12122A]">{userEmail}</strong>,
                  entrez votre code de vérification à 6 chiffres ci-dessous.
                </>
              ) : (
                "Entrez votre code de vérification à 6 chiffres pour débloquer votre solde de bienvenue."
              )}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 text-left">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] text-left mb-1.5">
                Code de vérification (6 chiffres)
              </label>
              <input
                type="text"
                required
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Ex : 482910"
                className="w-full px-4 py-3 bg-[#F7F7FB] border border-[#CFCFE0] rounded-xl text-center font-mono text-lg font-extrabold tracking-widest text-[#12122A] focus:outline-none focus:border-[#5B3DF5] focus:bg-white"
              />
            </div>

            {demoCode && (
              <div className="p-3 rounded-xl bg-[#EEEAFF] border border-[#D9D2FF] text-xs text-[#12122A] flex items-center justify-between">
                <span>Code de votre compte :</span>
                <span className="font-mono font-extrabold text-[#3A22C8] px-2.5 py-0.5 rounded bg-white border border-[#CFCFE0]">
                  {demoCode}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="addme-btn addme-btn-primary w-full py-3.5"
            >
              {loading ? (
                <span>Validation en cours...</span>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Valider mon code (+50 pts)</span>
                </>
              )}
            </button>
          </form>

          {userEmail && (
            <div className="pt-2 border-t border-[#E3E3EE]">
              <button
                type="button"
                onClick={handleInstantVerification}
                disabled={loading}
                className="addme-btn addme-btn-ghost w-full text-xs py-2.5"
              >
                Activer mon compte en 1 clic
              </button>
            </div>
          )}

          <div>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-[#5A5A70] hover:text-[#12122A]"
            >
              Continuer vers le tableau de bord
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <Suspense
        fallback={
          <div className="h-10 w-10 border-3 border-[#5B3DF5] border-t-transparent rounded-full animate-spin" />
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
