"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    verificationToken: string;
    verificationUrl: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de l'inscription.");
      } else {
        setSuccessData({
          message: data.message,
          verificationToken: data.verificationToken,
          verificationUrl: data.verificationUrl,
        });
      }
    } catch {
      setError("Impossible de contacter le serveur. Veuillez vérifier votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            +10 points offerts à l'inscription
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Créer un compte
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Rejoignez la communauté d'échange d'engagement entre créateurs.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successData ? (
          <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Compte créé avec succès !</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pour débloquer vos <strong>10 points de bienvenue</strong> et publier vos premières vidéos, validez votre adresse email.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href={`/verify-email?token=${successData.verificationToken}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
              >
                Valider mon email maintenant (+10 pts)
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="w-full text-xs text-slate-400 hover:text-white py-2"
              >
                Accéder au tableau de bord sans bonus pour l'instant
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
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
                    placeholder="createur@exemple.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="w-full pl-10 pr-10 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Criteria */}
                {password && (
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400" : "text-slate-500"}`}>
                      <CheckCircle2 className="h-3 w-3" /> Au moins 8 caractères
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLetter ? "text-emerald-400" : "text-slate-500"}`}>
                      <CheckCircle2 className="h-3 w-3" /> Contient au moins une lettre
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-400" : "text-slate-500"}`}>
                      <CheckCircle2 className="h-3 w-3" /> Contient au moins un chiffre
                    </div>
                  </div>
                )}
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
                  Créer mon compte
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-400">
              Déjà inscrit ?{" "}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
                Se connecter
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

