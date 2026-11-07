"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  Lock,
  Award,
  Flame,
} from "lucide-react";
import { POINT_PACKS } from "@/lib/constants";

/**
 * Composant d'animation au défilement bidirectionnel (Haut -> Bas et Bas -> Haut)
 * Révèle progressivement chaque section, carte ou conteneur avec fluidité 60fps
 */
function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 750,
  className = "",
}: {
  children: ReactNode;
  variant?: "fade-up" | "fade-left" | "fade-right" | "zoom-in" | "scale-up";
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else {
            // Se réarme hors de l'écran pour rejouer l'animation lors du défilement inverse (bas -> haut ou haut -> bas)
            setIsVisible(false);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -35px 0px",
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const getHiddenTransform = () => {
    switch (variant) {
      case "fade-left":
        return "translate3d(-52px, 0px, 0) scale(0.97)";
      case "fade-right":
        return "translate3d(52px, 0px, 0) scale(0.97)";
      case "zoom-in":
        return "translate3d(0px, 28px, 0) scale(0.91)";
      case "scale-up":
        return "translate3d(0px, 36px, 0) scale(0.94)";
      case "fade-up":
      default:
        return "translate3d(0px, 48px, 0) scale(0.97)";
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translate3d(0px, 0px, 0) scale(1)"
          : getHiddenTransform(),
        filter: isVisible ? "blur(0px)" : "blur(4px)",
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform, filter",
      }}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Interaction sur les 3 panels de notification flottants du Hero
  const [clickedPanels, setClickedPanels] = useState<Record<string, boolean>>({});

  // Simulateur de campagne
  const [simPlatform, setSimPlatform] = useState<
    "TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "FACEBOOK" | "SNAPCHAT" | "LINKEDIN" | "X" | "THREADS"
  >("TIKTOK");
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

  // Suivi fluide de la progression du scroll pour la barre lumineuse supérieure
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) {
        setScrollProgress(0);
        return;
      }
      const current = Math.min(100, Math.max(0, (window.scrollY / totalScroll) * 100));
      setScrollProgress(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
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

  const faqs = [
    {
      q: "Combien de points reçois-je à l'inscription ?",
      a: "Vous recevez immédiatement 50 points gratuits dès la création de votre compte, ce qui vous permet de tester immédiatement la plateforme ou de lancer votre première campagne sans frais.",
    },
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
      a: "Oui ! Vous pouvez régler vos packs en FCFA via Orange Money, MTN Mobile Money, Wave ou Moov Money, ainsi que par carte bancaire. Les points de tous nos packs (100, 300 et 1 500 points) sont proposés au meilleur tarif.",
    },
    {
      q: "Dois-je donner le mot de passe de mon compte TikTok, Instagram ou YouTube ?",
      a: "Jamais. AddMe.io ne vous demandera jamais vos identifiants ou mots de passe. Pour prouver qu'un profil vous appartient, vous collez simplement un code temporaire unique (ex: ADDME-8F92A) dans votre biographie.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FB] text-[#12122A] relative selection:bg-[#5B3DF5] selection:text-white">
      {/* Barre de progression lumineuse du scroll tout en haut */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-[#5B3DF5] via-[#FFB84D] to-[#8B5CF6] shadow-[0_0_12px_rgba(255,184,77,0.8)] transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* =====================================================================
          SECTION 1 : HERO CINÉMATOGRAPHIQUE AVEC NUANCES AURORA EN MOUVEMENT
         ===================================================================== */}
      <section className="bg-[#0E0D14] text-white overflow-hidden pt-28 pb-16 md:pt-36 md:pb-28 relative">
        {/* Nuances de couleurs animées (Aurora Mesh) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="aurora-orb-1 absolute -top-24 left-1/4 w-[620px] h-[440px] bg-gradient-to-tr from-[#5B3DF5]/35 via-[#7C3AED]/25 to-transparent blur-[120px] rounded-full" />
          <div className="aurora-orb-2 absolute top-1/3 -right-20 w-[520px] h-[420px] bg-gradient-to-bl from-[#FFB84D]/20 via-[#F59E0B]/15 to-transparent blur-[130px] rounded-full" />
          <div className="aurora-orb-3 absolute -bottom-32 left-10 w-[550px] h-[380px] bg-gradient-to-tr from-[#3B82F6]/20 via-[#5B3DF5]/25 to-transparent blur-[125px] rounded-full" />
          <div className="cyber-grid-dark absolute inset-0" />
        </div>

        <div className="max-w-[1140px] mx-auto px-6 relative z-10">
          <div className="flex flex-wrap items-center gap-12 lg:gap-14">
            {/* Colonne Gauche */}
            <div className="flex-[1_1_500px] animate-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B1A26]/90 backdrop-blur-md border border-[#3E3B5B] text-xs font-semibold text-[#E2E0F5] mb-6 shadow-[0_0_25px_rgba(91,61,245,0.25)]">
                <Sparkles className="h-3.5 w-3.5 text-[#FFB84D] animate-pulse" />
                <span>Plateforme P2P Éthique · Engagement 100% Réel & Vérifié</span>
              </div>

              <h1 className="text-[44px] sm:text-[60px] lg:text-[68px] font-extrabold leading-[1.02] tracking-[-0.03em] m-0 mb-5">
                Donnez de l’attention.{" "}
                <span className="bg-gradient-to-r from-[#FFB84D] via-[#FFD285] to-[#FFB84D] bg-clip-text text-transparent font-serif-drama italic font-bold drop-shadow-[0_4px_24px_rgba(255,184,77,0.25)]">
                  Recevez-en.
                </span>
              </h1>

              <p className="text-lg sm:text-[19px] leading-[1.65] text-[#C9C6DB] max-w-xl m-0">
                Propulsez vos contenus sur vos 8 réseaux favoris en échange d’engagement réel.
                Interagissez manuellement avec les publications d’autres
                créateurs, gagnez des points immédiatement, puis réinvestissez-les
                pour faire décoller votre visibilité sur TikTok, Instagram, YouTube, Facebook, Snapchat, LinkedIn, X et Threads.
              </p>

              {/* Actions selon le statut de connexion */}
              <div className="flex flex-wrap items-center gap-4 mt-8">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="addme-btn addme-btn-primary text-base px-7 py-4 shadow-[0_12px_32px_-8px_rgba(91,61,245,0.65)]"
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
                      className="addme-btn text-white bg-white/5 backdrop-blur-md border border-[#4A4760] hover:border-[#FFB84D] hover:bg-white/10 px-6 py-4"
                    >
                      Gagner des points
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="addme-btn addme-btn-primary text-base px-7 py-4 shadow-[0_12px_32px_-8px_rgba(91,61,245,0.65)]"
                    >
                      <span>Créer mon compte · 50 points offerts</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href="#how"
                      className="addme-btn text-white bg-white/5 backdrop-blur-md border border-[#4A4760] hover:border-white hover:bg-white/10 px-6 py-4"
                    >
                      Voir comment ça marche
                    </a>
                  </>
                )}
              </div>

              {/* 3 Piliers */}
              <div className="mt-9 pt-7 border-t border-[#2E2C40]/80 grid grid-cols-3 gap-4 max-w-lg text-xs text-[#C9C6DB]">
                <div className="group">
                  <div className="font-extrabold text-white text-base group-hover:text-[#FFB84D] transition-colors">
                    0 Bot
                  </div>
                  <div className="opacity-75">100% interactions réelles</div>
                </div>
                <div className="group">
                  <div className="font-extrabold text-[#FFB84D] text-base">
                    Immédiat
                  </div>
                  <div className="opacity-75">Crédit direct sans attente</div>
                </div>
                <div className="group">
                  <div className="font-extrabold text-white text-base group-hover:text-[#FFB84D] transition-colors">
                    8 Réseaux
                  </div>
                  <div className="opacity-75">TikTok, IG, YT, X, FB, SC...</div>
                </div>
              </div>
            </div>

            {/* Colonne Droite : 3 Panels Interactifs avec Icônes Réseaux Officielles */}
            <div
              className="flex-[1_1_400px] relative h-[440px] sm:h-[460px] w-full max-w-[480px] mx-auto"
              style={{ perspective: "1200px" }}
            >
              {/* Halo lumineux derrière les cartes 3D */}
              <div className="pointer-events-none absolute inset-10 rounded-full bg-gradient-to-tr from-[#5B3DF5]/35 via-[#FFB84D]/15 to-transparent blur-3xl animate-pulse" />

              <div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Panel 1 : TikTok · Like */}
                <div
                  onClick={() => handlePanelClick("tiktok")}
                  className={`floating-3d-card group bg-[#1B1A26]/95 backdrop-blur-xl border border-[#2E2C40] ${
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
                    <img
                      src="/images/networks/tiktok.png"
                      alt="TikTok"
                      className="w-12 h-12 rounded-xl object-contain shadow-lg shrink-0 group-hover:scale-110 transition-transform bg-black p-1"
                    />
                    <div className="flex-1 min-w-0">
                      <b className="block text-white text-sm truncate group-hover:text-[#FFB84D] transition-colors">
                        Vidéo de @créateur_tiktok
                      </b>
                      <span className="text-xs text-[#C9C6DB]">
                        Visionnage 10s • Crédit direct
                      </span>
                    </div>
                    <b className="text-[#FFB84D] text-lg font-extrabold shrink-0 group-hover:scale-110 transition-transform">
                      +1 pts
                    </b>
                  </div>
                </div>

                {/* Panel 2 : Instagram · Abonnement */}
                <div
                  onClick={() => handlePanelClick("instagram")}
                  className={`floating-3d-card group bg-gradient-to-r from-[#5B3DF5] to-[#4A2BE3] border border-[#7C63F8] ${
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
                    <img
                      src="/images/networks/instagram.png"
                      alt="Instagram"
                      className="w-12 h-12 rounded-xl object-contain shadow-lg shrink-0 group-hover:scale-110 transition-transform"
                    />
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
                  className={`floating-3d-card group bg-[#1B1A26]/95 backdrop-blur-xl border border-[#2E2C40] ${
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
                    <img
                      src="/images/networks/youtube.png"
                      alt="YouTube"
                      className="w-12 h-12 rounded-xl object-contain shadow-lg shrink-0 group-hover:scale-110 transition-transform bg-white/10 p-1"
                    />
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
                <div className="coin-spin-3d absolute -top-2 right-2 w-[76px] h-[76px] rounded-full bg-gradient-to-br from-[#FFD479] via-[#FFB84D] to-[#E5941A] text-[#0E0D14] font-extrabold flex items-center justify-center text-[22px] shadow-[0_10px_30px_rgba(255,184,77,0.45)] border-4 border-[#FFE0A3] select-none">
                  pts
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BANDEAU TICKER DÉFILANT CONTINU (De Droite à Gauche - Annonce Perpétuelle)
         ===================================================================== */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#4B2DE5] via-[#5B3DF5] to-[#4B2DE5] text-white py-3.5 shadow-lg flex select-none pointer-events-none z-20">
        <div className="perpetual-marquee-track">
          <span className="px-6 font-extrabold tracking-[0.14em] text-xs sm:text-sm">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT IMMÉDIAT · PAIEMENT MOBILE MONEY (ORANGE, MTN, WAVE, MOOV) · SANS BOT · 100% HUMAIN ·
          </span>
          <span className="px-6 font-extrabold tracking-[0.14em] text-xs sm:text-sm">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT IMMÉDIAT · PAIEMENT MOBILE MONEY (ORANGE, MTN, WAVE, MOOV) · SANS BOT · 100% HUMAIN ·
          </span>
        </div>
        <div className="perpetual-marquee-track" aria-hidden="true">
          <span className="px-6 font-extrabold tracking-[0.14em] text-xs sm:text-sm">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT IMMÉDIAT · PAIEMENT MOBILE MONEY (ORANGE, MTN, WAVE, MOOV) · SANS BOT · 100% HUMAIN ·
          </span>
          <span className="px-6 font-extrabold tracking-[0.14em] text-xs sm:text-sm">
            TIKTOK · INSTAGRAM · YOUTUBE · LIKES · COMMENTAIRES · ABONNEMENTS · CRÉDIT DIRECT IMMÉDIAT · PAIEMENT MOBILE MONEY (ORANGE, MTN, WAVE, MOOV) · SANS BOT · 100% HUMAIN ·
          </span>
        </div>
      </div>

      {/* =====================================================================
          SECTION PARTENAIRES RÉSEAUX SOCIAUX (Style Sponsors Monochrome façon Notion)
         ===================================================================== */}
      <section
        id="ecosystem"
        className="bg-[#0E0D14] text-white py-14 sm:py-16 border-b border-[#2E2C40] relative overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#5B3DF5]/8 via-transparent to-transparent" />
        <div className="max-w-[1140px] mx-auto px-6 text-center relative z-10">
          <ScrollReveal variant="fade-up">
            <p className="text-xs sm:text-[13px] uppercase tracking-[0.2em] text-[#FFB84D] font-bold mb-2.5">
              Compatible avec l&apos;écosystème des 8 grands réseaux sociaux
            </p>
            <p className="text-sm text-[#C9C6DB] max-w-2xl mx-auto mb-10 leading-relaxed">
              Utilisez la plateforme AddMe.io pour amplifier votre visibilité, vos abonnés et vos interactions réelles sur l’ensemble de ces 8 réseaux.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="scale-up" delay={120}>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-14 lg:gap-16">
              {/* TikTok */}
              <div className="flex items-center gap-2.5 text-[#8E8CA0] hover:text-white transition-all duration-300 group cursor-default">
                <svg className="h-6 w-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.87-4.49V8.58a8.28 8.28 0 0 0 4.84 1.56V6.69h-.94z"/>
                </svg>
                <span className="font-extrabold text-base sm:text-lg tracking-tight">
                  TikTok
                </span>
              </div>

              {/* Instagram */}
              <div className="flex items-center gap-2.5 text-[#8E8CA0] hover:text-white transition-all duration-300 group cursor-default">
                <svg className="h-6 w-6 fill-none stroke-current stroke-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <span className="font-extrabold text-base sm:text-lg tracking-tight">
                  Instagram
                </span>
              </div>

              {/* YouTube */}
              <div className="flex items-center gap-2.5 text-[#8E8CA0] hover:text-white transition-all duration-300 group cursor-default">
                <svg className="h-6 w-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="font-extrabold text-base sm:text-lg tracking-tight">
                  YouTube
                </span>
              </div>

              {/* Facebook */}
              <div className="flex items-center gap-2.5 text-[#8E8CA0] hover:text-white transition-all duration-300 group cursor-default">
                <svg className="h-6 w-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="font-extrabold text-base sm:text-lg tracking-tight">
                  Facebook
                </span>
              </div>

              {/* Snapchat */}
              <div className="flex items-center gap-2.5 text-[#8E8CA0] hover:text-white transition-all duration-300 group cursor-default">
                <svg className="h-6 w-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M12.003 2c-3.528 0-6.046 2.37-6.046 5.86 0 .864.218 2.052.553 2.87.145.353-.027.604-.306.777-.52.32-.98.665-1.282 1.085-.308.43-.223.957.253 1.25.753.465 1.713.435 2.502.435.297 0 .548.163.548.45 0 .23-.133.565-.39.845-.58.632-1.353 1.144-2.186 1.492-.533.223-.746.68-.487 1.173.342.648 1.468.99 2.54 1.135 1.037.14 2.148.06 3.125.438.385.15.776.386 1.176.386.4 0 .791-.236 1.176-.386.977-.378 2.088-.298 3.125-.438 1.072-.145 2.198-.487 2.54-1.135.259-.493.046-.95-.487-1.173-.833-.348-1.606-.86-2.186-1.492-.257-.28-.39-.615-.39-.845 0-.287.251-.45.548-.45.789 0 1.749.03 2.502-.435.476-.293.561-.82.253-1.25-.302-.42-.762-.765-1.282-1.085-.279-.173-.451-.424-.306-.777.335-.818.553-2.006.553-2.87C18.05 4.37 15.532 2 12.003 2z"/>
                </svg>
                <span className="font-extrabold text-base sm:text-lg tracking-tight">
                  Snapchat
                </span>
              </div>

              {/* LinkedIn */}
              <div className="flex items-center gap-2.5 text-[#8E8CA0] hover:text-white transition-all duration-300 group cursor-default">
                <svg className="h-6 w-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span className="font-extrabold text-base sm:text-lg tracking-tight">
                  LinkedIn
                </span>
              </div>

              {/* X (Twitter) */}
              <div className="flex items-center gap-2.5 text-[#8E8CA0] hover:text-white transition-all duration-300 group cursor-default">
                <svg className="h-5 w-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="font-extrabold text-base sm:text-lg tracking-tight">
                  X
                </span>
              </div>

              {/* Threads */}
              <div className="flex items-center gap-2.5 text-[#8E8CA0] hover:text-white transition-all duration-300 group cursor-default">
                <svg className="h-6 w-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M12.186 24C5.466 24 0 18.634 0 12.018 0 5.402 5.466.035 12.186.035c6.643 0 11.894 5.21 11.894 11.983 0 7.375-6.079 11.66-11.894 11.66v-2.322c4.716 0 9.572-3.475 9.572-9.338 0-5.568-4.23-9.66-9.572-9.66-5.419 0-9.864 4.168-9.864 9.697 0 5.452 4.445 9.62 9.864 9.62 3.12 0 5.922-1.348 7.333-3.664l1.83 1.455C19.782 22.062 16.275 24 12.186 24zm2.846-13.43c.063.81.08 1.638-.052 2.457-.457 2.827-2.39 4.368-4.873 4.368-2.317 0-4.053-1.614-4.053-3.792 0-2.322 1.836-3.87 4.542-3.87.892 0 1.756.168 2.502.484-.047-.79-.247-1.464-.694-1.927-.674-.698-1.664-.993-2.65-.993-1.272 0-2.223.42-2.736 1.258l-1.897-1.332C6.113 7.82 7.747 7.03 9.906 7.03c1.782 0 3.393.58 4.417 1.642.71.737.95 1.706.709 2.898zm-2.48 2.052c-.628-.273-1.343-.41-2.073-.41-1.456 0-2.43.824-2.43 1.95 0 1.05.77 1.85 2.115 1.85 1.464 0 2.55-.953 2.766-2.585.034-.27.017-.542-.378-.805z"/>
                </svg>
                <span className="font-extrabold text-base sm:text-lg tracking-tight">
                  Threads
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* =====================================================================
          ZONE CLAIRE AVEC NUANCES DE COULEURS ANIMÉES EN ARRIÈRE-PLAN
          (Comment ça marche + Simulateur de campagne)
         ===================================================================== */}
      <div className="relative overflow-hidden">
        {/* Nuances de couleurs pastel animées en fond */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="aurora-orb-1 absolute top-12 -left-24 w-[560px] h-[560px] bg-gradient-to-br from-[#5B3DF5]/12 via-[#8B5CF6]/10 to-transparent blur-[110px] rounded-full" />
          <div className="aurora-orb-2 absolute top-1/3 -right-24 w-[520px] h-[520px] bg-gradient-to-tl from-[#FFB84D]/18 via-[#F59E0B]/10 to-transparent blur-[115px] rounded-full" />
          <div className="aurora-orb-3 absolute bottom-10 left-1/3 w-[600px] h-[440px] bg-gradient-to-tr from-[#3B82F6]/10 via-[#5B3DF5]/12 to-transparent blur-[120px] rounded-full" />
          <div className="cyber-grid-light absolute inset-0" />
        </div>

        {/* ===================================================================
            SECTION 2 : COMMENT ÇA MARCHE (Révélation en cascade au défilement)
           =================================================================== */}
        <section id="how" className="max-w-[1140px] mx-auto px-6 py-20 md:py-28 relative z-10">
          <ScrollReveal variant="fade-up">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFF] border border-[#D9D2FF] text-xs font-extrabold uppercase tracking-widest text-[#5B3DF5]">
                <Sparkles className="h-3.5 w-3.5" />
                Cycle d&apos;échange équitable
              </span>
              <h2 className="text-[34px] sm:text-[44px] font-extrabold tracking-tight text-[#12122A] mt-3 mb-3">
                Comment ça marche
              </h2>
              <p className="text-[#5A5A70] text-base sm:text-lg leading-relaxed">
                Un système d&apos;interaction transparent où chaque action provient d&apos;un
                vrai créateur et où vous maîtrisez l&apos;ensemble de vos paramètres.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-14">
            {/* Étape 1 */}
            <ScrollReveal variant="fade-up" delay={0} className="h-full">
              <div className="addme-card h-full flex flex-col justify-between group relative overflow-hidden">
                <div className="pointer-events-none absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#5B3DF5]/8 blur-2xl group-hover:bg-[#5B3DF5]/20 transition-all duration-500" />
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#EEEAFF] text-[#5B3DF5] group-hover:bg-[#5B3DF5] group-hover:text-white transition-all duration-300 flex items-center justify-center font-extrabold text-xl shadow-sm">
                      <Link2 className="h-7 w-7" />
                    </div>
                    <span className="px-3.5 py-1 rounded-full bg-[#12122A] text-white text-xs font-extrabold tracking-wide">
                      Étape 01
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-[#12122A] mb-2.5 group-hover:text-[#5B3DF5] transition-colors">
                    Ajoutez une publication
                  </h3>
                  <p className="text-[#5A5A70] text-sm leading-relaxed">
                    Collez le lien de votre vidéo TikTok, Reel Instagram ou Short
                    YouTube. Fixez vous-même les points offerts par interaction (1,
                    2, 3 pts...) et la durée de diffusion (0,5 pt/j).
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-[#E3E3EE] text-xs font-bold text-[#5B3DF5] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Paramètres 100% libres</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Étape 2 */}
            <ScrollReveal variant="fade-up" delay={140} className="h-full">
              <div className="addme-card h-full flex flex-col justify-between group relative overflow-hidden border-[#D9D2FF]">
                <div className="pointer-events-none absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#FFB84D]/15 blur-2xl group-hover:bg-[#FFB84D]/30 transition-all duration-500" />
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#EEEAFF] text-[#5B3DF5] group-hover:bg-[#5B3DF5] group-hover:text-white transition-all duration-300 flex items-center justify-center font-extrabold text-xl shadow-sm">
                      <Play className="h-7 w-7" />
                    </div>
                    <span className="px-3.5 py-1 rounded-full bg-[#5B3DF5] text-white text-xs font-extrabold tracking-wide shadow-sm">
                      Étape 02
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-[#12122A] mb-2.5 group-hover:text-[#5B3DF5] transition-colors">
                    Gagnez des points sans délai
                  </h3>
                  <p className="text-[#5A5A70] text-sm leading-relaxed">
                    Likez, commentez ou abonnez-vous depuis les publications des
                    autres. Après 10 secondes de visionnage effectif, vos points sont
                    crédités <strong className="text-[#12122A]">immédiatement</strong>{" "}
                    sur votre solde et la tâche disparaît.
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-[#E3E3EE] text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Zéro attente 24h · Crédit direct</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Étape 3 */}
            <ScrollReveal variant="fade-up" delay={280} className="h-full">
              <div className="addme-card h-full flex flex-col justify-between group relative overflow-hidden">
                <div className="pointer-events-none absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#5B3DF5]/8 blur-2xl group-hover:bg-[#5B3DF5]/20 transition-all duration-500" />
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#EEEAFF] text-[#5B3DF5] group-hover:bg-[#5B3DF5] group-hover:text-white transition-all duration-300 flex items-center justify-center font-extrabold text-xl shadow-sm">
                      <TrendingUp className="h-7 w-7" />
                    </div>
                    <span className="px-3.5 py-1 rounded-full bg-[#12122A] text-white text-xs font-extrabold tracking-wide">
                      Étape 03
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-[#12122A] mb-2.5 group-hover:text-[#5B3DF5] transition-colors">
                    Recevez un engagement unique
                  </h3>
                  <p className="text-[#5A5A70] text-sm leading-relaxed">
                    Chaque membre ne peut interagir avec votre publication qu’
                    <strong className="text-[#12122A]">une seule fois</strong>. Vos
                    interactions proviennent toutes d&apos;utilisateurs distincts pour
                    déclencher naturellement les algorithmes.
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-[#E3E3EE] text-xs font-bold text-[#5B3DF5] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Règle anti-spam 1x stricte</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ===================================================================
            SECTION 3 : SIMULATEUR INTERACTIF DE CAMPAGNE SUR-MESURE
           =================================================================== */}
        <section id="simulateur" className="max-w-[1140px] mx-auto px-6 pb-24 md:pb-28 relative z-10">
          <ScrollReveal variant="zoom-in">
            <div className="addme-card-static p-6 sm:p-10 bg-white/95 backdrop-blur-xl border-2 border-[#D9D2FF] shadow-[0_32px_70px_-24px_rgba(91,61,245,0.18)] relative overflow-hidden">
              {/* Reflet décoratif en coin */}
              <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-bl from-[#5B3DF5]/12 via-[#FFB84D]/10 to-transparent blur-3xl" />

              <div className="max-w-2xl mb-8 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFF] text-xs font-extrabold uppercase tracking-widest text-[#5B3DF5]">
                  <Flame className="h-3.5 w-3.5 text-[#FFB84D]" />
                  Transparence Totale
                </span>
                <h2 className="text-[28px] sm:text-[38px] font-extrabold text-[#12122A] mt-2">
                  Simulez votre prochaine campagne
                </h2>
                <p className="text-sm sm:text-base text-[#5A5A70] mt-1">
                  Sur AddMe.io, aucun tarif imposé : vous décidez combien de points
                  vous offrez par action et combien de jours dure votre diffusion.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                {/* Contrôles Gauche */}
                <ScrollReveal variant="fade-left" delay={100} className="lg:col-span-7 space-y-6">
                  {/* Choix du Réseau & Action */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A70] mb-2">
                        1. Réseau social
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: "TIKTOK", label: "TikTok" },
                          { id: "INSTAGRAM", label: "Instagram" },
                          { id: "YOUTUBE", label: "YouTube" },
                          { id: "FACEBOOK", label: "Facebook" },
                          { id: "SNAPCHAT", label: "Snapchat" },
                          { id: "LINKEDIN", label: "LinkedIn" },
                          { id: "X", label: "X" },
                          { id: "THREADS", label: "Threads" },
                        ].map((net) => (
                          <button
                            key={net.id}
                            type="button"
                            onClick={() =>
                              setSimPlatform(
                                net.id as
                                  | "TIKTOK"
                                  | "INSTAGRAM"
                                  | "YOUTUBE"
                                  | "FACEBOOK"
                                  | "SNAPCHAT"
                                  | "LINKEDIN"
                                  | "X"
                                  | "THREADS"
                              )
                            }
                            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border transition-all truncate text-center ${
                              simPlatform === net.id
                                ? "bg-[#12122A] text-white border-[#12122A] shadow-md scale-[1.03]"
                                : "bg-[#F7F7FB] text-[#5A5A70] border-[#E3E3EE] hover:border-[#5B3DF5]"
                            }`}
                          >
                            {net.label}
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
                                ? "bg-[#5B3DF5] text-white border-[#5B3DF5] shadow-md scale-[1.03]"
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
                        3. Points offerts à chaque personne qui fait l&apos;action
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
                              ? "bg-[#EEEAFF] border-[#5B3DF5] text-[#3A22C8] shadow-xs scale-[1.02]"
                              : "bg-[#F7F7FB] border-[#E3E3EE] text-[#5A5A70] hover:border-[#5B3DF5]/50"
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
                </ScrollReveal>

                {/* Résumé Droite */}
                <ScrollReveal variant="fade-right" delay={200} className="lg:col-span-5">
                  <div className="bg-[#0E0D14] text-white p-7 rounded-2xl border border-[#2E2C40] space-y-5 relative overflow-hidden shadow-2xl">
                    <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#5B3DF5]/25 blur-3xl" />

                    <div className="flex items-center justify-between border-b border-[#2E2C40] pb-4 relative z-10">
                      <div>
                        <div className="text-xs text-[#C9C6DB]">Budget total estimé</div>
                        <div className="text-4xl font-extrabold text-[#FFB84D] mt-0.5 tracking-tight">
                          {simTotalPoints} pts
                        </div>
                      </div>
                      <div className="px-3.5 py-1.5 rounded-xl bg-[#1B1A26] border border-[#3E3B5B] text-xs font-bold text-white">
                        {simPlatform} · {simAction}
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs text-[#C9C6DB] relative z-10">
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
                      className="addme-btn addme-btn-primary w-full text-sm py-3.5 relative z-10"
                    >
                      <span>
                        {isAuthenticated
                          ? "Lancer cette campagne maintenant"
                          : "Créer mon compte et lancer (+50 pts offerts)"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </div>

      {/* =====================================================================
          SECTION 4 : LE MANIFESTE SOMBRE (Contraste Bots vs Humain)
          Avec Nuances Aurora en mouvement & 3 Panels animés au défilement
         ===================================================================== */}
      <section className="bg-[#0E0D14] text-white py-24 md:py-32 relative overflow-hidden">
        {/* Nuances de couleurs animées en arrière-plan */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="aurora-orb-2 absolute -top-28 left-1/3 w-[580px] h-[420px] bg-gradient-to-r from-[#5B3DF5]/30 via-[#8B5CF6]/20 to-transparent blur-[130px] rounded-full" />
          <div className="aurora-orb-1 absolute -bottom-24 right-1/4 w-[500px] h-[380px] bg-gradient-to-tl from-[#FFB84D]/20 via-[#F59E0B]/12 to-transparent blur-[120px] rounded-full" />
          <div className="cyber-grid-dark absolute inset-0" />
        </div>

        <div className="max-w-[1140px] mx-auto px-6 relative z-10">
          <ScrollReveal variant="fade-up">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-[#FFB84D] uppercase tracking-widest">
                <Award className="h-3.5 w-3.5" />
                Philosophie Anti-Bot & Authenticité
              </div>
              <p className="text-lg sm:text-xl text-[#C9C6DB]">
                La plupart des services de boost se concentrent sur :{" "}
                <span className="line-through opacity-65 decoration-rose-500/80">
                  des fermes de faux robots qui pénalisent vos comptes sociaux.
                </span>
              </p>
              <h2 className="text-[32px] sm:text-[48px] font-extrabold leading-[1.1] tracking-tight">
                Nous nous concentrons sur :{" "}
                <span className="bg-gradient-to-r from-[#FFB84D] via-[#FFD285] to-[#FFB84D] bg-clip-text text-transparent font-serif-drama italic">
                  l’engagement humain mutuel, unique et vérifié.
                </span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mt-14">
            {/* Panel 1 : Zéro mot de passe requis */}
            <ScrollReveal variant="fade-up" delay={0} className="h-full">
              <div className="manifesto-card p-7 h-full flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-13 h-13 rounded-2xl bg-[#5B3DF5]/20 border border-[#5B3DF5]/40 flex items-center justify-center text-[#FFB84D] group-hover:scale-110 group-hover:bg-[#5B3DF5] group-hover:text-white transition-all duration-300">
                      <ShieldCheck className="h-7 w-7" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                      <Lock className="h-3 w-3" /> Sécurité 100%
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white group-hover:text-[#FFB84D] transition-colors">
                    Zéro mot de passe requis
                  </h3>
                  <p className="text-sm text-[#C9C6DB] mt-2 leading-relaxed">
                    Vos comptes sociaux restent strictement sous votre contrôle. La
                    vérification se fait uniquement via un code temporaire dans votre bio.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-xs font-semibold text-[#8E8CA0] group-hover:text-white transition-colors">
                  Protection intégrale de vos accès
                </div>
              </div>
            </ScrollReveal>

            {/* Panel 2 : 1 Membre = 1 Seule Action */}
            <ScrollReveal variant="fade-up" delay={150} className="h-full">
              <div className="manifesto-card p-7 h-full flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-13 h-13 rounded-2xl bg-[#FFB84D]/15 border border-[#FFB84D]/40 flex items-center justify-center text-[#FFB84D] group-hover:scale-110 group-hover:bg-[#FFB84D] group-hover:text-[#0E0D14] transition-all duration-300">
                      <Users className="h-7 w-7" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#5B3DF5]/25 text-indigo-200 border border-[#5B3DF5]/40 text-[11px] font-bold">
                      Anti-doublon
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white group-hover:text-[#FFB84D] transition-colors">
                    1 Membre = 1 Seule Action
                  </h3>
                  <p className="text-sm text-[#C9C6DB] mt-2 leading-relaxed">
                    Chaque publication ne peut être accomplie qu&apos;une seule fois par
                    utilisateur. Vous ne recevez jamais de spams répétitifs.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-xs font-semibold text-[#8E8CA0] group-hover:text-white transition-colors">
                  Croissance algorithmique naturelle
                </div>
              </div>
            </ScrollReveal>

            {/* Panel 3 : Points doublés & Mobile Money */}
            <ScrollReveal variant="fade-up" delay={300} className="h-full">
              <div className="manifesto-card p-7 h-full flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-13 h-13 rounded-2xl bg-[#5B3DF5]/20 border border-[#5B3DF5]/40 flex items-center justify-center text-[#FFB84D] group-hover:scale-110 group-hover:bg-[#5B3DF5] group-hover:text-white transition-all duration-300">
                      <Zap className="h-7 w-7" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                      FCFA & EUR
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white group-hover:text-[#FFB84D] transition-colors">
                    Points doublés & Mobile Money
                  </h3>
                  <p className="text-sm text-[#C9C6DB] mt-2 leading-relaxed">
                    Rechargez vos points en toute simplicité en FCFA via Mobile Money
                    (Orange, MTN, Wave, Moov) ou Carte Bancaire.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 text-xs font-semibold text-[#8E8CA0] group-hover:text-white transition-colors">
                  Activation instantanée du solde
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTIONS 5 & 6 : TARIFS + FAQ AVEC FOND NUANCÉ ANIMÉ
         ===================================================================== */}
      <div className="relative overflow-hidden">
        {/* Nuances de couleurs pastel en mouvement */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="aurora-orb-3 absolute top-20 right-10 w-[550px] h-[480px] bg-gradient-to-bl from-[#5B3DF5]/12 via-[#8B5CF6]/8 to-transparent blur-[120px] rounded-full" />
          <div className="aurora-orb-1 absolute bottom-20 left-10 w-[520px] h-[450px] bg-gradient-to-tr from-[#FFB84D]/16 via-[#F59E0B]/8 to-transparent blur-[115px] rounded-full" />
          <div className="cyber-grid-light absolute inset-0" />
        </div>

        {/* ===================================================================
            SECTION 5 : TARIFS & PACKS DE POINTS DOUBLÉS (Mobile Money en FCFA)
           =================================================================== */}
        <section id="prix" className="max-w-[1140px] mx-auto px-6 py-20 md:py-28 relative z-10">
          <ScrollReveal variant="fade-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFF] border border-[#D9D2FF] text-xs font-extrabold uppercase tracking-widest text-[#5B3DF5]">
                  Boutique de Points · Volume Doublé
                </span>
                <h2 className="text-[34px] sm:text-[44px] font-extrabold text-[#12122A] mt-2 mb-1">
                  Tarifs
                </h2>
                <p className="text-[#5A5A70] text-base">
                  Packs de points doublés (100, 300 et 1 500 pts), sans abonnement obligatoire. Paiement
                  Mobile Money (FCFA) & Carte Bancaire (EUR).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30 shadow-2xs">
                  <Smartphone className="h-3.5 w-3.5 text-amber-600" />
                  Mobile Money : Orange · MTN · Wave · Moov
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#E3E3EE] text-[#12122A] shadow-2xs">
                  <CreditCard className="h-3.5 w-3.5 text-[#5B3DF5]" />
                  Carte : Visa · Mastercard
                </span>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 items-stretch">
            {POINT_PACKS.map((pack, idx) => {
              const isPopular = Boolean(pack.popular);
              return (
                <ScrollReveal
                  key={pack.id}
                  variant="fade-up"
                  delay={idx * 140}
                  className="h-full"
                >
                  <div
                    className={`addme-card h-full flex flex-col justify-between relative overflow-hidden ${
                      isPopular
                        ? "!border-2 !border-[#5B3DF5] shadow-[0_28px_60px_-20px_rgba(91,61,245,0.28)]"
                        : ""
                    }`}
                  >
                    {isPopular && (
                      <div className="pointer-events-none absolute -top-20 -right-20 w-44 h-44 rounded-full bg-[#5B3DF5]/15 blur-2xl" />
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <b className="text-lg font-extrabold text-[#12122A]">
                          {pack.name} {isPopular ? "· Populaire" : ""}
                        </b>
                        {isPopular && (
                          <span className="px-3 py-1 rounded-full bg-[#5B3DF5] text-white text-xs font-extrabold shadow-xs">
                            Recommandé
                          </span>
                        )}
                      </div>

                      <div className="mt-5 mb-2 flex items-baseline gap-2">
                        <span className="text-[38px] font-extrabold text-[#12122A] tracking-tight">
                          {pack.priceFcfaFormatted}
                        </span>
                        <span className="text-sm font-bold text-[#5B3DF5]">
                          ({pack.priceFormatted})
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#EEEAFF] border border-[#D9D2FF] text-[#3A22C8] font-extrabold text-sm mb-4">
                        <Sparkles className="h-3.5 w-3.5 text-[#5B3DF5]" />
                        <span>+{pack.points} points crédités</span>
                      </div>

                      <p className="text-sm text-[#5A5A70] leading-relaxed mb-6">
                        {pack.description}
                      </p>

                      <ul className="space-y-2.5 text-xs text-[#3A3A52] mb-6 pt-4 border-t border-[#E3E3EE]">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#5B3DF5] shrink-0" />
                          <span>Jusqu&apos;à {pack.points} actions uniques</span>
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
                      <span>Choisir ce pack ({pack.points} pts)</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        {/* ===================================================================
            SECTION 6 : FAQ ANTI-OBJECTIONS (Apparition au scroll)
           =================================================================== */}
        <section id="faq" className="max-w-[900px] mx-auto px-6 pb-24 relative z-10">
          <ScrollReveal variant="fade-up">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFF] text-xs font-extrabold uppercase tracking-widest text-[#5B3DF5] mb-2">
                Réponses Claires
              </span>
              <h2 className="text-[32px] sm:text-[40px] font-extrabold text-[#12122A]">
                Questions fréquentes
              </h2>
              <p className="text-sm sm:text-base text-[#5A5A70] mt-1">
                Tout savoir sur le fonctionnement des campagnes, des points et de la
                sécurité.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-3.5">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <ScrollReveal
                  key={idx}
                  variant="fade-up"
                  delay={idx * 70}
                >
                  <div
                    className={`bg-white/95 backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300 ${
                      isOpen
                        ? "border-[#5B3DF5] shadow-[0_14px_34px_-15px_rgba(91,61,245,0.2)]"
                        : "border-[#E3E3EE] hover:border-[#5B3DF5]/50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#12122A] hover:bg-[#F7F7FB]/80 transition-colors"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-[#5B3DF5] shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 text-sm text-[#5A5A70] leading-relaxed border-t border-[#E3E3EE] pt-3.5">
                        {item.a}
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        {/* ===================================================================
            SECTION 7 : BANNIÈRE D'APPEL À L'ACTION FINALE
           =================================================================== */}
        <section className="max-w-[1140px] mx-auto px-6 pb-20 relative z-10">
          <ScrollReveal variant="zoom-in">
            <div className="rounded-3xl bg-[#0E0D14] text-white p-8 sm:p-14 border border-[#2E2C40] relative overflow-hidden shadow-2xl text-center">
              <div className="aurora-orb-1 pointer-events-none absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-[#5B3DF5]/35 blur-[100px]" />
              <div className="aurora-orb-2 pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-[#FFB84D]/20 blur-[100px]" />

              <div className="relative z-10 max-w-2xl mx-auto space-y-5">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-[#FFB84D]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Bonus de bienvenue immédiat : +50 points offerts</span>
                </div>
                <h2 className="text-[30px] sm:text-[44px] font-extrabold leading-tight tracking-tight">
                  Prêt à faire décoller vos publications avec de{" "}
                  <span className="text-[#FFB84D] font-serif-drama italic">
                    vrais créateurs ?
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-[#C9C6DB] leading-relaxed">
                  Rejoignez la communauté AddMe.io en 30 secondes. Aucun mot de passe
                  de réseau social demandé, aucun abonnement imposé.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href={isAuthenticated ? "/dashboard" : "/register"}
                    className="addme-btn addme-btn-primary text-base px-8 py-4 shadow-[0_12px_32px_-8px_rgba(91,61,245,0.7)]"
                  >
                    <span>
                      {isAuthenticated
                        ? "Ouvrir mon Tableau de bord"
                        : "Créer mon compte gratuitement"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </div>

      {/* =====================================================================
          PIED DE PAGE SOMBRE
         ===================================================================== */}
      <footer className="bg-[#0E0D14] text-white py-10 mt-auto border-t border-[#2E2C40]">
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
