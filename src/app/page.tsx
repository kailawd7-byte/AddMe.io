"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Video,
  Coins,
  ArrowRight,
  CheckCircle2,
  Lock,
  Flame,
  Users,
  Eye,
  TrendingUp,
  Clock,
  Zap,
  Smartphone,
  CreditCard,
  ChevronDown,
  Layers,
  Award,
  Sliders,
  Check,
  X,
} from "lucide-react";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [simPlatform, setSimPlatform] = useState<"TIKTOK" | "YOUTUBE" | "INSTAGRAM">("TIKTOK");
  const [simAction, setSimAction] = useState<"LIKE" | "COMMENT" | "SUBSCRIBE">("LIKE");
  const [simQuantity, setSimQuantity] = useState<number>(25);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Calcul du simulateur
  const pointsPerUnit = simAction === "LIKE" ? 1.0 : simAction === "COMMENT" ? 1.5 : 2.0;
  const estimatedPointsCost = Math.round(simQuantity * pointsPerUnit);
  const estimatedReachMultiplier = simAction === "LIKE" ? "x3 à x5" : simAction === "COMMENT" ? "x6 à x8" : "x10+";

  return (
    <div className="relative overflow-hidden bg-[#070a12] text-slate-100 selection:bg-indigo-500 selection:text-white pt-24 pb-20">
      {/* Texture de Bruit SVG Subtile (Film Grain Cinématographique) */}
      <div
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Halo de Lumière Dramatique Hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* ===================================================================== */}
      {/* 1. HERO SECTION : "Le Plan d'Ouverture"                                */}
      {/* ===================================================================== */}
      <section id="top" className="relative pt-12 pb-20 sm:pt-20 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        {/* Pilule d'autorité */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-medium mb-8 backdrop-blur-md shadow-lg shadow-indigo-950/50">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Le premier cercle d'amplification d'audience organique</span>
        </div>

        {/* Titre Cinématographique avec Contraste Dramatique */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Propulsez vos contenus <br />
          sur vos réseaux. <br />
          <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-200 to-amber-200 text-3xl sm:text-5xl lg:text-6xl">
            En échange d&apos;engagement 100% réel.
          </span>
        </h1>

        {/* Sous-titre percutant */}
        <p className="mt-8 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Gagnez des points en interagissant manuellement avec les publications de créateurs certifiés,
          puis mobilisez la communauté pour faire décoller vos propres vidéos TikTok, YouTube et Instagram.
          <strong className="text-white block mt-2">Zéro bot. Zéro mot de passe demandé. Réciprocité garantie.</strong>
        </p>

        {/* CTA Dynamique intelligent */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {currentUser ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-2xl shadow-indigo-600/40 transition-all hover:scale-105"
            >
              <span>Accéder à mon Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-600/40 transition-all hover:scale-105"
              >
                <span>Rejoindre le cercle (+10 pts offerts)</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all"
              >
                Se connecter
              </Link>
            </>
          )}
        </div>

        {/* Badges de Confiance Instantanés */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            <span>0 mot de passe social requis</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>Vérification de profil par code bio</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>Interactions manuelles 10s minimum</span>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. ARTEFACT INTERACTIF : "Le Simulateur d'Impact Algorithmique"      */}
      {/* ===================================================================== */}
      <section id="simulateur" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-b from-slate-900/90 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Sliders className="w-4 h-4" /> Simulateur d'impact en direct
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Visualisez le boost de votre prochaine publication
            </h2>
            <p className="text-sm text-slate-400">
              Choisissez votre réseau et votre objectif pour estimer l'amplification algorithmique immédiate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Choix Réseau */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">1. Sélectionnez votre réseau</label>
              <div className="grid grid-cols-3 gap-2">
                {(["TIKTOK", "INSTAGRAM", "YOUTUBE"] as const).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setSimPlatform(net)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      simPlatform === net
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {net === "TIKTOK" ? "TikTok" : net === "INSTAGRAM" ? "Instagram" : "YouTube"}
                  </button>
                ))}
              </div>
            </div>

            {/* Choix Action */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">2. Type d'interaction</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "LIKE", label: "Likes" },
                  { id: "COMMENT", label: "Commentaires" },
                  { id: "SUBSCRIBE", label: "Abonnés" },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setSimAction(act.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      simAction === act.id
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider Quantité */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">3. Nombre de créateurs</span>
                <span className="font-bold text-amber-400 text-sm">{simQuantity} créateurs</span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={simQuantity}
                onChange={(e) => setSimQuantity(parseInt(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>5</span>
                <span>50</span>
                <span>100</span>
                <span>200</span>
              </div>
            </div>
          </div>

          {/* Résultat Simulateur */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block">Créateurs mobilisés</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {simQuantity} <span className="text-xs text-indigo-400 font-semibold">humains</span>
              </span>
            </div>
            <div className="space-y-1 border-y sm:border-y-0 sm:border-x border-slate-800 py-3 sm:py-0">
              <span className="text-xs text-slate-400 block">Amplification de visibilité</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {estimatedReachMultiplier}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 block">Points nécessaires</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                ~{estimatedPointsCost} <span className="text-xs text-slate-400 font-normal">pts</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. COMMENT ÇA MARCHE : "L'Écosystème Réciproque"                    */}
      {/* ===================================================================== */}
      <section id="fonctionnement" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Architecture P2P
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Comment fonctionne l&apos;échange d&apos;engagement ?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Un protocole transparent conçu pour faire exploser votre rétention sans aucun risque de bannissement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Étape 1 */}
          <div className="p-8 rounded-[2rem] bg-slate-900/60 border border-slate-800 relative group hover:border-indigo-500/50 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-lg flex items-center justify-center">
              01
            </div>
            <h3 className="text-xl font-bold text-white">Liez votre compte en bio</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Ajoutez votre pseudo TikTok, Instagram ou YouTube. Un code unique (ex: <code className="text-indigo-300 font-mono">ADDME-9A82F</code>)
              prouve que vous êtes le propriétaire sans jamais renseigner votre mot de passe.
            </p>
          </div>

          {/* Étape 2 */}
          <div className="p-8 rounded-[2rem] bg-slate-900/60 border border-slate-800 relative group hover:border-cyan-500/50 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-lg flex items-center justify-center">
              02
            </div>
            <h3 className="text-xl font-bold text-white">Interagissez & Gagnez</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Ouvrez les publications des autres créateurs, regardez au moins 10 secondes et likez ou commentez.
              Vos points sont crédités directement et immédiatement à votre solde !
            </p>
          </div>

          {/* Étape 3 */}
          <div className="p-8 rounded-[2rem] bg-slate-900/60 border border-slate-800 relative group hover:border-emerald-500/50 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-lg flex items-center justify-center">
              03
            </div>
            <h3 className="text-xl font-bold text-white">Propulsez vos vidéos</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Créez une campagne en collant le lien de votre Reel, Shorts ou vidéo. Choisissez vous-même la récompense
              offerte et la durée : la communauté s'occupe de booster votre publication.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. COMPARATIF SANS COMPROMIS : "Fermes de Bots vs AddMe.io"           */}
      {/* ===================================================================== */}
      <section id="concept" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-slate-900/70 border border-slate-800 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Pourquoi les fermes de bots détruisent vos comptes
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Les algorithmes en 2026 détectent les faux comptes en moins de 3 secondes. Seul l'engagement humain fonctionne.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-4 px-3">Critère de visibilité</th>
                  <th className="py-4 px-3 text-rose-400 font-bold">Fermes de Bots & Achat classique</th>
                  <th className="py-4 px-3 text-emerald-400 font-bold">Cercle AddMe.io</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-4 px-3 font-medium text-white">Comptes émetteurs</td>
                  <td className="py-4 px-3 text-slate-400 flex items-center gap-1.5">
                    <X className="h-4 w-4 text-rose-500" /> Profils vides, sans abonnés
                  </td>
                  <td className="py-4 px-3 text-emerald-300 font-semibold flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-400" /> Vrais créateurs actifs avec comptes vérifiés
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-3 font-medium text-white">Temps de visionnage réel</td>
                  <td className="py-4 px-3 text-slate-400 flex items-center gap-1.5">
                    <X className="h-4 w-4 text-rose-500" /> 0 seconde (déclenche le shadowban)
                  </td>
                  <td className="py-4 px-3 text-emerald-300 font-semibold flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-400" /> 10 secondes minimum vérifiées
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-3 font-medium text-white">Sécurité de vos identifiants</td>
                  <td className="py-4 px-3 text-slate-400 flex items-center gap-1.5">
                    <X className="h-4 w-4 text-rose-500" /> Risque d'usurpation ou vol
                  </td>
                  <td className="py-4 px-3 text-emerald-300 font-semibold flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-400" /> 0 mot de passe requis à vie
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-3 font-medium text-white">Rétention & Désabonnements</td>
                  <td className="py-4 px-3 text-slate-400 flex items-center gap-1.5">
                    <X className="h-4 w-4 text-rose-500" /> Perte de 90% des abonnés en 72h
                  </td>
                  <td className="py-4 px-3 text-emerald-300 font-semibold flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-400" /> Rétention forte & système de réputation
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. TARIFS : "Packs de Points & Mobile Money (Afrique / Stripe)"        */}
      {/* ===================================================================== */}
      <section id="tarifs" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            Boutique & Recharges
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Tarifs limpides, points doublés
          </h2>
          <p className="text-sm text-slate-400">
            Payez par <strong>Carte bancaire</strong> ou directement par <strong>Mobile Money</strong> (Orange Money, MTN, Wave, Moov).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pack Découverte */}
          <div className="p-8 rounded-[2rem] bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pack Découverte</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">+100</span>
                <span className="text-amber-400 font-bold text-sm">points</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">4,99 €</div>
                <div className="text-xs text-emerald-400 font-semibold">ou 3 000 FCFA (Mobile Money)</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Parfait pour tester la puissance de la communauté sur votre première vidéo.
              </p>
            </div>
            <Link
              href="/shop"
              className="w-full py-3.5 rounded-xl font-bold text-xs text-center bg-slate-800 hover:bg-slate-700 text-white transition block"
            >
              Recharger 100 points
            </Link>
          </div>

          {/* Pack Créateur */}
          <div className="p-8 rounded-[2rem] bg-gradient-to-b from-slate-900 to-indigo-950/50 border-2 border-indigo-500/80 shadow-2xl space-y-6 flex flex-col justify-between relative scale-105">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md">
                Recommandé
              </span>
            </div>
            <div className="space-y-4">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">Pack Créateur</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">+300</span>
                <span className="text-amber-400 font-bold text-sm">points</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">12,99 €</div>
                <div className="text-xs text-emerald-400 font-semibold">ou 8 500 FCFA (Mobile Money)</div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Le format idéal pour déclencher l'algorithme sur une publication stratégique.
              </p>
            </div>
            <Link
              href="/shop"
              className="w-full py-3.5 rounded-xl font-bold text-xs text-center bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30 block"
            >
              Recharger 300 points
            </Link>
          </div>

          {/* Pack Influence */}
          <div className="p-8 rounded-[2rem] bg-slate-900/60 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pack Influence</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">+1 000</span>
                <span className="text-amber-400 font-bold text-sm">points</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">34,99 €</div>
                <div className="text-xs text-emerald-400 font-semibold">ou 22 500 FCFA (Mobile Money)</div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Meilleure valeur unitaire par point pour les créateurs qui publient chaque semaine.
              </p>
            </div>
            <Link
              href="/shop"
              className="w-full py-3.5 rounded-xl font-bold text-xs text-center bg-slate-800 hover:bg-slate-700 text-white transition block"
            >
              Recharger 1 000 points
            </Link>
          </div>
        </div>

        {/* Moyens de Paiement Disponibles */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-400" />
            <span>Paiement international sécurisé par carte (Visa, Mastercard via Stripe)</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-400" />
            <span>Afrique : Orange Money, MTN Mobile Money, Wave, Moov via SaaSPay</span>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. FAQ ANTI-OBJECTION                                                 */}
      {/* ===================================================================== */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-white">Questions fréquentes</h2>
          <p className="text-xs sm:text-sm text-slate-400">Tout ce que vous devez savoir pour booster vos réseaux sereinement.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Mes comptes risquent-ils d'être bannis par TikTok, Instagram ou YouTube ?",
              a: "Non. Contrairement aux services illégaux qui envoient des bots automatisés, AddMe.io repose exclusivement sur de vrais créateurs humains qui ouvrent votre publication, la visionnent au moins 10 secondes et effectuent une interaction manuelle. C'est indifférenciable d'un trafic viral organique.",
            },
            {
              q: "Comment fonctionne la preuve de propriété du compte ?",
              a: "Nous ne vous demanderons JAMAIS votre mot de passe social. Vous placez simplement un code unique généré (ex: ADDME-9A82F) dans votre bio ou description quelques instants. Une fois validé, vous pouvez retirer le code.",
            },
            {
              q: "Puis-je gagner des points sans payer ?",
              a: "Absolument ! La plateforme est 100% accessible gratuitement : vous gagnez des points en interagissant avec les publications des autres membres, puis vous utilisez ces points pour vos propres vidéos.",
            },
            {
              q: "Comment payer avec Mobile Money en Afrique ?",
              a: "Dans la boutique, sélectionnez simplement l'option Mobile Money. Vous pouvez régler en FCFA avec votre compte Orange Money, MTN MoMo, Wave ou Moov Money via la passerelle sécurisée SaaSPay.",
            },
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="font-bold text-sm sm:text-base text-white">{item.q}</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. CALL TO ACTION FINAL                                              */}
      {/* ===================================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-14 rounded-[2.5rem] bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Inscription instantanée
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Prêt à donner à vos vidéos l'attention qu'elles méritent ?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Rejoignez des centaines de créateurs qui s'entraident chaque jour pour dominer les algorithmes.
          </p>
          <div className="pt-2">
            <Link
              href={currentUser ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
            >
              {currentUser ? "Ouvrir mon Dashboard" : "Créer mon compte (+10 points offerts)"}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
