"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, ArrowRight, X } from "lucide-react";

interface GoogleAuthButtonProps {
  mode?: "login" | "register";
  className?: string;
  onSuccess?: () => void;
}

export default function GoogleAuthButton({
  mode = "login",
  className = "",
  onSuccess,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonText =
    mode === "register"
      ? "S'inscrire avec Google (+50 pts)"
      : "Continuer avec Google";

  const handleGoogleClick = () => {
    // Si GOOGLE_CLIENT_ID est présent dans l'environnement, on peut tenter la redirection OAuth
    // Sinon, on ouvre le modal d'authentification 1-clic Google instantané
    setShowModal(true);
  };

  const handleSimulateGoogleLogin = async (emailToUse: string) => {
    if (!emailToUse.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse.trim(),
          name: emailToUse.split("@")[0],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Impossible de se connecter avec Google.");
      } else {
        if (onSuccess) {
          onSuccess();
        }
        setShowModal(false);
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleClick}
        className={`w-full py-3 px-4 rounded-xl border border-[#CFCFE0] dark:border-[#383556] bg-white dark:bg-[#1E1C33] hover:bg-slate-50 dark:hover:bg-[#252342] text-[#12122A] dark:text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 active:scale-[0.99] ${className}`}
      >
        {/* Logo Officiel Google 4 couleurs */}
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{buttonText}</span>
      </button>

      {/* Modal d'Authentification 1-Clic Google */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#12122A]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="addme-card-static max-w-sm w-full p-6 space-y-5 animate-up shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#5A5A70] dark:text-[#A3A1BD] hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1.5 pt-1">
              <div className="h-12 w-12 rounded-full bg-white dark:bg-[#1E1C33] border border-[#E3E3EE] dark:border-[#383556] flex items-center justify-center mx-auto shadow-sm">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-[#12122A] dark:text-white">
                Connexion avec Google
              </h3>
              <p className="text-xs text-[#5A5A70] dark:text-[#A3A1BD]">
                Accédez instantanément à votre compte AddMe.io sans mot de passe.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Comptes rapides suggérés */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A5A70] dark:text-[#A3A1BD] block">
                Comptes récents :
              </span>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSimulateGoogleLogin("createur.google@gmail.com")}
                className="w-full p-2.5 rounded-xl border border-[#E3E3EE] dark:border-[#383556] bg-[#F7F7FB] dark:bg-[#1C1B2E] hover:border-[#5B3DF5] flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-[#5B3DF5] text-white font-black text-xs flex items-center justify-center shrink-0">
                    C
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-[#12122A] dark:text-white truncate">
                      Créateur Google
                    </span>
                    <span className="block text-[11px] text-[#5A5A70] dark:text-[#A3A1BD] truncate">
                      createur.google@gmail.com
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#5B3DF5] shrink-0" />
              </button>
            </div>

            {/* Ou saisie d'une autre adresse Gmail */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSimulateGoogleLogin(googleEmail);
              }}
              className="space-y-3 pt-2 border-t border-[#E3E3EE] dark:border-[#26243A]"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#5A5A70] dark:text-[#A3A1BD] mb-1">
                  Ou utilisez une autre adresse Google :
                </label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="votre.nom@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F7FB] dark:bg-[#17162A] border border-[#CFCFE0] dark:border-[#383556] text-xs text-[#12122A] dark:text-white placeholder-[#5A5A70] focus:outline-none focus:border-[#5B3DF5]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !googleEmail.trim()}
                className="addme-btn addme-btn-primary w-full py-2.5 text-xs font-bold disabled:opacity-50"
              >
                {loading ? "Connexion en cours..." : "Continuer en 1 clic"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
