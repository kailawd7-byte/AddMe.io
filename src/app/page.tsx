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
  Clock,
  ChevronDown,
  Zap,
  Users,
  Heart,
  MessageCircle,
  UserPlus,
  Activity,
} from "lucide-react";
import { POINT_PACKS } from "@/lib/constants";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);

  // Simulateur de campagne sur-mesure
  const [simPlatform, setSimPlatform] = useState<"TIKTOK" | "INSTAGRAM" | "YOUTUBE">("TIKTOK");
  const [simAction, setSimAction] = useState<"LIKE" | "COMMENT" | "SUBSCRIBE">("LIKE");
  const [simQuantity, setSimQuantity] = useState<number>(30);
  const [simReward, setSimReward] = useState<number>(1);
  const [simDays, setSimDays] = useState<number>(4);

  // Artefact 1 : Mélangeur Diagnostique (Cycling cards)
  const [shuffleItems, setShuffleItems] = useState([
    {
      id: "rule-1",
      tag: "ANTI-SPAM STRICT",
      title: "1 seule action par utilisateur",
      desc: "Impossible de liker ou s'abonner 2 fois. Chaque interaction provient d'un membre unique.",
      badge: "Vérifié",
    },
    {
      id: "rule-2",
      tag: "CRÉDIT DIRECT",
      title: "Points crédités immédiatement",
      desc: "Dès les 10s de visionnage validées, vos points s'ajoutent instantanément à votre solde.",
      badge: "0h d'attente",
    },
    {
      id: "rule-3",
      tag: "PROPRIÉTÉ BIO",
      title: "Code unique ADDME-XXXXX",
      desc: "Vérification sans mot de passe via code en biographie TikTok, Instagram ou YouTube.",
      badge: "100% Sûr",
    },
  ]);

  // Artefact 2 : Machine à écrire Télémétrie Ledger
  const telemetryLines = [
    "[LEDGER] +2.0 pts crédités à @kofi_crea (Abonnement Instagram vérifié · 11.4s)",
    "[CAMPAGNE] Publication TikTok de @sarah_vlogs : 18/25 likes uniques livrés",
    "[SAASPAY] Pack Créateur (+300 pts) activé via Wave Mobile Money (8 500 FCFA)",
    "[ANTI-FRAUDE] Tâche retirée du flux de @alex_yt après exécution (Règle 1x)",
  ];
  const [lineIndex, setLineIndex] = useState(0);
  const [typedText, setTypedText] = useState("");

  // Artefact 3 : Planificateur Protocole Semaine
  const [activeDayIndex, setActiveDayIndex] = useState(2);

  // FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setIsAuthenticated(true);
          setUserBalance(data.user.balance ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  // Cycle Artefact 1 toutes les 3 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setShuffleItems((prev) => {
        const copy = [...prev];
        const last = copy.pop();
        if (last) copy.unshift(last);
        return copy;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Cycle Artefact 2 (Typewriter)
  useEffect(() => {
    const currentFullLine = telemetryLines[lineIndex];
    let charIdx = 0;
    setTypedText("");

    const typeTimer = setInterval(() => {
      charIdx++;
      setTypedText(currentFullLine.slice(0, charIdx));
      if (charIdx >= currentFullLine.length) {
        clearInterval(typeTimer);
        setTimeout(() => {
          setLineIndex((prev) => (prev + 1) % telemetryLines.length);
        }, 1800);
      }
    }, 28);

    return () => clearInterval(typeTimer);
  }, [lineIndex]);

  // Cycle Artefact 3 (Jours de diffusion)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDayIndex((prev) => (prev + 1) % 7);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  const simActionCost = simQuantity * simReward;
  const simDurationFee = Number((simDays * 0.5).toFixed(1));
  const simTotalPoints = Number((simActionCost + simDurationFee).toFixed(1));
  const simDailyCap = Math.max(1, Math.ceil(simQuantity / simDays));

  const faqs = [
    {
      q: "Pourquoi mes points sont-ils crédités immédiatement sans attendre 24h ?",
      a: "Nous avons supprimé la rétention de 24 heures pour fluidifier vos échanges. Dès que vous visionnez une publication pendant au moins 10 secondes et validez votre action, vos points sont crédités directement sur votre solde disponible et la tâche disparaît de votre liste.",
    },
    {
      q: "Un même utilisateur peut-il liker ou s'abonner plusieurs fois à ma publication ?",
      a: "Non, jamais. Sur TikTok, Instagram comme YouTube, on ne peut liker ou s'abonner qu'une seule fois. Notre moteur affiche une seule carte par publication : dès qu'un membre effectue la tâche, elle disparaît définitivement de son écran. Si vous lancez plus tard une autre campagne avec une action différente (ex: Commentaire après Like), elle redeviendra visible.",
    },
    {
      q: "Comment fonctionne la tarification libre d'une campagne ?",
      a: "C'est 100% transparent : vous choisissez vous-même le nombre de personnes souhaitées, le nombre de points que vous offrez par action (1 pt, 2 pts, 3 pts... plus vous offrez, plus votre publication passe en priorité), et le nombre de jours de diffusion (0,5 point par jour).",
    },
    {
      q: "Puis-je payer mes packs de points par Mobile Money en Afrique ?",
      a: "Oui ! Grâce à l'intégration SaaSPay, vous pouvez régler vos packs en FCFA via Orange Money, MTN Mobile Money, Wave ou Moov Money, ainsi que par carte bancaire via Stripe. Les points des packs ont été doublés (100, 300 et 1 000 points) au même tarif.",
    },
    {
      q: "Dois-je donner le mot de passe de mon compte TikTok, Instagram ou YouTube ?",
      a: "Jamais. AddMe.io ne vous demandera jamais vos identifiants. Pour prouver qu'un profil vous appartient, vous collez simplement un code unique (ex: ADDME-8F92A) dans votre biographie le temps de la validation.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FB] text-[#12122A]">
      {/* =====================================================================
          SECTION 1 : HERO CINÉMATOGRAPHIQUE SOMBRE (Style Main.dc.html + Skill 01)
         ===================================================================== */}
      <section className="bg-[#0E0D14] text-white overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28 relative">
        {/* Glow subtil d'arrière-plan */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-[#5B3DF5]/20 blur-[130px] rounded-full" />

        <div className="max-w-[1140px] mx-auto px-6 relative z-10">
          <div className="flex flex-wrap items-center gap-12 lg:gap-14">
            {/* Colonne Gauche : Message & CTA */}
            <div className="flex-[1_1_500px] animate-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B1A26] border border-[#2E2C40] text-xs font-semibold text-[#C9C6DB] mb-6">
                <Sparkles className="h-3.5 w-3.5 text-[#FFB84D]" />
                <span>TikTok · Instagram · YouTube — Échange P2P 100% Réel</span>
              </div>

              <h1 className="text-[44px] sm:text-[60px] lg:text-[68px] font-extrabold leading-[1.02] tracking-[-0.03em] m-0 mb-5">
                Donnez de l’attention.{" "}
                <span className="text-[#FFB84D] font-serif-drama italic font-bold">
                  Recevez-en.
                </span>
              </h1>

              <p className="text-lg sm:text-[19px] leading-[1.6] text-[#C9C6DB] max-w-xl m-0">
                Propulsez vos contenus sur vos réseaux en échange d’engagement.
                Interagissez avec les publications d’autres créateurs, gagnez des
                points immédiatement, puis dépensez-les pour faire grandir les vôtres.
              </p>

              {/* Boutons d'action adaptés à l'état de connexion */}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="addme-btn addme-btn-primary text-base px-7 py-4"
                    >
                      <span>Accéder à mon Tableau de bord ({userBalance.toFixed(0)} pts)</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/tasks"
                      className="addme-btn text-white border border-[#4A4760] hover:border-white px-6 py-4"
                    >
                      Gagner des points maintenant
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

              {/* Piliers de réassurance */}
              <div className="mt-9 pt-7 border-t border-[#2E2C40]/80 grid grid-cols-3 gap-4 max-w-lg text-xs text-[#C9C6DB]">
                <div>
                  <div className="font-extrabold text-white text-base">0 Bot</div>
                  <div className="opacity-75">100% d'humains vérifiés</div>
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

            {/* Colonne Droite : Scène 3D de Cartes Flottantes + Pièce d'Or Rotative (Main.dc.html) */}
            <div
              className="flex-[1_1_400px] relative h-[430px] sm:h-[450px] w-full max-w-[480px] mx-auto"
              style={{ perspective: "1200px" }}
            >
              <div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Carte 3D #1 : TikTok · Like */}
                <div
                  className="floating-3d-card bg-[#1B1A26] border border-[#2E2C40]"
                  style={
                    {
                      top: "20px",
                      left: "0px",
                      right: "56px",
                      "--rx": "8deg",
                      "--ry": "-16deg",
                      animationDelay: "0s",
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center justify-between text-[13px] text-[#C9C6DB]">
                    <span>TikTok · Like</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold">
                      1x unique
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 mt-2.5 flex-nowrap">
                    <div className="w-12 h-12 rounded-[10px] bg-gradient-to-tr from-pink-600 to-rose-400 flex items-center justify-center font-extrabold text-sm text-white shrink-0">
                      TT
                    </div>
                    <div className="flex-1 min-w-0">
                      <b className="block text-white text-sm truncate">
                        Vidéo de @créateur_tiktok
                      </b>
                      <span className="text-xs text-[#C9C6DB]">
                        Chrono 10s validé · Crédit direct
                      </span>
                    </div>
                    <b className="text-[#FFB84D] text-lg font-extrabold shrink-0">
                      +1 pt
                    </b>
                  </div>
                </div>

                {/* Carte 3D #2 : Instagram · Abonnement (Mise en avant #5B3DF5) */}
                <div
                  className="floating-3d-card bg-[#5B3DF5] border border-[#7C63F8]"
                  style={
                    {
                      top: "152px",
                      left: "48px",
                      right: "0px",
                      "--rx": "8deg",
                      "--ry": "-16deg",
                      animationDelay: "-2s",
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center justify-between text-[13px] text-white/85">
                    <span>Instagram · Abonnement</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">
                      Prioritaire
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 mt-2.5 flex-nowrap">
                    <div className="w-12 h-12 rounded-[10px] bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center font-extrabold text-sm text-white shrink-0">
                      IG
                    </div>
                    <div className="flex-1 min-w-0">
                      <b className="block text-white text-sm truncate">
                        Reel de @studio.creatif
                      </b>
                      <span className="text-xs text-white/80">
                        Récompense choisie par le créateur
                      </span>
                    </div>
                    <b className="text-[#FFB84D] text-lg font-extrabold shrink-0">
                      +3 pts
                    </b>
                  </div>
                </div>

                {/* Carte 3D #3 : YouTube · Commentaire */}
                <div
                  className="floating-3d-card bg-[#1B1A26] border border-[#2E2C40]"
                  style={
                    {
                      top: "284px",
                      left: "12px",
                      right: "40px",
                      "--rx": "8deg",
                      "--ry": "-16deg",
                      animationDelay: "-4s",
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center justify-between text-[13px] text-[#C9C6DB]">
                    <span>YouTube · Commentaire</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
                      Vérifié
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 mt-2.5 flex-nowrap">
                    <div className="w-12 h-12 rounded-[10px] bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center font-extrabold text-sm text-white shrink-0">
                      YT
                    </div>
                    <div className="flex-1 min-w-0">
                      <b className="block text-white text-sm truncate">
                        Short de @tech_afrique
                      </b>
                      <span className="text-xs text-[#C9C6DB]">
                        Engagement organique authentique
                      </span>
                    </div>
                    <b className="text-[#FFB84D] text-lg font-extrabold shrink-0">
                      +2 pts
                    </b>
                  </div>
                </div>

                {/* Pièce d'or rotative "pt" (Style exact Main.dc.html) */}
                <div className="coin-spin-3d absolute -top-2 right-2 w-[76px] h-[76px] rounded-full bg-[#FFB84D] text-[#0E0D14] font-extrabold flex items-center justify-center text-[22px] shadow-2xl border-4 border-[#FFE0A3]">
                  pt
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BANDEAU TICKER CONTINU (#5B3DF5 - Main.dc.html)
         ===================================================================== */}
      <div className="bg-[#5B3DF5] text-white overflow-hidden whitespace-nowrap py-4 font-extrabold tracking-[0.12em] text-sm">
        <div className="marquee-track">
          <span className="px-7">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT · PAIEMENT MOBILE MONEY SAASPAY ·
          </span>
          <span className="px-7">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT · PAIEMENT MOBILE MONEY SAASPAY ·
          </span>
          <span className="px-7">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT · PAIEMENT MOBILE MONEY SAASPAY ·
          </span>
          <span className="px-7">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT · PAIEMENT MOBILE MONEY SAASPAY ·
          </span>
        </div>
      </div>

      {/* =====================================================================
          SECTION 2 : COMMENT ÇA MARCHE (Chiffres Stroke 01, 02, 03 - Main.dc.html)
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
            Un système pair-à-pair limpide où chaque interaction provient d'un
            vrai créateur et où vous maîtrisez 100% de vos récompenses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          <div className="addme-card animate-up">
            <div className="stroke-number-big">01</div>
            <h3 className="text-[22px] font-extrabold text-[#12122A] mt-4 mb-2">
              Ajoutez une publication
            </h3>
            <p className="text-[#5A5A70] text-sm leading-relaxed">
              Collez le lien d’une de vos vidéos TikTok, Reels Instagram ou
              Shorts YouTube. Fixez librement les points offerts par action (1,
              2, 3 pts...) et le nombre de jours de diffusion (0,5 pt/jour).
            </p>
          </div>

          <div className="addme-card animate-up-1">
            <div className="stroke-number-big">02</div>
            <h3 className="text-[22px] font-extrabold text-[#12122A] mt-4 mb-2">
              Gagnez des points sans attente
            </h3>
            <p className="text-[#5A5A70] text-sm leading-relaxed">
              Likez, commentez ou abonnez-vous depuis les publications des
              autres. Après 10 secondes de visionnage, vos points sont crédités{" "}
              <strong className="text-[#12122A]">immédiatement</strong> sur votre
              solde et la tâche disparaît.
            </p>
          </div>

          <div className="addme-card animate-up-2">
            <div className="stroke-number-big">03</div>
            <h3 className="text-[22px] font-extrabold text-[#12122A] mt-4 mb-2">
              Recevez de l’engagement unique
            </h3>
            <p className="text-[#5A5A70] text-sm leading-relaxed">
              Chaque utilisateur ne peut effectuer votre tâche qu’
              <strong className="text-[#12122A]">une seule fois</strong>. Vos
              likes, commentaires et abonnements sont livrés par de vrais comptes
              différents au rythme choisi.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3 : ARTEFACTS FONCTIONNELS INTERACTIFS (Skill 01)
         ===================================================================== */}
      <section id="artefacts" className="max-w-[1140px] mx-auto px-6 pb-20 md:pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#5B3DF5]">
              Architecture Anti-Fraude & Temps Réel
            </span>
            <h2 className="text-[32px] sm:text-[40px] font-extrabold tracking-tight text-[#12122A] mt-1">
              Conçu comme un instrument de précision
            </h2>
          </div>
          <p className="text-sm text-[#5A5A70] max-w-md">
            Contrairement aux plateformes opaques, chaque point et chaque tâche
            sont régis par des garde-fous algorithmiques vérifiables.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {/* Artefact 1 : Mélangeur Diagnostique */}
          <div className="addme-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#5B3DF5] mb-3">
                <span>01 · GARANTIE D'UNICITÉ</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EEEAFF] text-[#3A22C8]">
                  Actif
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#12122A]">
                Moteur Anti-Spam & Preuve Bio
              </h3>
              <p className="text-xs text-[#5A5A70] mt-1 mb-5">
                Une seule carte par publication : impossible pour un membre de
                répéter la même action.
              </p>
            </div>

            <div className="space-y-2.5 bg-[#F7F7FB] p-3.5 rounded-2xl border border-[#E3E3EE]">
              {shuffleItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all duration-500 ${
                    idx === 0
                      ? "bg-white border-[#5B3DF5] shadow-md scale-[1.01]"
                      : "bg-white/70 border-[#E3E3EE] opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[#5B3DF5]">
                    <span>{item.tag}</span>
                    <span className="text-emerald-600">{item.badge}</span>
                  </div>
                  <div className="font-bold text-xs text-[#12122A] mt-1">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#5A5A70] mt-0.5 leading-snug">
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Artefact 2 : Machine à écrire Télémétrie Ledger */}
          <div className="addme-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#5B3DF5] mb-3">
                <span>02 · LEDGER COMPTABLE</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Flux en direct
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#12122A]">
                Crédit Immédiat sans Rétention 24h
              </h3>
              <p className="text-xs text-[#5A5A70] mt-1 mb-5">
                Chaque tâche validée déclenche une écriture atomique directe sur
                votre solde de points.
              </p>
            </div>

            <div className="bg-[#0E0D14] text-white p-5 rounded-2xl border border-[#2E2C40] font-mono-code text-xs min-h-[175px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-[#C9C6DB] border-b border-[#2E2C40] pb-2.5">
                <span>addme-ledger://stream</span>
                <span className="text-[#FFB84D]">STATUS: DIRECT_CREDIT</span>
              </div>
              <div className="my-4 text-emerald-400 leading-relaxed min-h-[54px]">
                {typedText}
                <span className="inline-block w-2 h-4 bg-[#FFB84D] ml-1 animate-pulse align-middle" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#2E2C40] text-[11px]">
                <div>
                  <span className="text-[#C9C6DB]">Délai de crédit :</span>{" "}
                  <strong className="text-white">0 seconde</strong>
                </div>
                <div className="text-right">
                  <span className="text-[#C9C6DB]">Chrono tâche :</span>{" "}
                  <strong className="text-[#FFB84D]">10s min.</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Artefact 3 : Planificateur de Diffusion */}
          <div className="addme-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[#5B3DF5] mb-3">
                <span>03 · CADENCE ORGANIQUE</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EEEAFF] text-[#3A22C8]">
                  0,5 pt / jour
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-[#12122A]">
                Diffusion Progressive Maîtrisée
              </h3>
              <p className="text-xs text-[#5A5A70] mt-1 mb-5">
                Choisissez le nombre de jours de votre campagne pour répartir
                naturellement les interactions.
              </p>
            </div>

            <div className="bg-[#F7F7FB] p-4 rounded-2xl border border-[#E3E3EE] space-y-4">
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {["L", "M", "M", "J", "V", "S", "D"].map((day, idx) => {
                  const isActive = idx <= activeDayIndex;
                  return (
                    <div
                      key={idx}
                      className={`py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                        isActive
                          ? "bg-[#5B3DF5] text-white shadow-sm scale-105"
                          : "bg-white border border-[#E3E3EE] text-[#5A5A70]"
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#E3E3EE] flex items-center justify-between text-xs">
                <span className="text-[#5A5A70] font-medium">
                  Durée active sélectionnée :
                </span>
                <span className="font-extrabold text-[#5B3DF5]">
                  {activeDayIndex + 1} jour(s) · +{((activeDayIndex + 1) * 0.5).toFixed(1)} pts
                </span>
              </div>
              <div className="text-[11px] text-[#5A5A70] flex items-center justify-between px-1">
                <span>Protection algorithme social</span>
                <span className="text-emerald-600 font-bold">✓ Cadence lissée</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4 : SIMULATEUR INTERACTIF DE CAMPAGNE SUR-MESURE
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
              vous offrez par action et combien de jours dure votre mission.
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
          SECTION 5 : LE MANIFESTE SOMBRE (Skill 01 - Contraste Bots vs Réel)
         ===================================================================== */}
      <section className="bg-[#0E0D14] text-white py-20 md:py-24">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="max-w-3xl space-y-4">
            <p className="text-lg sm:text-xl text-[#C9C6DB]">
              La plupart des plateformes de boost se concentrent sur :{" "}
              <span className="line-through opacity-70">
                des fermes de robots automatisés qui détruisent la portée de vos comptes.
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
                Vos comptes sociaux restent 100% sous votre contrôle. La liaison
                se fait uniquement par un code temporaire placé dans votre bio.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#1B1A26] border border-[#2E2C40]">
              <Users className="h-7 w-7 text-[#FFB84D] mb-3" />
              <h3 className="text-lg font-bold text-white">
                1 Membre = 1 Seule Action
              </h3>
              <p className="text-sm text-[#C9C6DB] mt-1.5 leading-relaxed">
                Chaque tâche disparaît aussitôt effectuée. Vous recevez
                uniquement des likes, commentaires et abonnements de personnes
                distinctes.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[#1B1A26] border border-[#2E2C40]">
              <Zap className="h-7 w-7 text-[#FFB84D] mb-3" />
              <h3 className="text-lg font-bold text-white">
                Points doublés & Mobile Money
              </h3>
              <p className="text-sm text-[#C9C6DB] mt-1.5 leading-relaxed">
                Pas le temps de faire des tâches ? Rechargez vos points en
                quelques secondes via Orange Money, MTN, Wave, Moov (SaaSPay) ou
                Carte Bancaire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 6 : TARIFS & PACKS DE POINTS DOUBLÉS (Style Main.dc.html + SaaSPay)
         ===================================================================== */}
      <section id="prix" className="max-w-[1140px] mx-auto px-6 py-20 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#5B3DF5]">
              Boutique de Points · Volume ×2
            </span>
            <h2 className="text-[34px] sm:text-[42px] font-extrabold text-[#12122A] mt-1 mb-1">
              Tarifs
            </h2>
            <p className="text-[#5A5A70] text-base">
              Packs de points doublés, sans abonnement obligatoire. Paiement
              Mobile Money (FCFA) & Carte (EUR).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30">
              <Smartphone className="h-3.5 w-3.5 text-amber-600" />
              SaaSPay : Orange · MTN · Wave · Moov
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E3E3EE] text-[#12122A]">
              <CreditCard className="h-3.5 w-3.5 text-[#5B3DF5]" />
              Stripe : Visa · Mastercard
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
                      <span>Jusqu'à {pack.points} actions à 1 pt</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#5B3DF5] shrink-0" />
                      <span>Paiement Mobile Money (SaaSPay) ou Carte</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#5B3DF5] shrink-0" />
                      <span>Points sans date d'expiration</span>
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
          SECTION 7 : FAQ ANTI-OBJECTIONS
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
          PIED DE PAGE SOMBRE (Style Main.dc.html + Indicateur Système Opérationnel)
         ===================================================================== */}
      <footer className="bg-[#0E0D14] text-white py-10 mt-auto">
        <div className="max-w-[1140px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <b className="text-xl font-extrabold">
              AddMe<span className="text-[#FFB84D]">.io</span>
            </b>
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
