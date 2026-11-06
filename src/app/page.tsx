"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Smartphone,
  CreditCard,
  ChevronDown,
  Zap,
  Users,
  Heart,
  MessageCircle,
  UserPlus,
  Link2,
  Play,
  TrendingUp,
  Share2,
} from "lucide-react";
import { POINT_PACKS } from "@/lib/constants";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userBalance, setUserBalance] = useState<number>(0);

  // Interaction sur les 3 panels de notification flottants du Hero
  const [clickedPanels, setClickedPanels] = useState<Record<string, boolean>>({});

  // Simulateur de campagne
  const [simPlatform, setSimPlatform] = useState<"TIKTOK" | "INSTAGRAM" | "YOUTUBE">("TIKTOK");
  const [simAction, setSimAction] = useState<"LIKE" | "COMMENT" | "SUBSCRIBE">("LIKE");
  const [simQuantity, setSimQuantity] = useState<number>(30);
  const [simReward, setSimReward] = useState<number>(1);
  const [simDays, setSimDays] = useState<number>(4);

  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setIsAuthenticated(true);
          setUserEmail(data.user.email || "");
          setUserBalance(data.user.balance ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  const handlePanelClick = (id: string) => {
    setClickedPanels((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setClickedPanels((prev) => ({ ...prev, [id]: false }));
    }, 2200);
  };

  const simActionCost = simQuantity * simReward;
  const simDurationFee = Number((simDays * 0.5).toFixed(1));
  const simTotalPoints = Number((simActionCost + simDurationFee).toFixed(1));
  const simDailyCap = Math.max(1, Math.ceil(simQuantity / simDays));

  // Réseaux sociaux partenaires (style sponsors demandé)
  const supportedNetworks = [
    { name: "TikTok", status: "Actif", active: true, color: "from-pink-500 to-rose-600" },
    { name: "Instagram", status: "Actif", active: true, color: "from-purple-600 via-pink-500 to-amber-500" },
    { name: "YouTube", status: "Actif", active: true, color: "from-rose-600 to-red-600" },
    { name: "Facebook", status: "Bientôt", active: false, color: "from-blue-600 to-indigo-700" },
    { name: "Snapchat", status: "Bientôt", active: false, color: "from-amber-400 to-yellow-500" },
    { name: "LinkedIn", status: "Bientôt", active: false, color: "from-sky-600 to-blue-700" },
    { name: "X (Twitter)", status: "Bientôt", active: false, color: "from-slate-700 to-slate-900" },
    { name: "Threads", status: "Bientôt", active: false, color: "from-zinc-800 to-zinc-950" },
  ];

  const faqs = [
    {
      q: "Pourquoi mes points sont-ils crédités immédiatement sans attendre 24h ?",
      a: "Nous avons supprimé la rétention de 24 heures pour fluidifier vos échanges. Dès que vous visionnez une publication pendant au moins 10 secondes et validez votre action, vos points sont crédités directement sur votre solde disponible et la tâche disparaît définitivement de votre flux.",
    },
    {
      q: "Un même utilisateur peut-il liker ou s'abonner plusieurs fois à ma publication ?",
      a: "Non, jamais. Sur TikTok, Instagram comme YouTube, il est impossible d'effectuer la même interaction deux fois avec un seul compte. Notre algorithme affiche une seule carte par publication : dès qu'un membre effectue la tâche, elle disparaît définitivement de son écran. Si vous lancez plus tard une autre campagne avec une action différente (ex: Commentaire après Like), elle redeviendra éligible.",
    },
    {
      q: "Comment fonctionne la tarification libre d'une campagne ?",
      a: "C'est 100% transparent : vous choisissez vous-même le nombre de personnes souhaitées, les points que vous offrez par action (1 pt, 2 pts, 3 pts... plus vous offrez, plus votre publication passe en priorité), et le nombre de jours de diffusion (0,5 point par jour).",
    },
    {
      q: "Puis-je recharger mes points par Mobile Money en Afrique ?",
      a: "Oui ! Vous pouvez régler vos packs en FCFA via Orange Money, MTN Mobile Money, Wave ou Moov Money, ainsi que par carte bancaire. Les points de tous nos packs ont été doublés (100, 300 et 1 000 points) au même prix.",
    },
    {
      q: "Dois-je donner le mot de passe de mon compte TikTok, Instagram ou YouTube ?",
      a: "Jamais. AddMe.io ne vous demandera jamais vos identifiants ou mots de passe. Pour prouver qu'un profil vous appartient, vous collez simplement un code temporaire unique (ex: ADDME-8F92A) dans votre biographie.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FB] text-[#12122A]">
      {/* =====================================================================
          SECTION 1 : HERO CINÉMATOGRAPHIQUE
         ===================================================================== */}
      <section className="bg-[#0E0D14] text-white overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 relative">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-[#5B3DF5]/20 blur-[130px] rounded-full" />

        <div className="max-w-[1140px] mx-auto px-6 relative z-10">
          <div className="flex flex-wrap items-center gap-12 lg:gap-14">
            {/* Colonne Gauche */}
            <div className="flex-[1_1_500px] animate-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B1A26] border border-[#2E2C40] text-xs font-semibold text-[#C9C6DB] mb-6">
                <Sparkles className="h-3.5 w-3.5 text-[#FFB84D]" />
                <span>Plateforme P2P Éthique · Engagement 100% Réel & Vérifié</span>
              </div>

              <h1 className="text-[44px] sm:text-[60px] lg:text-[68px] font-extrabold leading-[1.02] tracking-[-0.03em] m-0 mb-5">
                Donnez de l’attention.{" "}
                <span className="text-[#FFB84D] font-serif-drama italic font-bold">
                  Recevez-en.
                </span>
              </h1>

              <p className="text-lg sm:text-[19px] leading-[1.6] text-[#C9C6DB] max-w-xl m-0">
                Propulsez vos contenus sur vos réseaux en échange d’engagement.
                Interagissez manuellement avec les publications d’autres
                créateurs, gagnez des points immédiatement, puis réinvestissez-les
                pour faire décoller votre visibilité.
              </p>

              {/* Actions selon le statut de connexion */}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="addme-btn addme-btn-primary text-base px-7 py-4"
                    >
                      <span>
                        Accéder à mon Dashboard (
                        <strong className="text-[#FFB84D]">
                          {userBalance.toFixed(0)} pts
                        </strong>
                        )
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/tasks"
                      className="addme-btn text-white border border-[#4A4760] hover:border-white px-6 py-4"
                    >
                      Gagner des points
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="addme-btn addme-btn-primary text-base px-7 py-4"
                    >
                      <span>Créer mon compte · 10 points offerts</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href="#how"
                      className="addme-btn text-white border border-[#4A4760] hover:border-white px-6 py-4"
                    >
                      Voir comment ça marche
                    </a>
                  </>
                )}
              </div>

              {/* 3 Piliers */}
              <div className="mt-9 pt-7 border-t border-[#2E2C40]/80 grid grid-cols-3 gap-4 max-w-lg text-xs text-[#C9C6DB]">
                <div>
                  <div className="font-extrabold text-white text-base">0 Bot</div>
                  <div className="opacity-75">100% interactions réelles</div>
                </div>
                <div>
                  <div className="font-extrabold text-[#FFB84D] text-base">Immédiat</div>
                  <div className="opacity-75">Crédit direct sans attente</div>
                </div>
                <div>
                  <div className="font-extrabold text-white text-base">3 Réseaux</div>
                  <div className="opacity-75">TikTok, Instagram, YouTube</div>
                </div>
              </div>
            </div>

            {/* Colonne Droite : 3 Panels Interactifs au survol/clic */}
            <div
              className="flex-[1_1_400px] relative h-[440px] sm:h-[460px] w-full max-w-[480px] mx-auto"
              style={{ perspective: "1200px" }}
            >
              <div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Panel 1 : TikTok · Like */}
                <div
                  onClick={() => handlePanelClick("tiktok")}
                  className={`floating-3d-card group bg-[#1B1A26] border border-[#2E2C40] ${
                    clickedPanels["tiktok"] ? "!border-[#FFB84D] !scale-105" : ""
                  }`}
                  style={
                    {
                      top: "20px",
                      left: "0px",
                      right: "56px",
                      "--rx": "6deg",
                      "--ry": "-12deg",
                      animationDelay: "0s",
                    } as React.CSSProperties
                  }
                  title="Cliquez pour tester l'interaction !"
                >
                  <div className="flex items-center justify-between text-[13px] text-[#C9C6DB]">
                    <span className="group-hover:text-white transition-colors">
                      TikTok · Like
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold group-hover:bg-pink-500 group-hover:text-white transition-all">
                      {clickedPanels["tiktok"] ? "✓ Action simulée !" : "1x unique"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 mt-2.5 flex-nowrap">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-400 flex items-center justify-center font-extrabold text-sm text-white shrink-0 group-hover:scale-110 transition-transform">
                      TT
                    </div>
                    <div className="flex-1 min-w-0">
                      <b className="block text-white text-sm truncate group-hover:text-[#FFB84D] transition-colors">
                        Vidéo de @créateur_tiktok
                      </b>
                      <span className="text-xs text-[#C9C6DB]">
                        Visionnage 10s • Crédit direct
                      </span>
                    </div>
                    <b className="text-[#FFB84D] text-lg font-extrabold shrink-0 group-hover:scale-110 transition-transform">
                      +1 pt
                    </b>
                  </div>
                </div>

                {/* Panel 2 : Instagram · Abonnement */}
                <div
                  onClick={() => handlePanelClick("instagram")}
                  className={`floating-3d-card group bg-[#5B3DF5] border border-[#7C63F8] ${
                    clickedPanels["instagram"] ? "!border-[#FFB84D] !scale-105" : ""
                  }`}
                  style={
                    {
                      top: "152px",
                      left: "48px",
                      right: "0px",
                      "--rx": "6deg",
                      "--ry": "-12deg",
                      animationDelay: "-2s",
                    } as React.CSSProperties
                  }
                  title="Cliquez pour tester l'interaction !"
                >
                  <div className="flex items-center justify-between text-[13px] text-white/90">
                    <span>Instagram · Abonnement</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">
                      {clickedPanels["instagram"] ? "✓ Action simulée !" : "Prioritaire"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 mt-2.5 flex-nowrap">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center font-extrabold text-sm text-white shrink-0 group-hover:scale-110 transition-transform">
                      IG
                    </div>
                    <div className="flex-1 min-w-0">
                      <b className="block text-white text-sm truncate group-hover:text-[#FFB84D] transition-colors">
                        Reel de @studio_art
                      </b>
                      <span className="text-xs text-white/80">
                        Récompense libre choisie par le créateur
                      </span>
                    </div>
                    <b className="text-[#FFB84D] text-lg font-extrabold shrink-0 group-hover:scale-110 transition-transform">
                      +3 pts
                    </b>
                  </div>
                </div>

                {/* Panel 3 : YouTube · Commentaire */}
                <div
                  onClick={() => handlePanelClick("youtube")}
                  className={`floating-3d-card group bg-[#1B1A26] border border-[#2E2C40] ${
                    clickedPanels["youtube"] ? "!border-[#FFB84D] !scale-105" : ""
                  }`}
                  style={
                    {
                      top: "284px",
                      left: "12px",
                      right: "40px",
                      "--rx": "6deg",
                      "--ry": "-12deg",
                      animationDelay: "-4s",
                    } as React.CSSProperties
                  }
                  title="Cliquez pour tester l'interaction !"
                >
                  <div className="flex items-center justify-between text-[13px] text-[#C9C6DB]">
                    <span className="group-hover:text-white transition-colors">
                      YouTube · Commentaire
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold group-hover:bg-rose-500 group-hover:text-white transition-all">
                      {clickedPanels["youtube"] ? "✓ Action simulée !" : "Vérifié"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 mt-2.5 flex-nowrap">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center font-extrabold text-sm text-white shrink-0 group-hover:scale-110 transition-transform">
                      YT
                    </div>
                    <div className="flex-1 min-w-0">
                      <b className="block text-white text-sm truncate group-hover:text-[#FFB84D] transition-colors">
                        Short de @crea_media
                      </b>
                      <span className="text-xs text-[#C9C6DB]">
                        Engagement organique authentique
                      </span>
                    </div>
                    <b className="text-[#FFB84D] text-lg font-extrabold shrink-0 group-hover:scale-110 transition-transform">
                      +2 pts
                    </b>
                  </div>
                </div>

                {/* Pièce d'or rotative */}
                <div className="coin-spin-3d absolute -top-2 right-2 w-[76px] h-[76px] rounded-full bg-[#FFB84D] text-[#0E0D14] font-extrabold flex items-center justify-center text-[22px] shadow-2xl border-4 border-[#FFE0A3] select-none">
                  pt
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BANDEAU TICKER DÉFILANT CONTINU (De Droite à Gauche Sans Fin)
          Aucune mention de SaaSPay
         ===================================================================== */}
      <div className="marquee-container bg-[#5B3DF5] text-white py-3.5 font-extrabold tracking-[0.14em] text-xs sm:text-sm shadow-md">
        <div className="marquee-content">
          <span className="px-6">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT IMMÉDIAT · PAIEMENT MOBILE MONEY (ORANGE, MTN, WAVE, MOOV) · SANS BOT · 100% HUMAIN ·
          </span>
          <span className="px-6">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT IMMÉDIAT · PAIEMENT MOBILE MONEY (ORANGE, MTN, WAVE, MOOV) · SANS BOT · 100% HUMAIN ·
          </span>
        </div>
        <div className="marquee-content" aria-hidden="true">
          <span className="px-6">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT IMMÉDIAT · PAIEMENT MOBILE MONEY (ORANGE, MTN, WAVE, MOOV) · SANS BOT · 100% HUMAIN ·
          </span>
          <span className="px-6">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT IMMÉDIAT · PAIEMENT MOBILE MONEY (ORANGE, MTN, WAVE, MOOV) · SANS BOT · 100% HUMAIN ·
          </span>
        </div>
      </div>

      {/* =====================================================================
          NOUVEAU BANDEAU PARTENAIRES RÉSEAUX SOCIAUX (Style Sponsors)
         ===================================================================== */}
      <section id="ecosystem" className="bg-[#12122A] text-white py-10 border-b border-[#2E2C40]">
        <div className="max-w-[1140px] mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-[#C9C6DB] font-extrabold mb-6">
            Écosystème de Réseaux Compatibles · Actifs & Déploiements Futurs
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {supportedNetworks.map((net) => (
              <div
                key={net.name}
                className={`px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${
                  net.active
                    ? "bg-[#1B1A26] border-[#5B3DF5]/60 text-white shadow-md hover:border-[#FFB84D]"
                    : "bg-[#1B1A26]/40 border-[#2E2C40] text-[#7A7A90]"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${net.color}`}
                />
                <span className="font-extrabold text-xs sm:text-sm">
                  {net.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    net.active
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {net.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2 : COMMENT ÇA MARCHE (Icônes & Badges Modernisés)
         ===================================================================== */}
      <section id="how" className="max-w-[1140px] mx-auto px-6 py-20 md:py-24">
        <div className="max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#5B3DF5]">
            Cycle d'échange équitable
          </span>
          <h2 className="text-[34px] sm:text-[42px] font-extrabold tracking-tight text-[#12122A] mt-1 mb-3">
            Comment ça marche
          </h2>
          <p className="text-[#5A5A70] text-base leading-relaxed">
            Un système d'interaction transparent où chaque action provient d'un
            vrai créateur et où vous maîtrisez l'ensemble de vos paramètres.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {/* Étape 1 */}
          <div className="addme-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[#EEEAFF] text-[#5B3DF5] flex items-center justify-center font-extrabold text-xl shadow-xs">
                  <Link2 className="h-7 w-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#12122A] text-white text-xs font-extrabold">
                  Étape 01
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-[#12122A] mb-2">
                Ajoutez une publication
              </h3>
              <p className="text-[#5A5A70] text-sm leading-relaxed">
                Collez le lien de votre vidéo TikTok, Reel Instagram ou Short
                YouTube. Fixez vous-même les points offerts par interaction (1,
                2, 3 pts...) et la durée de diffusion (0,5 pt/j).
              </p>
            </div>
            <div className="pt-4 border-t border-[#E3E3EE] text-xs font-bold text-[#5B3DF5] flex items-center gap-1.5">
              <span>✓ Paramètres 100% libres</span>
            </div>
          </div>

          {/* Étape 2 */}
          <div className="addme-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[#EEEAFF] text-[#5B3DF5] flex items-center justify-center font-extrabold text-xl shadow-xs">
                  <Play className="h-7 w-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#5B3DF5] text-white text-xs font-extrabold">
                  Étape 02
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-[#12122A] mb-2">
                Gagnez des points sans délai
              </h3>
              <p className="text-[#5A5A70] text-sm leading-relaxed">
                Likez, commentez ou abonnez-vous depuis les publications des
                autres. Après 10 secondes de visionnage effectif, vos points sont
                crédités <strong className="text-[#12122A]">immédiatement</strong>{" "}
                sur votre solde et la tâche disparaît.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E3E3EE] text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <span>✓ Zéro attente 24h</span>
            </div>
          </div>

          {/* Étape 3 */}
          <div className="addme-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[#EEEAFF] text-[#5B3DF5] flex items-center justify-center font-extrabold text-xl shadow-xs">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[#12122A] text-white text-xs font-extrabold">
                  Étape 03
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-[#12122A] mb-2">
                Recevez un engagement unique
              </h3>
              <p className="text-[#5A5A70] text-sm leading-relaxed">
                Chaque membre ne peut interagir avec votre publication qu’
                <strong className="text-[#12122A]">une seule fois</strong>. Vos
                interactions proviennent toutes d'utilisateurs distincts pour
                déclencher naturellement les algorithmes.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E3E3EE] text-xs font-bold text-[#5B3DF5] flex items-center gap-1.5">
              <span>✓ Règle anti-spam 1x stricte</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3 : SIMULATEUR INTERACTIF DE CAMPAGNE SUR-MESURE
         ===================================================================== */}
      <section id="simulateur" className="max-w-[1140px] mx-auto px-6 pb-20 md:pb-24">
        <div className="addme-card-static p-6 sm:p-10 bg-white border-2 border-[#E3E3EE] shadow-xl">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#5B3DF5]">
              Transparence Totale
            </span>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[#12122A] mt-1">
              Simulez votre prochaine campagne
            </h2>
            <p className="text-sm text-[#5A5A70] mt-1">
              Sur AddMe.io, aucun tarif imposé : vous décidez combien de points
              vous offrez par action et combien de jours dure votre diffusion.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Contrôles Gauche */}
            <div className="lg:col-span-7 space-y-6">
              {/* Choix du Réseau & Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] mb-2">
                    1. Réseau social
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["TIKTOK", "INSTAGRAM", "YOUTUBE"] as const).map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setSimPlatform(net)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          simPlatform === net
                            ? "bg-[#12122A] text-white border-[#12122A]"
                            : "bg-[#F7F7FB] text-[#5A5A70] border-[#E3E3EE] hover:border-[#5B3DF5]"
                        }`}
                      >
                        {net === "TIKTOK"
                          ? "TikTok"
                          : net === "INSTAGRAM"
                          ? "Instagram"
                          : "YouTube"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] mb-2">
                    2. Action souhaitée
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "LIKE", label: "Like", icon: Heart },
                      { id: "COMMENT", label: "Commentaire", icon: MessageCircle },
                      { id: "SUBSCRIBE", label: "Abonnement", icon: UserPlus },
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() =>
                          setSimAction(act.id as "LIKE" | "COMMENT" | "SUBSCRIBE")
                        }
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                          simAction === act.id
                            ? "bg-[#5B3DF5] text-white border-[#5B3DF5]"
                            : "bg-[#F7F7FB] text-[#5A5A70] border-[#E3E3EE] hover:border-[#5B3DF5]"
                        }`}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Points offerts par personne */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="uppercase tracking-wider text-[#5A5A70]">
                    3. Points offerts à chaque personne qui fait l'action
                  </span>
                  <span className="text-[#5B3DF5] font-extrabold">
                    {simReward} pt{simReward > 1 ? "s" : ""} / personne
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {[1, 2, 3, 5].map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setSimReward(pt)}
                      className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                        simReward === pt
                          ? "bg-[#EEEAFF] border-[#5B3DF5] text-[#3A22C8]"
                          : "bg-[#F7F7FB] border-[#E3E3EE] text-[#5A5A70]"
                      }`}
                    >
                      {pt} point{pt > 1 ? "s" : ""}{" "}
                      {pt >= 3 ? "🔥 Prioritaire" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre de personnes souhaitées */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="uppercase tracking-wider text-[#5A5A70]">
                    4. Nombre de personnes souhaitées (Utilisateurs uniques)
                  </span>
                  <span className="text-[#12122A] font-extrabold">
                    {simQuantity} personnes
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={simQuantity}
                  onChange={(e) => setSimQuantity(Number(e.target.value))}
                  className="w-full accent-[#5B3DF5] cursor-pointer"
                />
              </div>

              {/* Durée en jours */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="uppercase tracking-wider text-[#5A5A70]">
                    5. Durée de la campagne (0,5 pt / jour)
                  </span>
                  <span className="text-[#12122A] font-extrabold">
                    {simDays} jour{simDays > 1 ? "s" : ""} (+{simDurationFee} pts)
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={14}
                  step={1}
                  value={simDays}
                  onChange={(e) => setSimDays(Number(e.target.value))}
                  className="w-full accent-[#5B3DF5] cursor-pointer"
                />
              </div>
            </div>

            {/* Résumé Droite */}
            <div className="lg:col-span-5 bg-[#0E0D14] text-white p-7 rounded-2xl border border-[#2E2C40] space-y-5">
              <div className="flex items-center justify-between border-b border-[#2E2C40] pb-4">
                <div>
                  <div className="text-xs text-[#C9C6DB]">Budget total estimé</div>
                  <div className="text-4xl font-extrabold text-[#FFB84D] mt-0.5">
                    {simTotalPoints} pts
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#1B1A26] border border-[#2E2C40] text-xs font-bold text-white">
                  {simPlatform} · {simAction}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-[#C9C6DB]">
                <div className="flex justify-between">
                  <span>
                    Récompenses ({simQuantity} pers. × {simReward} pt)
                  </span>
                  <strong className="text-white">{simActionCost} pts</strong>
                </div>
                <div className="flex justify-between">
                  <span>Frais de durée ({simDays} j × 0,5 pt)</span>
                  <strong className="text-white">+{simDurationFee} pts</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#2E2C40]">
                  <span>Cadence automatique lissée</span>
                  <strong className="text-emerald-400">
                    ~{simDailyCap} actions / jour
                  </strong>
                </div>
              </div>

              <Link
                href={isAuthenticated ? "/campaigns/new" : "/register"}
                className="addme-btn addme-btn-primary w-full text-sm py-3.5"
              >
                <span>
                  {isAuthenticated
                    ? "Lancer cette campagne maintenant"
                    : "Créer mon compte et lancer (+10 pts offerts)"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4 : LE MANIFESTE SOMBRE (Contraste Bots vs Humain)
         ===================================================================== */}
      <section className="bg-[#0E0D14] text-white py-20 md:py-24">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="max-w-3xl space-y-4">
            <p className="text-lg sm:text-xl text-[#C9C6DB]">
              La plupart des services de boost se concentrent sur :{" "}
              <span className="line-through opacity-70">
                des fermes de faux robots qui pénalisent vos comptes sociaux.
              </span>
            </p>
            <h2 className="text-[32px] sm:text-[48px] font-extrabold leading-[1.1] tracking-tight">
              Nous nous concentrons sur :{" "}
              <span className="text-[#FFB84D] font-serif-drama italic">
                l’engagement humain mutuel, unique et vérifié.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-2xl bg-[#1B1A26] border border-[#2E2C40]">
              <ShieldCheck className="h-7 w-7 text-[#FFB84D] mb-3" />
              <h3 className="text-lg font-bold text-white">
                Zéro mot de passe requis
              </h3>
              <p className="text-sm text-[#C9C6DB] mt-1.5 leading-relaxed">
                Vos comptes sociaux restent strictement sous votre contrôle. La
                vérification se fait uniquement via un code temporaire dans votre bio.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#1B1A26] border border-[#2E2C40]">
              <Users className="h-7 w-7 text-[#FFB84D] mb-3" />
              <h3 className="text-lg font-bold text-white">
                1 Membre = 1 Seule Action
              </h3>
              <p className="text-sm text-[#C9C6DB] mt-1.5 leading-relaxed">
                Chaque publication ne peut être accomplie qu'une seule fois par
                utilisateur. Vous ne recevez jamais de spams répétitifs.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#1B1A26] border border-[#2E2C40]">
              <Zap className="h-7 w-7 text-[#FFB84D] mb-3" />
              <h3 className="text-lg font-bold text-white">
                Points doublés & Mobile Money
              </h3>
              <p className="text-sm text-[#C9C6DB] mt-1.5 leading-relaxed">
                Rechargez vos points en toute simplicité en FCFA via Mobile Money
                (Orange, MTN, Wave, Moov) ou Carte Bancaire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5 : TARIFS & PACKS DE POINTS DOUBLÉS (Mobile Money en FCFA)
         ===================================================================== */}
      <section id="prix" className="max-w-[1140px] mx-auto px-6 py-20 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#5B3DF5]">
              Boutique de Points · Volume Doublé
            </span>
            <h2 className="text-[34px] sm:text-[42px] font-extrabold text-[#12122A] mt-1 mb-1">
              Tarifs
            </h2>
            <p className="text-[#5A5A70] text-base">
              Packs de points doublés, sans abonnement obligatoire. Paiement
              Mobile Money (FCFA) & Carte Bancaire (EUR).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30">
              <Smartphone className="h-3.5 w-3.5 text-amber-600" />
              Mobile Money : Orange · MTN · Wave · Moov
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E3E3EE] text-[#12122A]">
              <CreditCard className="h-3.5 w-3.5 text-[#5B3DF5]" />
              Carte : Visa · Mastercard
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 items-stretch">
          {POINT_PACKS.map((pack) => {
            const isPopular = Boolean(pack.popular);
            return (
              <div
                key={pack.id}
                className={`addme-card flex flex-col justify-between ${
                  isPopular
                    ? "border-2 border-[#5B3DF5] relative shadow-xl"
                    : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-lg font-extrabold text-[#12122A]">
                      {pack.name} {isPopular ? "· Populaire" : ""}
                    </b>
                    {isPopular && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EEEAFF] text-[#3A22C8] text-xs font-extrabold">
                        Recommandé
                      </span>
                    )}
                  </div>

                  <div className="mt-4 mb-1 flex items-baseline gap-2">
                    <span className="text-[38px] font-extrabold text-[#12122A]">
                      {pack.priceFormatted}
                    </span>
                    <span className="text-sm font-bold text-[#5B3DF5]">
                      / {pack.priceFcfaFormatted}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EEEAFF] text-[#3A22C8] font-extrabold text-sm mb-4">
                    <span>+{pack.points} points crédités</span>
                  </div>

                  <p className="text-sm text-[#5A5A70] leading-relaxed mb-6">
                    {pack.description}
                  </p>

                  <ul className="space-y-2.5 text-xs text-[#3A3A52] mb-6 pt-4 border-t border-[#E3E3EE]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#5B3DF5] shrink-0" />
                      <span>Jusqu'à {pack.points} actions uniques</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#5B3DF5] shrink-0" />
                      <span>Paiement Mobile Money ou Carte Bancaire</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#5B3DF5] shrink-0" />
                      <span>Points permanents sans expiration</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href={isAuthenticated ? "/shop" : "/register"}
                  className={`addme-btn w-full ${
                    isPopular ? "addme-btn-primary" : "addme-btn-ghost"
                  }`}
                >
                  Choisir ce pack ({pack.points} pts)
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          SECTION 6 : FAQ ANTI-OBJECTIONS
         ===================================================================== */}
      <section id="faq" className="max-w-[900px] mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-[32px] sm:text-[38px] font-extrabold text-[#12122A]">
            Questions fréquentes
          </h2>
          <p className="text-sm text-[#5A5A70] mt-1">
            Tout savoir sur le fonctionnement des campagnes, des points et de la
            sécurité.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-[#E3E3EE] rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#12122A] hover:bg-[#F7F7FB] transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#5B3DF5] shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-[#5A5A70] leading-relaxed border-t border-[#E3E3EE] pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          PIED DE PAGE SOMBRE
         ===================================================================== */}
      <footer className="bg-[#0E0D14] text-white py-10 mt-auto">
        <div className="max-w-[1140px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/icon.svg" alt="AddMe.io" className="h-6 w-6 rounded-md" />
              <b className="text-xl font-extrabold">
                AddMe<span className="text-[#FFB84D]">.io</span>
              </b>
            </Link>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B1A26] border border-[#2E2C40] text-[11px] font-mono-code text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Système Opérationnel
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[#C9C6DB]">
            <Link href="/legal/terms" className="hover:text-white transition-colors">
              CGU
            </Link>
            <span>·</span>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">
              Confidentialité
            </Link>
            <span>·</span>
            <Link
              href="/legal/disclaimer"
              className="hover:text-white transition-colors"
            >
              Avertissement Réseaux
            </Link>
            <span>·</span>
            <span>© {new Date().getFullYear()} AddMe.io</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
