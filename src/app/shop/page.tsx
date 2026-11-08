"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  Smartphone,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import type { PointPack } from "@/lib/constants";

interface PaymentHistoryItem {
  id: string;
  packId: string;
  packName: string;
  pointsAmount: number;
  amountFormatted: string;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  stripeSessionId: string | null;
  createdAt: string;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session_id");
  const isSuccessParam = searchParams.get("success") === "true";
  const isCanceledParam = searchParams.get("canceled") === "true";

  const [paymentMethod, setPaymentMethod] = useState<"SAASPAY" | "STRIPE">(
    "SAASPAY"
  );
  const [packs, setPacks] = useState<PointPack[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [simulatingSessionId, setSimulatingSessionId] = useState<string | null>(
    null
  );

  const fetchShopData = async () => {
    try {
      const [packsRes, historyRes] = await Promise.all([
        fetch("/api/shop/packs"),
        fetch("/api/shop/history"),
      ]);

      if (packsRes.ok) {
        const data = await packsRes.json();
        setPacks(data.packs || []);
        setBalance(data.balance ?? 0);
      }

      if (historyRes.ok) {
        const histData = await historyRes.json();
        setHistory(histData.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  useEffect(() => {
    if (isSuccessParam && sessionIdParam) {
      setFeedback({
        type: "success",
        text: "Paiement validé avec succès ! Vos points ont été crédités à votre solde.",
      });
      fetchShopData();
    } else if (isCanceledParam) {
      setFeedback({
        type: "error",
        text: "Le paiement a été interrompu. Aucun montant n'a été prélevé.",
      });
    }
  }, [isSuccessParam, isCanceledParam, sessionIdParam]);

  const handleBuyPack = async (pack: PointPack) => {
    setPurchasingPackId(pack.id);
    setFeedback(null);

    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id, provider: paymentMethod }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Impossible d'initier le paiement.",
        });
      } else {
        if (data.url) {
          window.location.href = data.url;
        } else if (data.isMock) {
          setSimulatingSessionId(data.sessionId);
          setFeedback({
            type: "success",
            text: `Session créée pour le ${pack.name}. Cliquez ci-dessous pour finaliser le crédit.`,
          });
          await fetchShopData();
        }
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Erreur réseau lors de la création du paiement.",
      });
    } finally {
      setPurchasingPackId(null);
    }
  };

  const handleSimulateConfirmation = async (sessionId: string) => {
    setSimulatingSessionId(sessionId);
    setFeedback(null);

    try {
      const res = await fetch("/api/shop/simulate-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error || "Échec de la confirmation.",
        });
      } else {
        setFeedback({ type: "success", text: data.message });
        setSimulatingSessionId(null);
        await fetchShopData();
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur réseau." });
    }
  };

  return (
    <div suppressHydrationWarning className="flex-1 max-w-[1100px] w-full mx-auto px-6 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold text-[#12122A] m-0 tracking-tight">
            Boutique de points
          </h1>
          <p className="text-sm text-[#5A5A70] mt-0.5">
            Packs de points doublés (150, 500 et 2 000 pts) • Paiement Mobile
            Money (FCFA) & Carte Bancaire.
          </p>
        </div>

        <span className="addme-card-static py-2.5 px-5 inline-flex items-center gap-2">
          <span className="text-xs text-[#5A5A70] font-medium">Solde :</span>
          <b className="text-[#5B3DF5] font-extrabold text-lg">
            {balance.toFixed(1)} pts
          </b>
        </span>
      </div>

      {/* Sélecteur du mode de paiement : SaaSPay Mobile Money vs Carte Stripe */}
      <div className="addme-card-static flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <b className="text-base font-extrabold text-[#12122A] block">
            Choisissez votre moyen de paiement
          </b>
          <span className="text-xs text-[#5A5A70]">
            Mobile Money Afrique (FCFA) ou Carte Bancaire Internationale (EUR).
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setPaymentMethod("SAASPAY")}
            className={`px-4 py-3 rounded-xl border text-xs font-extrabold flex items-center gap-2.5 transition-all ${
              paymentMethod === "SAASPAY"
                ? "bg-[#12122A] border-[#12122A] text-white shadow-md"
                : "bg-[#F7F7FB] border-[#E3E3EE] text-[#5A5A70] hover:border-[#5B3DF5]"
            }`}
          >
            <Smartphone className="h-4 w-4 text-[#FFB84D]" />
            <div className="text-left">
              <div>Mobile Money</div>
              <div className="text-[10px] opacity-75 font-normal">
                Orange • MTN • Wave • Moov (FCFA)
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("STRIPE")}
            className={`px-4 py-3 rounded-xl border text-xs font-extrabold flex items-center gap-2.5 transition-all ${
              paymentMethod === "STRIPE"
                ? "bg-[#5B3DF5] border-[#5B3DF5] text-white shadow-md"
                : "bg-[#F7F7FB] border-[#E3E3EE] text-[#5A5A70] hover:border-[#5B3DF5]"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <div className="text-left">
              <div>Carte Bancaire (Stripe)</div>
              <div className="text-[10px] opacity-75 font-normal">
                Visa • Mastercard • Apple Pay (€)
              </div>
            </div>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>

          {simulatingSessionId && (
            <button
              type="button"
              onClick={() => handleSimulateConfirmation(simulatingSessionId)}
              className="addme-btn addme-btn-primary text-xs py-2 px-4 shrink-0"
            >
              Valider le crédit maintenant
            </button>
          )}
        </div>
      )}

      {/* Grille des 3 Packs de Points (Style Main.dc.html) */}
      {loading ? (
        <div className="py-12 text-center text-[#5A5A70]">
          <div className="h-8 w-8 border-3 border-[#5B3DF5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Chargement des offres...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {packs.map((pack) => {
            const isPopular = Boolean(pack.popular);
            const isBuying = purchasingPackId === pack.id;

            return (
              <div
                key={pack.id}
                className={`addme-card flex flex-col justify-between ${
                  isPopular ? "border-2 border-[#5B3DF5] shadow-xl" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-lg font-extrabold text-[#12122A]">
                      {pack.name} {isPopular ? "· Populaire" : ""}
                    </b>
                    {isPopular && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EEEAFF] text-[#3A22C8] text-xs font-extrabold">
                        Populaire
                      </span>
                    )}
                  </div>

                  <div className="mt-4 mb-1">
                    {paymentMethod === "SAASPAY" ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[36px] font-extrabold text-[#12122A]">
                          {pack.priceFcfaFormatted}
                        </span>
                        <span className="text-xs font-bold text-[#5A5A70]">
                          ({pack.priceFormatted})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[36px] font-extrabold text-[#12122A]">
                          {pack.priceFormatted}
                        </span>
                        <span className="text-xs font-bold text-[#5A5A70]">
                          ({pack.priceFcfaFormatted})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EEEAFF] text-[#3A22C8] font-extrabold text-sm mb-4">
                    +{pack.points} points
                  </div>

                  <p className="text-sm text-[#5A5A70] leading-relaxed mb-6">
                    {pack.description}
                  </p>

                  <ul className="space-y-2 text-xs text-[#3A3A52] mb-6 pt-4 border-t border-[#E3E3EE]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#5B3DF5] shrink-0" />
                      <span>Crédit immédiat après paiement</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#5B3DF5] shrink-0" />
                      <span>
                        Utilisable sur TikTok, Instagram et YouTube
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#5B3DF5] shrink-0" />
                      <span>Sans abonnement, points permanents</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isBuying}
                  onClick={() => handleBuyPack(pack)}
                  className={`addme-btn w-full ${
                    isPopular ? "addme-btn-primary" : "addme-btn-ghost"
                  }`}
                >
                  {isBuying ? (
                    <span>Redirection...</span>
                  ) : (
                    <>
                      <span>
                        Choisir ({pack.points} pts •{" "}
                        {paymentMethod === "SAASPAY"
                          ? pack.priceFcfaFormatted
                          : pack.priceFormatted}
                        )
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Historique des achats */}
      <div className="addme-card-static">
        <b className="text-lg font-extrabold text-[#12122A] block mb-3">
          Historique de mes rechargements
        </b>

        {history.length === 0 ? (
          <p className="text-sm text-[#5A5A70] py-4 border-t border-[#E3E3EE]">
            Aucun achat enregistré pour le moment.
          </p>
        ) : (
          <div>
            {history.map((item) => (
              <div key={item.id} className="addme-row">
                <div className="addme-thumb">+{item.pointsAmount}</div>
                <div className="flex-1 min-w-0">
                  <b className="text-sm font-bold text-[#12122A] block">
                    {item.packName} (+{item.pointsAmount} pts)
                  </b>
                  <span className="text-xs text-[#5A5A70]">
                    {new Date(item.createdAt).toLocaleDateString("fr-FR")} •{" "}
                    {item.amountFormatted}
                  </span>
                </div>

                {item.status === "COMPLETED" ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    Crédité
                  </span>
                ) : item.status === "PENDING" && item.stripeSessionId ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleSimulateConfirmation(item.stripeSessionId!)
                    }
                    className="addme-btn addme-btn-primary text-xs py-2 px-3"
                  >
                    Confirmer (+{item.pointsAmount} pts)
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-[#F7F7FB] border border-[#E3E3EE] text-[#5A5A70] text-xs font-semibold">
                    {item.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="h-10 w-10 border-3 border-[#5B3DF5] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
