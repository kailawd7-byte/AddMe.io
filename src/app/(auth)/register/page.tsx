"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    verificationCode?: string;
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
        setError(
          data.error || "Une erreur est survenue lors de l'inscription."
        );
      } else {
        setSuccessData({
          message: data.message,
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

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="addme-card-static w-full max-w-md space-y-6 shadow-xl animate-up">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFF] text-[#3A22C8] text-xs font-extrabold mb-3">
            <Sparkles className="h-3.5 w-3.5 text-[#5B3DF5]" />
            +50 points offerts à l’inscription
          </div>
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
          <div className="p-6 rounded-2xl bg-[#EEEAFF] border border-[#D9D2FF] text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-white text-[#5B3DF5] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-extrabold text-[#12122A]">
              Compte créé avec succès !
            </h3>
            <p className="text-xs text-[#5A5A70] leading-relaxed">
              Vos <strong>+50 points de bienvenue</strong> ont été crédités ! Voici votre code de vérification pour sécuriser votre compte :
            </p>
            <div className="py-2.5 px-5 rounded-xl bg-white border border-[#CFCFE0] inline-block font-mono text-xl font-extrabold tracking-widest text-[#3A22C8]">
              {successData.verificationCode}
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href={`/verify-email?code=${successData.verificationToken}`}
                className="addme-btn addme-btn-primary w-full"
              >
                <span>Confirmer mon adresse email</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-[#5A5A70] hover:text-[#12122A] py-2"
              >
                Accéder au tableau de bord
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bouton Inscription Google 1-Clic */}
            <GoogleAuthButton mode="register" />

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#E3E3EE] dark:border-[#26243A] w-full" />
              <span className="bg-white dark:bg-[#151426] px-3 text-[11px] font-bold uppercase tracking-wider text-[#5A5A70] dark:text-[#A3A1BD] absolute">
                ou avec votre email
              </span>
            </div>

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

            <button
              type="submit"
              disabled={loading}
              className="addme-btn addme-btn-primary w-full py-3.5"
            >
              {loading ? (
                <span>Création en cours...</span>
              ) : (
                <>
                  <span>Créer mon compte · 50 pts offerts</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
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
