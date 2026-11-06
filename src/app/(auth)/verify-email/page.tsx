"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Coins, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [bonusPoints, setBonusPoints] = useState(10);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage("Jeton de vérification introuvable dans le lien.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (res.ok) {
          setSuccess(true);
          setMessage(data.message);
          if (data.bonusPoints) setBonusPoints(data.bonusPoints);
        } else {
          setSuccess(false);
          setMessage(data.error || "Ce lien de vérification est invalide ou expiré.");
        }
      } catch {
        setSuccess(false);
        setMessage("Impossible de contacter le serveur.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center space-y-6">
      {loading ? (
        <div className="py-12 space-y-4">
          <div className="h-12 w-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-lg font-semibold text-white">Vérification de votre email...</h3>
          <p className="text-xs text-slate-400">Attribution de vos points de bienvenue en cours.</p>
        </div>
      ) : success ? (
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
              Votre compte est maintenant pleinement actif. Vos {bonusPoints} points ont été inscrits de façon immuable dans votre ledger.
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Link
              href="/dashboard/social-accounts"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              Lier mon compte TikTok ou YouTube
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
          <div className="h-16 w-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <AlertCircle className="h-9 w-9" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Échec de la validation</h2>
            <p className="mt-2 text-sm text-slate-400">{message}</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Retour à la connexion
          </Link>
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
