"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface SupportedOperator {
  id: string;
  network: string;
  name: string;
  country: string;
  countryName: string;
  badge: string;
  prefix: string;
}

const OPERATORS: SupportedOperator[] = [
  { id: "MTN_BJ", network: "mtn_bj", name: "MTN MoMo", country: "BJ", countryName: "Bénin", badge: "Push direct", prefix: "+229" },
  { id: "MOOV_BJ", network: "moov_bj", name: "Moov Money", country: "BJ", countryName: "Bénin", badge: "Push direct", prefix: "+229" },
  { id: "WAVE_CI", network: "wave_ci", name: "Wave CI", country: "CI", countryName: "Côte d'Ivoire", badge: "Instantané", prefix: "+225" },
  { id: "ORANGE_CI", network: "orange_ci", name: "Orange Money", country: "CI", countryName: "Côte d'Ivoire", badge: "USSD / App", prefix: "+225" },
  { id: "MTN_CI", network: "mtn_ci", name: "MTN MoMo", country: "CI", countryName: "Côte d'Ivoire", badge: "Push USSD", prefix: "+225" },
  { id: "MOOV_CI", network: "moov_ci", name: "Moov Money", country: "CI", countryName: "Côte d'Ivoire", badge: "Push direct", prefix: "+225" },
  { id: "WAVE_SN", network: "wave_sn", name: "Wave SN", country: "SN", countryName: "Sénégal", badge: "Instantané", prefix: "+221" },
  { id: "ORANGE_SN", network: "orange_sn", name: "Orange SN", country: "SN", countryName: "Sénégal", badge: "USSD / App", prefix: "+221" },
  { id: "MTN_CM", network: "mtn_cm", name: "MTN MoMo", country: "CM", countryName: "Cameroun", badge: "Push USSD", prefix: "+237" },
  { id: "ORANGE_CM", network: "orange_cm", name: "Orange CM", country: "CM", countryName: "Cameroun", badge: "USSD / App", prefix: "+237" },
  { id: "ORANGE_BF", network: "orange_bf", name: "Orange BF", country: "BF", countryName: "Burkina Faso", badge: "USSD / Code", prefix: "+226" },
  { id: "TMONEY_TG", network: "tmoney_tg", name: "T-Money", country: "TG", countryName: "Togo", badge: "Push direct", prefix: "+228" },
];

function SasPayCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const packId = searchParams.get("pack_id") || "PACK_STARTER";
  const amount = searchParams.get("amount") || "3000";
  const points = searchParams.get("points") || "2000";
  const sessionId = searchParams.get("session_id") || "";

  const [selectedCountry, setSelectedCountry] = useState<string>("BJ");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mtn_bj");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Statuts de vérification en attente de push
  const [isWaitingPush, setIsWaitingPush] = useState(false);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [pushStatusMessage, setPushStatusMessage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);

  // Filtrer les opérateurs par pays sélectionné
  const availableOperators = OPERATORS.filter((o) => o.country === selectedCountry);

  // Pré-remplir l'indicatif téléphonique au changement de pays
  useEffect(() => {
    const firstOp = availableOperators[0];
    if (firstOp) {
      setSelectedNetwork(firstOp.network);
      if (!phone || phone.startsWith("+")) {
        setPhone(firstOp.prefix);
      }
    }
  }, [selectedCountry]);

  // Polling de vérification en tâche de fond si en attente de validation USSD
  useEffect(() => {
    if (!isWaitingPush || !activePaymentId || isSuccess) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/shop/saaspay/verify?paymentId=${encodeURIComponent(activePaymentId)}`);
        const data = await res.json();

        if (res.ok && data.status === "SUCCESS") {
          setIsSuccess(true);
          setIsWaitingPush(false);
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/shop?success=true&provider=saspay&session_id=${encodeURIComponent(activePaymentId)}`);
          }, 2000);
        } else if (res.ok && data.status === "FAILED") {
          setIsWaitingPush(false);
          setError("Le paiement a été refusé ou a expiré côté opérateur.");
          clearInterval(interval);
        }
      } catch {
        // En cas d'erreur réseau temporaire, continuer le polling
      }

      // Arrêt automatique après 60 tentatives (environ 3 minutes)
      if (attempts > 60) {
        clearInterval(interval);
        setIsWaitingPush(false);
        setError("Délai d'attente dépassé. Si vous avez validé le code PIN, vos points seront crédités automatiquement dès réception du webhook.");
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isWaitingPush, activePaymentId, isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setError("Veuillez saisir un numéro de téléphone Mobile Money complet.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/shop/saaspay/softpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId,
          phone: phone.trim(),
          country: selectedCountry,
          network: selectedNetwork,
          otp: otp.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Impossible d'initier le paiement Mobile Money.");
        setLoading(false);
        return;
      }

      // Règle d'or de l'API SasPay : Si checkout_url est non vide, redirection obligatoire vers l'URL
      if (data.redirect && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Si push direct (USSD) sur le téléphone du client
      setActivePaymentId(data.paymentId);
      setIsWaitingPush(true);
      setIsSimulation(Boolean(data.isSimulation));
      setPushStatusMessage(data.message || "Demande envoyée sur votre téléphone. Saisissez votre code PIN secret.");
    } catch {
      setError("Erreur de connexion avec le serveur de paiement SasPay.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateInstantSuccess = async () => {
    if (!activePaymentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/shop/saaspay/verify?paymentId=${encodeURIComponent(activePaymentId)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setIsWaitingPush(false);
        setTimeout(() => {
          router.push(`/shop?success=true&provider=saspay&session_id=${encodeURIComponent(activePaymentId)}`);
        }, 1500);
      }
    } catch {
      setError("Erreur lors de la confirmation de test.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="addme-card-static w-full max-w-lg space-y-6 shadow-2xl border border-white/20">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#5A5A70] dark:text-[#A3A1BD] hover:text-[#12122A] dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la boutique
        </Link>

        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-[#E3E3EE] dark:border-[#2E2C40] pb-4">
          <div className="flex items-center gap-3">
            <div className="addme-thumb bg-[#5B3DF5]/10 text-[#5B3DF5]">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#12122A] dark:text-white">
                Paiement SasPay
              </h2>
              <span className="text-xs text-[#5A5A70] dark:text-[#A3A1BD]">
                Mobile Money (Wave, Orange, MTN, Moov)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-[#12122A] dark:text-white block">
              {Number(amount).toLocaleString("fr-FR")} FCFA
            </span>
            <span className="text-xs text-[#5B3DF5] font-extrabold">
              +{Number(points).toLocaleString("fr-FR")} points
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">
              Paiement validé avec succès !
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Vos +{Number(points).toLocaleString("fr-FR")} points ont été crédités à votre solde. Redirection vers votre compte...
            </p>
          </div>
        ) : isWaitingPush ? (
          <div className="p-6 rounded-2xl bg-[#EEEAFF] dark:bg-[#1C1A30] border border-[#D9D2FF] dark:border-[#38335A] text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#5B3DF5] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#12122A] dark:text-white">
                Validation sur votre mobile en cours
              </h3>
              <p className="text-xs text-[#5A5A70] dark:text-[#A3A1BD] max-w-sm mx-auto">
                {pushStatusMessage}
              </p>
            </div>

            {isSimulation && (
              <div className="pt-3 border-t border-[#D9D2FF] dark:border-[#38335A]">
                <button
                  type="button"
                  onClick={handleSimulateInstantSuccess}
                  disabled={loading}
                  className="addme-btn addme-btn-primary w-full py-2.5 text-xs"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider le test en 1 clic (Mode Dev)"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Sélection du Pays */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] dark:text-[#A3A1BD] mb-2">
                1. Pays de votre compte Mobile Money
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: "BJ", label: "Bénin 🇧🇯" },
                  { code: "CI", label: "Côte d'Ivoire 🇨🇮" },
                  { code: "SN", label: "Sénégal 🇸🇳" },
                  { code: "CM", label: "Cameroun 🇨🇲" },
                  { code: "BF", label: "Burkina Faso 🇧🇫" },
                  { code: "TG", label: "Togo 🇹🇬" },
                ].map((country) => (
                  <button
                    type="button"
                    key={country.code}
                    onClick={() => setSelectedCountry(country.code)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center truncate ${
                      selectedCountry === country.code
                        ? "bg-[#5B3DF5] text-white border-[#5B3DF5] shadow-xs"
                        : "bg-[#F7F7FB] dark:bg-[#1C1B2E] border-[#E3E3EE] dark:border-[#383556] text-[#12122A] dark:text-[#F4F3FA] hover:border-[#5B3DF5]"
                    }`}
                  >
                    {country.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Opérateurs disponibles */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] dark:text-[#A3A1BD] mb-2">
                2. Réseau & Opérateur
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableOperators.map((op) => {
                  const active = selectedNetwork === op.network;
                  return (
                    <button
                      type="button"
                      key={op.id}
                      onClick={() => setSelectedNetwork(op.network)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        active
                          ? "bg-[#EEEAFF] dark:bg-[#5B3DF5]/20 border-[#5B3DF5] text-[#3A22C8] dark:text-[#A38EFF] shadow-xs"
                          : "bg-[#F7F7FB] dark:bg-[#1C1B2E] border-[#E3E3EE] dark:border-[#383556] text-[#12122A] dark:text-[#F4F3FA] hover:border-[#5B3DF5]"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-extrabold block">{op.name}</span>
                        <span className="text-[10px] opacity-75">{op.badge}</span>
                      </div>
                      {active && <CheckCircle2 className="w-4 h-4 text-[#5B3DF5]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Numéro de téléphone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] dark:text-[#A3A1BD] mb-1.5">
                3. Numéro de téléphone Mobile Money
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex : +22997505050 ou +22507000000"
                className="w-full px-4 py-3 rounded-xl bg-[#F7F7FB] dark:bg-[#17162A] border border-[#CFCFE0] dark:border-[#383556] text-sm text-[#12122A] dark:text-white focus:outline-none focus:border-[#5B3DF5]"
              />
            </div>

            {/* OTP si requis (Orange CI / BF) */}
            {(selectedNetwork === "orange_ci" || selectedNetwork === "orange_bf") && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] dark:text-[#A3A1BD] mb-1.5">
                  Code d'autorisation (Généré via #144# ou App Orange)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Ex : 482913"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F7F7FB] dark:bg-[#17162A] border border-[#CFCFE0] dark:border-[#383556] text-sm text-[#12122A] dark:text-white focus:outline-none focus:border-[#5B3DF5]"
                />
              </div>
            )}

            <div
              className="p-3.5 rounded-xl border text-xs text-[#12122A] dark:text-[#D6D3E9] space-y-1"
              style={{ background: "#EEEAFF", borderColor: "#D9D2FF" }}
            >
              <div className="flex items-center gap-1.5 font-extrabold text-[#3A22C8]">
                <ShieldCheck className="w-4 h-4 text-[#5B3DF5]" />
                API SasPay Sécurisée & Immédiate
              </div>
              <p className="text-[#5A5A70] text-[11px]">
                Validation conforme aux standards bancaires. Les points sont crédités dès confirmation du statut SUCCESS.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="addme-btn addme-btn-primary w-full py-3.5 text-base shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Contact de l'opérateur SasPay...</span>
                </>
              ) : (
                <span>
                  Payer {Number(amount).toLocaleString("fr-FR")} FCFA (+{Number(points).toLocaleString("fr-FR")} pts)
                </span>
              )}
            </button>
          </form>
        )}
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
      <SasPayCheckoutContent />
    </Suspense>
  );
}
