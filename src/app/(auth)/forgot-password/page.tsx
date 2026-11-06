"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; resetUrl?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
      } else {
        setSuccessInfo({
          message: data.message,
          resetUrl: data.resetUrl,
        });
      }
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-white">Mot de passe oublié</h2>
          <p className="mt-2 text-sm text-slate-400">
            Saisissez votre adresse email pour recevoir un lien de réinitialisation sécurisé.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successInfo ? (
          <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-300">{successInfo.message}</p>
            {successInfo.resetUrl && (
              <div className="pt-2">
                <Link
                  href={successInfo.resetUrl}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md"
                >
                  Accéder directement au formulaire de réinitialisation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            <Link href="/login" className="block text-xs text-slate-400 hover:text-white pt-2">
              Retour à la page de connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre-email@exemple.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Envoyer le lien de réinitialisation
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-400">
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

