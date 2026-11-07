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
  }, [pathname]);

  useEffect(() => {
    if (!isLandingPage) return;
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLandingPage]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  // =========================================================================
  // 1. LANDING PAGE ("/") : Header public
  // =========================================================================
  if (isLandingPage) {
    const userDisplayName = user ? user.email.split("@")[0] : "";

    return (
      <div className="min-h-screen flex flex-col bg-[#F7F7FB] text-[#12122A]">
        <header
          className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
            scrolled
              ? "bg-[#0E0D14]/95 backdrop-blur-xl border-b border-[#2E2C40] py-3.5 shadow-2xl"
              : "bg-transparent py-5"
          }`}
        >
          <div className="max-w-[1140px] mx-auto px-6 flex items-center justify-between gap-4">
            {/* Logo officiel AddMe.io */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/icon.svg"
                alt="Logo AddMe.io"
                className="h-8 w-8 rounded-xl shadow-md group-hover:scale-105 transition-transform"
              />
              <span className="text-2xl font-extrabold tracking-tight text-white">
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
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="h-10 w-28 rounded-xl bg-white/10 animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-2.5">
                  <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B1A26] border border-[#2E2C40] text-xs font-semibold text-white">
                    <User className="h-3.5 w-3.5 text-[#5B3DF5]" />
                    <span className="truncate max-w-[120px]">{userDisplayName}</span>
                    <span className="text-[#FFB84D] font-extrabold border-l border-[#2E2C40] pl-2">
                      {user.balance.toFixed(0)} pts
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    className="addme-btn addme-btn-primary text-xs sm:text-sm py-2 px-4 sm:px-5"
                  >
                    <span>Mon Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                /* Non connecté */
                <div className="flex items-center gap-4">
                  <Link
                    href="/login"
                    className="text-sm font-semibold text-white/90 hover:text-[#FFB84D] transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="addme-btn addme-btn-primary text-sm py-2.5 px-4"
                  >
                    Commencer
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
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
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7F7FB] text-[#12122A]">
        {/* Topbar Mobile : Redirection logo vers la Landing Page "/" */}
        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3.5 bg-white border-b border-[#E3E3EE]">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.svg" alt="AddMe.io" className="h-7 w-7 rounded-lg" />
            <span className="text-xl font-extrabold tracking-tight text-[#12122A]">
              AddMe<span className="text-[#5B3DF5]">.io</span>
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            {user && (
              <Link
                href="/shop"
                className="px-3 py-1.5 rounded-xl bg-[#EEEAFF] text-[#5B3DF5] font-extrabold text-xs"
              >
                {user.balance.toFixed(1)} pts
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[#E3E3EE] text-[#12122A] hover:bg-[#F7F7FB]"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Drawer Mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#12122A]/50 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full p-5 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center justify-between px-2 mb-6">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <img src="/icon.svg" alt="AddMe.io" className="h-7 w-7 rounded-lg" />
                    <span className="text-2xl font-extrabold text-[#12122A]">
                      AddMe<span className="text-[#5B3DF5]">.io</span>
                    </span>
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-[#5A5A70] hover:bg-[#F7F7FB]"
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
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-sm transition-colors ${
                          item.active
                            ? "bg-[#EEEAFF] text-[#3A22C8] font-semibold"
                            : "text-[#3A3A52] hover:bg-[#F7F7FB] font-medium"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {user && (
                <div className="pt-4 border-t border-[#E3E3EE] space-y-3">
                  <div className="px-3 py-2.5 rounded-xl bg-[#F7F7FB] border border-[#E3E3EE]">
                    <div className="text-xs font-semibold text-[#12122A] truncate">
                      {user.email}
                    </div>
                    <div className="text-[11px] text-[#5A5A70] mt-0.5 flex items-center justify-between">
                      <span>Réputation : {user.reputationScore.toFixed(0)}/100</span>
                      <span className="font-bold text-[#5B3DF5]">{user.balance.toFixed(1)} pts</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Sidebar Desktop fixe : Redirection logo vers la Landing Page "/" */}
        <aside className="hidden lg:flex w-[244px] shrink-0 bg-white border-r border-[#E3E3EE] px-4 py-6 flex-col justify-between sticky top-0 h-screen">
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
              <span className="text-[22px] font-extrabold tracking-tight text-[#12122A]">
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
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-sm transition-all ${
                      item.active
                        ? "bg-[#EEEAFF] text-[#3A22C8] font-semibold"
                        : "text-[#3A3A52] hover:bg-[#F7F7FB] hover:text-[#12122A] font-medium"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        item.active ? "text-[#5B3DF5]" : "text-[#5A5A70]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Pied de Sidebar */}
          <div className="pt-4 border-t border-[#E3E3EE] space-y-2.5">
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
                <div className="px-3 py-2.5 rounded-xl bg-[#F7F7FB] border border-[#E3E3EE]">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-xs font-bold text-[#12122A] truncate"
                      title={user.email}
                    >
                      {user.email.split("@")[0]}
                    </span>
                    {user.isEmailVerified && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-[#5A5A70] truncate mt-0.5">
                    {user.email}
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#E3E3EE] flex items-center justify-between text-[11px]">
                    <span className="text-[#5A5A70]">Réputation</span>
                    <span className="font-bold text-[#12122A]">
                      {user.reputationScore.toFixed(0)}/100
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-[10px] text-xs font-semibold text-[#5A5A70] hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
      </div>
    );
  }

  // =========================================================================
  // 3. PAGES AUTH & LEGALES (/login, /register, /verify-email...)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FB] text-[#12122A]">
      <header className="w-full bg-white border-b border-[#E3E3EE]">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            title="Retour à l'accueil"
            className="flex items-center gap-2.5"
          >
            <img src="/icon.svg" alt="AddMe.io" className="h-7 w-7 rounded-lg" />
            <span className="text-2xl font-extrabold tracking-tight text-[#12122A]">
              AddMe<span className="text-[#5B3DF5]">.io</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="addme-btn addme-btn-primary text-xs">
                Mon Tableau de bord
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[#5A5A70] hover:text-[#12122A] px-3 py-2"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="addme-btn addme-btn-primary text-xs py-2.5 px-4"
                >
                  Créer un compte (+50 pts)
                </Link>
              </>
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
