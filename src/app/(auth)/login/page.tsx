"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldAlert,
} from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "google_not_configured") {
        setError(
          "Configuration Google requise : Pour analyser et lister les comptes réels de votre navigateur (comme sur votre capture d'écran), ajoutez vos clés GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans le fichier .env."
        );
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLockedNotice(null);
    setLoading(true);

    try {
      if (typeof window !== "undefined" && email) {
        localStorage.setItem("addme-last-email", email.trim().toLowerCase());
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setLockedNotice(data.error);
        } else {
          setError(data.error || "Adresse email ou mot de passe incorrect.");
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="addme-card-static w-full max-w-md space-y-6 shadow-xl animate-up">
        <div className="text-center">
          <h1 className="text-[28px] font-extrabold text-[#12122A] tracking-tight">
            Connexion
          </h1>
          <p className="mt-1 text-sm text-[#5A5A70]">
            Accédez à votre tableau de bord AddMe.io.
          </p>
        </div>

        {lockedNotice && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <strong className="block font-bold">
                Protection anti-bruteforce
              </strong>
              <span>{lockedNotice}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5A5A70]">
                Mot de passe
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#5B3DF5] hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A5A70]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="addme-btn addme-btn-primary w-full py-3.5"
          >
            {loading ? (
              <span>Connexion en cours...</span>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Option Google placée sous le bouton Se connecter */}
        <div className="space-y-4 pt-1">
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[#E3E3EE] dark:border-[#26243A] w-full" />
            <span className="bg-white dark:bg-[#151426] px-3 text-[11px] font-bold uppercase tracking-wider text-[#5A5A70] dark:text-[#A3A1BD] absolute">
              ou
            </span>
          </div>

          <GoogleAuthButton mode="login" emailHint={email} />
        </div>

        <div className="text-center text-xs text-[#5A5A70] pt-2 border-t border-[#E3E3EE]">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-bold text-[#5B3DF5] hover:underline"
          >
            Créer un compte (+50 points offerts)
          </Link>
        </div>
      </div>
    </div>
  );
}
