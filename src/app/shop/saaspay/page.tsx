"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import {
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";

function SaasPayCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session_id") || "";
  const amount = searchParams.get("amount") || "3000";
  const points = searchParams.get("points") || "100";

  const [operator, setOperator] = useState<"WAVE" | "ORANGE" | "MTN" | "MOOV">(
    "WAVE"
  );
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const operators = [
    { id: "WAVE", name: "Wave Mobile Money", badge: "Instant" },
    { id: "ORANGE", name: "Orange Money", badge: "USSD / App" },
    { id: "MTN", name: "MTN MoMo", badge: "USSD / App" },
    { id: "MOOV", name: "Moov Money", badge: "Instant" },
  ] as const;

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setError("Veuillez saisir un numéro de téléphone Mobile Money valide.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/shop/simulate-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push(
          `/shop?success=true&session_id=${encodeURIComponent(
            sessionId
          )}&provider=saaspay&points=${points}`
        );
      } else {
        setError(
          data.error || "Échec de validation du paiement Mobile Money."
        );
      }
    } catch {
      setError("Erreur de connexion au serveur de paiement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="addme-card-static w-full max-w-lg space-y-6 shadow-xl">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#5A5A70] hover:text-[#12122A]"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la boutique
        </Link>

        <div className="flex items-center justify-between border-b border-[#E3E3EE] pb-4">
          <div className="flex items-center gap-3">
            <div className="addme-thumb">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#12122A]">
                SaaSPay Mobile Money
              </h2>
              <span className="text-xs text-[#5A5A70]">
                Paiement Mobile Money sécurisé (Afrique)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-[#12122A] block">
              {Number(amount).toLocaleString("fr-FR")} FCFA
            </span>
            <span className="text-xs text-[#5B3DF5] font-extrabold">
              +{points} points
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirmPayment} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] mb-2">
              1. Choisissez votre opérateur
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {operators.map((op) => {
                const active = operator === op.id;
                return (
                  <button
                    type="button"
                    key={op.id}
                    onClick={() => setOperator(op.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      active
                        ? "bg-[#EEEAFF] border-[#5B3DF5] text-[#3A22C8]"
                        : "bg-[#F7F7FB] border-[#E3E3EE] text-[#12122A] hover:border-[#5B3DF5]"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-extrabold block">
                        {op.name}
                      </span>
                      <span className="text-[10px] opacity-75">{op.badge}</span>
                    </div>
                    {active && (
                      <CheckCircle2 className="w-4 h-4 text-[#5B3DF5]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] mb-1.5">
              2. Votre numéro de téléphone Mobile Money
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex : +225 07 00 00 00 00 ou +221 77..."
              className="w-full px-4 py-3 rounded-xl bg-[#F7F7FB] border border-[#CFCFE0] text-sm text-[#12122A] focus:outline-none focus:border-[#5B3DF5] focus:bg-white"
            />
          </div>

          <div
            className="p-4 rounded-xl border text-xs text-[#12122A] space-y-1"
            style={{ background: "#EEEAFF", borderColor: "#D9D2FF" }}
          >
            <div className="flex items-center gap-1.5 font-extrabold text-[#3A22C8]">
              <ShieldCheck className="w-4 h-4 text-[#5B3DF5]" />
              Crédit automatique & immédiat
            </div>
            <p className="text-[#5A5A70]">
              Vos +{points} points sont ajoutés instantanément à votre solde dès
              confirmation.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="addme-btn addme-btn-primary w-full py-3.5 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Traitement en cours...</span>
              </>
            ) : (
              <span>
                Payer {Number(amount).toLocaleString("fr-FR")} FCFA (+{points}{" "}
                pts)
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SaasPayCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B3DF5]" />
        </div>
      }
    >
      <SaasPayCheckoutContent />
    </Suspense>
  );
}
