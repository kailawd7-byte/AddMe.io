"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Coins,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  CreditCard,
  Smartphone,
  Flame,
  Zap,
  HelpCircle,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Lock,
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

  const [paymentMethod, setPaymentMethod] = useState<"SAASPAY" | "STRIPE">("SAASPAY");
  const [packs, setPacks] = useState<PointPack[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [simulatingSessionId, setSimulatingSessionId] = useState<string | null>(null);

  const fetchShopData = async () => {
    try {
      const [packsRes, historyRes] = await Promise.all([
        fetch("/api/shop/packs"),
        fetch("/api/shop/history"),
      ]);

      if (packsRes.ok) {
        const data = await packsRes.json();
        setPacks(data.packs);
        setBalance(data.balance);
      }

      if (historyRes.ok) {
        const histData = await historyRes.json();
        setHistory(histData.history);
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

  // Détection du retour de paiement Stripe ou de session de test
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
        setFeedback({ type: "error", text: data.error || "Impossible d'initier le paiement." });
      } else {
        if (data.url) {
          window.location.href = data.url;
        } else if (data.isMock) {
          setSimulatingSessionId(data.sessionId);
          setFeedback({
            type: "success",
            text: `Session de paiement créée pour le ${pack.name}. Cliquez ci-dessous pour simuler la validation.`,
          });
          await fetchShopData();
        }
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur de connexion lors de l'accès au module de paiement." });
    } finally {
      setPurchasingPackId(null);
    }
  };

  const handleConfirmSimulation = async (sessionId: string) => {
    try {
      const res = await fetch("/api/shop/simulate-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Échec de validation de la session." });
      } else {
        setFeedback({ type: "success", text: data.message });
        setSimulatingSessionId(null);
        await fetchShopData();
      }
    } catch {
      setFeedback({ type: "error", text: "Erreur réseau lors de la confirmation." });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* En-tête : Proposition de Valeur & Solde */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> Boutique Officielle
              </span>
              <span className="text-xs text-slate-400">Packs fixes • Zéro abonnement récurrent</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 text-white">
              Propulsez vos vidéos avec nos Packs de Points
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Pas le temps d&apos;accomplir des tâches manuelles ? Rechargez votre solde en toute sécurité et recevez
              de l&apos;engagement authentique de la part d&apos;autres créateurs en quelques minutes.
            </p>
          </div>

          {/* Solde Actuel */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Votre Solde Actuel
              </span>
              <span className="text-2xl font-extrabold text-white">
                {balance.toFixed(1)} <span className="text-sm font-medium text-amber-400">points</span>
              </span>
            </div>
          </div>
        </div>

        {/* Message d'Alerte (Succès / Annulation / Simulation) */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 transition ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            )}
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium leading-relaxed">{feedback.text}</p>
              {simulatingSessionId && (
                <button
                  onClick={() => handleConfirmSimulation(simulatingSessionId)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                >
                  <Zap className="w-3.5 h-3.5" /> Confirmer le paiement & Créditer les points (Mode Test)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Grille des 3 Packs de Points */}
        <div className="space-y-4">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-white">Sélectionnez votre pack</h2>
            <p className="text-xs text-slate-400">
              Paiement unique sécurisé par carte bancaire. Les points sont immédiatement crédités après confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {packs.map((pack) => {
              const isPopular = pack.popular;
              const isBuying = purchasingPackId === pack.id;

              return (
                <div
                  key={pack.id}
                  className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-300 ${
                    isPopular
                      ? "bg-gradient-to-b from-slate-900 to-indigo-950/40 border-2 border-indigo-500/80 shadow-2xl shadow-indigo-500/10 scale-105 z-10"
                      : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Badge Éclatant pour le pack populaire */}
                  {pack.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-amber-500 text-white shadow-md">
                        {pack.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Nom et Description */}
                    <div>
                      <h3 className="text-lg font-bold text-white">{pack.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed min-h-[36px]">
                        {pack.description}
                      </p>
                    </div>

                    {/* Prix et Points */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-extrabold text-white">
                          +{pack.points} <span className="text-sm font-semibold text-amber-400">pts</span>
                        </span>
                        <span className="text-xl font-bold text-slate-200">{pack.priceFormatted}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {(pack.priceInCents / pack.points / 100).toFixed(3)} € par point
                      </span>
                    </div>

                    {/* Pouvoir d'achat concret (Analyse cognitive de conversion) */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/60">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Pouvoir d&apos;engagement estimé :
                      </span>
                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Likes réels (TikTok / YT) :</span>
                          <strong className="text-white">~{pack.equivalentLikes} likes</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Commentaires constructifs :</span>
                          <strong className="text-white">~{pack.equivalentComments} comm.</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bouton de Commande */}
                  <div className="pt-6">
                    <button
                      disabled={isBuying}
                      onClick={() => handleBuyPack(pack)}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition ${
                        isPopular
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-102"
                          : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                      }`}
                    >
                      {isBuying ? (
                        "Redirection..."
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" /> Acheter pour {pack.priceFormatted}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Réassurance & Éthique P2P */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Paiement 100% Sécurisé</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Chiffré de bout en bout via Stripe. Vos coordonnées bancaires ne transitent jamais sur nos serveurs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Crédit Immédiat & Automatique</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Dès confirmation bancaire, vos points sont automatiquement ajoutés à votre balance de points.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">0 Bot • Engagement Garanti</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Chaque point dépensé rémunère un créateur réel effectuant manuellement l&apos;action demandée.
              </p>
            </div>
          </div>
        </div>

        {/* Historique des Achats */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" /> Historique de vos commandes
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Retrouvez l&apos;ensemble de vos recharges de points passées.
              </p>
            </div>

            <button
              onClick={fetchShopData}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Actualiser
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Chargement de votre historique...</div>
          ) : history.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 text-center text-xs text-slate-400">
              Vous n&apos;avez effectué aucun achat de pack pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Pack</th>
                    <th className="py-3 px-4">Points</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {history.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 text-slate-300">
                        {new Date(order.createdAt).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">{order.packName}</td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">+{order.pointsAmount} pts</td>
                      <td className="py-3.5 px-4 text-slate-300">{order.amountFormatted}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : order.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {order.status === "COMPLETED"
                            ? "Confirmé"
                            : order.status === "PENDING"
                            ? "En attente"
                            : "Échoué"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-8">Chargement de la boutique...</div>}>
      <ShopContent />
    </Suspense>
  );
}
