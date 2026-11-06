"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Coins,
  ShieldCheck,
  Video,
  Layers,
  ShoppingBag,
  Share2,
  LogOut,
  Menu,
  X,
  User,
  Clock,
  Sparkles,
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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
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
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    { href: "/dashboard", label: "Aperçu", icon: Layers },
    { href: "/tasks", label: "Gagner des points", icon: Coins },
    { href: "/campaigns", label: "Mes campagnes", icon: Video },
    { href: "/dashboard/social-accounts", label: "Comptes sociaux", icon: Share2 },
    { href: "/shop", label: "Boutique", icon: ShoppingBag },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border/50 bg-[#090d16]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 font-black text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                AddMe<span className="text-cyan-400">.io</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">
                Échange d'engagement éthique
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}

              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    pathname.startsWith("/admin")
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "text-rose-400 hover:bg-rose-500/10"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Right Section: User Points & Auth */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 bg-slate-800/50 rounded-lg animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* Solde & Points en rétention */}
              <div className="flex items-center gap-2">
                <Link
                  href="/shop"
                  title="Solde de points disponible"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 border border-amber-500/30 text-amber-300 hover:border-amber-400 transition-colors shadow-sm"
                >
                  <Coins className="h-4 w-4 text-amber-400 animate-spin-slow" />
                  <span className="font-bold text-sm tracking-tight">
                    {user.balance.toFixed(1)} <span className="text-xs font-normal text-amber-200/80">pts</span>
                  </span>
                </Link>

                {user.pendingPoints > 0 && (
                  <div
                    title="Points en période de rétention de 24h"
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs"
                  >
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>+{user.pendingPoints.toFixed(1)} en attente</span>
                  </div>
                )}
              </div>

              {/* User badge & Déconnexion */}
              <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800">
                <span className="text-xs text-slate-400 font-medium truncate max-w-[140px]" title={user.email}>
                  {user.email.split("@")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  title="Se déconnecter"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                Commencer (+10 pts)
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-b border-surface-border bg-[#090d16] px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}

          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20"
            >
              <ShieldCheck className="h-5 w-5" />
              Panneau d'administration
            </Link>
          )}

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center px-1">
            <span className="text-xs text-slate-400 truncate">{user.email}</span>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-1.5 text-xs text-rose-400 font-medium px-2 py-1 rounded hover:bg-rose-500/10"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

