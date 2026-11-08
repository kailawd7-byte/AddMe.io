"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Coins,
  ShieldCheck,
  Video,
  LayoutDashboard,
  ShoppingBag,
  Share2,
  LogOut,
  Menu,
  X,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  User,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import SupportWidget from "./SupportWidget";

interface UserData {
  id: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  balance: number;
  pendingPoints: number;
  reputationScore: number;
  socialAccounts: Array<{
    id: string;
    platform: string;
    identifier: string;
    status: string;
  }>;
}

const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/tasks",
  "/campaigns",
  "/shop",
  "/admin",
];

export default function Navbar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isLandingPage = pathname === "/";
  const isAppWorkspace = APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    setMobileMenuOpen(false);

    // Protection Thème : La Landing Page ("/") conserve strictement son design artistique fixe
    // et ne subit jamais l'inversion chromatique du mode sombre.
    if (pathname === "/") {
      document.documentElement.classList.remove("dark");
    } else {
      try {
        const saved = localStorage.getItem("addme-theme");
        const isDark =
          saved === "dark" ||
          ((!saved || saved === "system") &&
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch {}
    }
  }, [pathname]);

  useEffect(() => {
    const onBalanceUpdate = () => {
      fetchUser();
    };
    window.addEventListener("addme:balance-updated", onBalanceUpdate);
    return () => window.removeEventListener("addme:balance-updated", onBalanceUpdate);
  }, []);

  useEffect(() => {
    if (!isLandingPage) return;
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLandingPage]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      // Redirection automatique vers la landing page
      window.location.href = "/";
    }
  };

  // =========================================================================
  // 1. LANDING PAGE ("/") : Header public
  // =========================================================================
  if (isLandingPage) {
    const userDisplayName = user ? user.email.split("@")[0] : "";

    return (
      <div className="min-h-screen flex flex-col bg-[#F7F7FB] text-[#12122A]">
        <header
          className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 overflow-hidden ${
            scrolled
              ? "bg-[#0B0A14]/90 backdrop-blur-xl border-b border-white/15 py-3.5 shadow-[0_12px_40px_rgba(91,61,245,0.28)]"
              : "bg-transparent py-5"
          }`}
        >
          {/* Nuance liquide animée ("Lac de Couleurs") intégrée au Header */}
          <div
            className="pointer-events-none absolute inset-0 opacity-65 animate-lake-flow"
            style={{
              background:
                "linear-gradient(115deg, rgba(91,61,245,0.42) 0%, rgba(236,72,153,0.34) 28%, rgba(255,184,77,0.30) 56%, rgba(6,182,212,0.34) 82%, rgba(139,92,246,0.42) 100%)",
              backgroundSize: "300% 300%",
              filter: "blur(8px)",
            }}
          />
          <div className="max-w-[1140px] mx-auto px-4 md:px-6 flex items-center justify-between gap-3 md:gap-4 relative z-10">
            {/* Logo officiel AddMe.io */}
            <Link href="/" className="flex items-center gap-2 md:gap-2.5 shrink-0 group">
              <img
                src="/icon.svg"
                alt="Logo AddMe.io"
                className="h-6 w-6 md:h-8 md:w-8 rounded-lg md:rounded-xl shadow-md group-hover:scale-105 transition-transform"
              />
              <span className="text-lg md:text-2xl font-extrabold tracking-tight text-white whitespace-nowrap">
                AddMe<span className="text-[#FFB84D]">.io</span>
              </span>
            </Link>

            {/* Navigation publique (sans "Système P2P" retiré selon votre demande) */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#C9C6DB]">
              <a href="#how" className="hover:text-white transition-colors">
                Fonctionnement
              </a>
              <a href="#ecosystem" className="hover:text-white transition-colors">
                Réseaux compatibles
              </a>
              <a href="#simulateur" className="hover:text-white transition-colors">
                Simulateur
              </a>
              <a href="#prix" className="hover:text-white transition-colors">
                Tarifs
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                FAQ
              </a>
            </nav>

            {/* Action droite : Si connecté = profil + bouton Dashboard (AUCUN bouton connexion/commencer) */}
            <div className="flex items-center gap-2.5 md:gap-3 shrink-0 ml-2 md:ml-0">
              {loading ? (
                <div className="h-9 md:h-10 w-24 md:w-28 rounded-xl bg-white/10 animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-2 md:gap-2.5">
                  <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B1A26] border border-[#2E2C40] text-xs font-semibold text-white">
                    <User className="h-3.5 w-3.5 text-[#5B3DF5]" />
                    <span className="truncate max-w-[120px]">{userDisplayName}</span>
                    <span className="text-[#FFB84D] font-extrabold border-l border-[#2E2C40] pl-2">
                      {user.balance.toFixed(0)} pts
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    className="addme-btn addme-btn-primary !py-2 !px-3.5 !min-h-[36px] !text-xs md:!py-2 md:!px-5 md:!min-h-[44px] md:!text-sm whitespace-nowrap"
                  >
                    <span>Mon Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Link>
                </div>
              ) : (
                /* Non connecté */
                <div className="flex items-center gap-3 md:gap-4">
                  <Link
                    href="/login"
                    className="text-xs md:text-sm font-semibold text-white/90 hover:text-[#FFB84D] transition-colors px-1.5 py-1 md:p-0 whitespace-nowrap"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="addme-btn addme-btn-primary !py-2 !px-3.5 !min-h-[36px] !text-xs md:!py-2.5 md:!px-4 md:!min-h-[44px] md:!text-sm whitespace-nowrap"
                  >
                    Commencer
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col landing-page">{children}</main>
      </div>
    );
  }

  // =========================================================================
  // 2. ESPACE APPLICATIF SAAS (/dashboard, /tasks, /campaigns, /shop, /admin)
  // =========================================================================
  if (isAppWorkspace) {
    const sidebarLinks = [
      {
        href: "/dashboard",
        label: "Tableau de bord",
        icon: LayoutDashboard,
        active: pathname === "/dashboard",
      },
      {
        href: "/tasks",
        label: "Gagner des points",
        icon: Coins,
        active: pathname.startsWith("/tasks"),
      },
      {
        href: "/campaigns",
        label: "Mes campagnes",
        icon: Video,
        active: pathname === "/campaigns",
      },
      {
        href: "/campaigns/new",
        label: "Nouvelle campagne",
        icon: PlusCircle,
        active: pathname === "/campaigns/new",
      },
      {
        href: "/shop",
        label: "Boutique",
        icon: ShoppingBag,
        active: pathname.startsWith("/shop"),
      },
      {
        href: "/dashboard/social-accounts",
        label: "Comptes liés",
        icon: Share2,
        active: pathname.startsWith("/dashboard/social-accounts"),
      },
    ];

    if (user?.role === "ADMIN") {
      sidebarLinks.push({
        href: "/admin",
        label: "Administration",
        icon: ShieldCheck,
        active: pathname.startsWith("/admin"),
      });
    }

    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7F7FB] text-[#12122A] app-workspace">
        {/* Topbar Mobile : Redirection logo vers la Landing Page "/" */}
        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white dark:bg-[#111020] border-b border-[#E3E3EE] dark:border-[#26243A] transition-colors mobile-topbar">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.svg" alt="AddMe.io" className="h-7 w-7 rounded-lg" />
            <span className="text-xl font-extrabold tracking-tight text-[#12122A] dark:text-white">
              AddMe<span className="text-[#5B3DF5]">.io</span>
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            {user && (
              <Link
                href="/shop"
                className="px-3 py-1.5 rounded-xl bg-[#EEEAFF] dark:bg-[#5B3DF5]/20 text-[#5B3DF5] dark:text-[#A38EFF] font-extrabold text-xs transition-colors"
              >
                {user.balance.toFixed(1)} pts
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[#E3E3EE] dark:border-[#26243A] text-[#12122A] dark:text-white hover:bg-[#F7F7FB] dark:hover:bg-[#1C1B2E] transition-colors"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Drawer Mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#12122A]/70 backdrop-blur-sm flex">
            <div className="w-72 bg-white dark:bg-[#111020] h-full p-5 flex flex-col justify-between shadow-2xl border-r border-[#E3E3EE] dark:border-[#26243A] transition-colors mobile-drawer">
              <div>
                <div className="flex items-center justify-between px-2 mb-6 border-b border-[#E3E3EE] dark:border-[#26243A] pb-4">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <img src="/icon.svg" alt="AddMe.io" className="h-7 w-7 rounded-lg" />
                    <span className="text-2xl font-extrabold text-[#12122A] dark:text-white">
                      AddMe<span className="text-[#5B3DF5]">.io</span>
                    </span>
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-[#5A5A70] dark:text-[#A3A1BD] hover:bg-[#F7F7FB] dark:hover:bg-[#1C1B2E] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {sidebarLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-sm font-medium transition-all group ${
                          item.active
                            ? "bg-[#EEEAFF] text-[#3A22C8] dark:bg-[#5B3DF5]/30 dark:text-white dark:border dark:border-[#5B3DF5]/50 font-semibold shadow-xs"
                            : "text-[#3A3A52] hover:bg-[#5B3DF5]/10 hover:text-[#12122A] dark:text-[#C9C7E0] dark:hover:bg-[#25214C] dark:hover:text-white"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            item.active
                              ? "text-[#5B3DF5] dark:text-[#A38EFF]"
                              : "text-[#5A5A70] group-hover:text-[#5B3DF5] dark:text-[#A3A1BD] dark:group-hover:text-[#A38EFF]"
                          }`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {user && (
                <div className="pt-4 border-t border-[#E3E3EE] dark:border-[#26243A] space-y-3">
                  <ThemeToggle />
                  <div className="px-3 py-2.5 rounded-xl bg-[#F7F7FB] dark:bg-[#151426] border border-[#E3E3EE] dark:border-[#26243A] transition-colors">
                    <div className="text-xs font-semibold text-[#12122A] dark:text-white truncate">
                      {user.email}
                    </div>
                    <div className="text-[11px] text-[#5A5A70] dark:text-[#A3A1BD] mt-0.5 flex items-center justify-between">
                      <span>Réputation : {user.reputationScore.toFixed(0)}/100</span>
                      <span className="font-bold text-[#5B3DF5] dark:text-[#A38EFF]">{user.balance.toFixed(1)} pts</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Sidebar Desktop fixe : Redirection logo vers la Landing Page "/" */}
        <aside className="hidden lg:flex w-[244px] shrink-0 bg-white dark:bg-[#111020] border-r border-[#E3E3EE] dark:border-[#26243A] px-4 py-6 flex-col justify-between sticky top-0 h-screen transition-colors">
          <div>
            {/* Logo officiel menant vers "/" */}
            <Link
              href="/"
              title="Retour à l'accueil AddMe.io"
              className="flex items-center gap-2.5 px-3.5 mb-6 group"
            >
              <img
                src="/icon.svg"
                alt="Logo AddMe.io"
                className="h-8 w-8 rounded-xl shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="text-[22px] font-extrabold tracking-tight text-[#12122A] dark:text-white">
                AddMe<span className="text-[#5B3DF5]">.io</span>
              </span>
            </Link>

            {/* Mini carte Solde rapide */}
            {user && (
              <div className="mx-1 mb-5 p-3.5 rounded-2xl bg-[#5B3DF5] text-white shadow-md shadow-[#5B3DF5]/20">
                <div className="flex items-center justify-between text-[11px] font-medium opacity-85">
                  <span>Solde disponible</span>
                  <Coins className="h-3.5 w-3.5 text-[#FFB84D]" />
                </div>
                <div className="text-2xl font-extrabold tracking-tight mt-0.5">
                  {user.balance.toFixed(1)} pts
                </div>
                <Link
                  href="/shop"
                  className="mt-2.5 block text-center py-1.5 px-3 rounded-lg bg-white text-[#3A22C8] text-xs font-bold hover:bg-[#F7F7FB] transition-colors"
                >
                  + Acheter des points
                </Link>
              </div>
            )}

            {/* Liens de navigation */}
            <nav className="space-y-1">
              {sidebarLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-sm font-medium transition-all group ${
                      item.active
                        ? "bg-[#EEEAFF] text-[#3A22C8] dark:bg-[#5B3DF5]/30 dark:text-white dark:border dark:border-[#5B3DF5]/50 font-semibold shadow-xs"
                        : "text-[#3A3A52] hover:bg-[#5B3DF5]/10 hover:text-[#12122A] dark:text-[#C9C7E0] dark:hover:bg-[#25214C] dark:hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        item.active
                          ? "text-[#5B3DF5] dark:text-[#A38EFF]"
                          : "text-[#5A5A70] group-hover:text-[#5B3DF5] dark:text-[#A3A1BD] dark:group-hover:text-[#A38EFF]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Pied de Sidebar */}
          <div className="pt-4 border-t border-[#E3E3EE] dark:border-[#26243A] space-y-2.5">
            <ThemeToggle />
            {user ? (
              <>
                {!user.isEmailVerified && (
                  <Link
                    href="/verify-email"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Vérifier email</span>
                  </Link>
                )}
                <div className="px-3 py-2.5 rounded-xl bg-[#F7F7FB] dark:bg-[#151426] border border-[#E3E3EE] dark:border-[#26243A] transition-colors">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-xs font-bold text-[#12122A] dark:text-white truncate"
                      title={user.email}
                    >
                      {user.email.split("@")[0]}
                    </span>
                    {user.isEmailVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-[#5A5A70] dark:text-[#A3A1BD] truncate mt-0.5">
                    {user.email}
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#E3E3EE] dark:border-[#26243A] flex items-center justify-between text-[11px]">
                    <span className="text-[#5A5A70] dark:text-[#A3A1BD]">Réputation</span>
                    <span className="font-bold text-[#12122A] dark:text-white">
                      {user.reputationScore.toFixed(0)}/100
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-[10px] text-xs font-semibold text-[#5A5A70] dark:text-[#A3A1BD] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="addme-btn addme-btn-primary w-full text-xs"
                >
                  Se connecter
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Contenu Principal */}
        <main className="flex-1 min-w-0 flex flex-col">{children}</main>

        {/* Widget Support Client Flottant (Accessible exclusivement dans l'espace connecté Dashboard) */}
        <SupportWidget />
      </div>
    );
  }

  // =========================================================================
  // 3. PAGES AUTH & LEGALES (/login, /register, /verify-email...)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FB] dark:bg-[#0B0A14] text-[#12122A] dark:text-[#F4F3FA] app-workspace transition-colors">
      <header className="w-full bg-white dark:bg-[#111020] border-b border-[#E3E3EE] dark:border-[#26243A] transition-colors">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            title="Retour à l'accueil"
            className="flex items-center gap-2 shrink-0"
          >
            <img src="/icon.svg" alt="AddMe.io" className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg" />
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#12122A] dark:text-white">
              AddMe<span className="text-[#5B3DF5]">.io</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <Link href="/dashboard" className="addme-btn addme-btn-primary !py-2 !px-3 sm:!py-2.5 sm:!px-4 text-xs whitespace-nowrap">
                Mon Tableau de bord
              </Link>
            ) : pathname === "/register" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5A5A70] dark:text-[#A3A1BD] hidden sm:inline">
                  Déjà inscrit ?
                </span>
                <Link
                  href="/login"
                  className="addme-btn addme-btn-ghost !py-2 !px-3.5 text-xs whitespace-nowrap"
                >
                  Connexion
                </Link>
              </div>
            ) : pathname === "/login" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5A5A70] dark:text-[#A3A1BD] hidden sm:inline">
                  Nouveau membre ?
                </span>
                <Link
                  href="/register"
                  className="addme-btn addme-btn-primary !py-2 !px-3 sm:!py-2.5 sm:!px-4 text-xs whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Créer un compte (+50 pts)</span>
                  <span className="sm:hidden">S&apos;inscrire</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="addme-btn addme-btn-ghost !py-1.5 !px-2.5 text-xs whitespace-nowrap"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="addme-btn addme-btn-primary !py-1.5 !px-3 text-xs whitespace-nowrap"
                >
                  S&apos;inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="bg-[#0E0D14] text-white py-6 text-xs">
        <div className="max-w-[1100px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.svg" alt="AddMe.io" className="h-5 w-5 rounded-md" />
            <b>
              AddMe<span className="text-[#FFB84D]">.io</span>
            </b>
          </Link>
          <div className="flex items-center gap-4 text-[#C9C6DB]">
            <Link href="/legal/terms" className="hover:text-white">
              CGU
            </Link>
            <span>·</span>
            <Link href="/legal/privacy" className="hover:text-white">
              Confidentialité
            </Link>
            <span>·</span>
            <Link href="/legal/disclaimer" className="hover:text-white">
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
