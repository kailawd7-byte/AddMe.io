"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Coins, ArrowRight, KeyRound, Sparkles, ShieldCheck } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || searchParams.get("code") || "";

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
        setErrorMessage(data.error || "Code ou lien de vérification invalide.");
      }
    } catch {
      setErrorMessage("Impossible de joindre le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Si un token/code est déjà dans l'URL, on le valide automatiquement
    if (tokenParam) {
      executeVerification(tokenParam);
      setCheckingStatus(false);
      return;
    }

    // 2. Sinon, on vérifie l'état de la session utilisateur
    const checkAuthStatus = async () => {
      try {
        const res = await fetch("/api/auth/verify-email");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUserEmail(data.email);
            if (data.isEmailVerified) {
              setSuccess(true);
              setSuccessMessage("Votre adresse email est déjà pleinement vérifiée et active !");
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
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center space-y-4">
        <div className="h-10 w-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Vérification de votre compte...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center space-y-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {success ? (
        <div className="space-y-6">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
              <Coins className="h-4 w-4 text-amber-400" />
              +{bonusPoints} Points débloqués !
            </div>
            <h2 className="text-2xl font-extrabold text-white">Email vérifié avec succès</h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              {successMessage || "Votre compte est maintenant vérifié. Vos points de bienvenue ont été crédités de manière immuable."}
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Link
              href="/dashboard/social-accounts"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              Lier un compte social
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="text-xs text-slate-400 hover:text-white py-1"
            >
              Accéder au tableau de bord
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
            <KeyRound className="h-7 w-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Bonus de +10 points à la validation
            </div>
            <h2 className="text-2xl font-extrabold text-white">Vérification de l'email</h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              {userEmail ? (
                <>
                  Pour activer votre compte <strong className="text-slate-200">{userEmail}</strong>, entrez votre code de vérification ci-dessous.
                </>
              ) : (
                "Entrez le code de vérification reçu pour débloquer votre solde de bienvenue."
              )}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulaire de code */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 text-left mb-1.5">
                Code de vérification (6 chiffres ou token)
              </label>
              <input
                type="text"
                required
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Ex : 482910"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono text-lg tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {demoCode && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Code généré pour votre compte :</span>
                <span className="font-mono font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800">
                  {demoCode}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Valider mon code (+10 pts)
                </>
              )}
            </button>
          </form>

          {/* Bouton de secours / validation directe si connecté */}
          {userEmail && (
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleInstantVerification}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Activer mon compte en 1 clic
              </button>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Continuer vers le tableau de bord sans bonus
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
