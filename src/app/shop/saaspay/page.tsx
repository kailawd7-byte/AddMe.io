"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Smartphone, CheckCircle2, ShieldCheck, ArrowLeft, Loader2, Sparkles, CreditCard } from "lucide-react";

function SaasPayCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session_id") || "";
  const packId = searchParams.get("pack_id") || "";
  const amount = searchParams.get("amount") || "3000";
  const points = searchParams.get("points") || "100";

  const [operator, setOperator] = useState<"WAVE" | "ORANGE" | "MTN" | "MOOV">("WAVE");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const operators = [
    { id: "WAVE", name: "Wave Mobile Money", color: "from-sky-500 to-blue-600", border: "border-sky-500/50" },
    { id: "ORANGE", name: "Orange Money", color: "from-orange-500 to-amber-600", border: "border-orange-500/50" },
    { id: "MTN", name: "MTN MoMo", color: "from-yellow-400 to-amber-500", border: "border-yellow-500/50" },
    { id: "MOOV", name: "Moov Money", color: "from-blue-600 to-indigo-700", border: "border-blue-500/50" },
  ];

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      setError("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulation / validation du webhook SaasPay
      const res = await fetch(`/api/shop/simulate-success?session_id=${sessionId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        router.push(`/shop?success=true&provider=saaspay&points=${points}`);
      } else {
        setError(data.error || "Échec de validation du paiement Mobile Money.");
      }
    } catch {
      setError("Erreur de connexion au serveur de paiement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à la boutique
        </Link>

        <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">SaaSPay Mobile Money</h2>
              <span className="text-xs text-slate-400">Paiement sécurisé en Afrique</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-white block">{Number(amount).toLocaleString("fr-FR")} FCFA</span>
            <span className="text-xs text-emerald-400 font-bold">+{points} points crédités</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleConfirmPayment} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
              1. Choisissez votre opérateur
            </label>
            <div className="grid grid-cols-2 gap-3">
              {operators.map((op) => (
                <button
                  type="button"
                  key={op.id}
                  onClick={() => setOperator(op.id as any)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    operator === op.id
                      ? `bg-slate-800/90 ${op.border} shadow-lg ring-1 ring-indigo-500`
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-tr ${op.color} mb-2`} />
                  <span className="text-xs font-bold text-white block">{op.name}</span>
                  <span className="text-[10px] text-slate-400">Paiement instantané</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              2. Numéro de téléphone Mobile Money
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs font-mono">
                📱
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +225 07 00 00 00 00 ou 05..."
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Une demande de débit sera envoyée directement sur votre compte {operators.find((o) => o.id === operator)?.name}.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-2 text-slate-400">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Garantie & Sécurité
            </div>
            <p className="text-[11px] leading-relaxed">
              Vos points sont crédités instantanément et de façon atomique à votre solde AddMe.io dès la validation du débit.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validation du Mobile Money en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Payer {Number(amount).toLocaleString("fr-FR")} FCFA & Obtenir +{points} points
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SaasPayCheckoutPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-slate-400 text-xs">Chargement SaaSPay...</div>}>
      <SaasPayCheckoutContent />
    </Suspense>
  );
}
