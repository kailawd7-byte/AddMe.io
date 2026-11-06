"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Coins,
  Share2,
  Video,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  status: string;
  reputationScore: number;
  dailyTasksCompleted: number;
  balance: number;
  pendingPoints: number;
  socialAccounts: Array<{
    id: string;
    platform: string;
    identifier: string;
    verificationCode: string;
    status: string;
    verifiedAt: string | null;
  }>;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setProfile(data.user);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="h-10 w-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Session expirée</h2>
        <p className="text-sm text-slate-400 mb-4">Veuillez vous reconnecter pour accéder à votre espace.</p>
        <Link href="/login" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold">
          Connexion
        </Link>
      </div>
    );
  }

  const verifiedAccounts = profile.socialAccounts.filter((a) => a.status === "VERIFIED");
  const pendingAccounts = profile.socialAccounts.filter((a) => a.status === "PENDING_VERIFICATION");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Alert Banners */}
      {!profile.isEmailVerified && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div className="text-sm text-amber-200">
              <span className="font-semibold text-white">Email non vérifié : </span>
              Validez votre adresse pour débloquer immédiatement vos <strong>10 points de bienvenue</strong>.
            </div>
          </div>
          <Link
            href="/verify-email"
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
          >
            Débloquer mes 10 pts
          </Link>
        </div>
      )}

      {verifiedAccounts.length === 0 && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Share2 className="h-5 w-5 text-indigo-400 shrink-0" />
            <div className="text-sm text-slate-300">
              <span className="font-semibold text-white">Aucun compte social vérifié : </span>
              Pour pouvoir lancer des campagnes de vidéos, vous devez lier votre pseudo TikTok ou chaîne YouTube.
            </div>
          </div>
          <Link
            href="/dashboard/social-accounts"
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shrink-0 transition-colors"
          >
            Lier un compte
          </Link>
        </div>
      )}

      {/* Header Profile Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connecté en tant que <span className="text-slate-200 font-medium">{profile.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition"
            >
              <ShieldCheck className="h-4 w-4" /> Espace Administrateur
            </Link>
          )}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-400">Score de réputation :</span>
            <span className="font-bold text-emerald-400">{profile.reputationScore.toFixed(0)}/100</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Solde Disponible */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 relative group overflow-hidden hover:border-amber-500/40 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Solde Disponible</span>
              <Coins className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{profile.balance.toFixed(1)}</span>
              <span className="text-xs font-medium text-amber-300">points</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Dépensable immédiatement en campagnes.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> Recharger mon solde &rarr;
            </Link>
          </div>
        </div>

        {/* Points en Rétention */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 relative group overflow-hidden hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">En Rétention (24h)</span>
            <Clock className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-300">+{profile.pendingPoints.toFixed(1)}</span>
            <span className="text-xs font-medium text-indigo-400">points</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Libérés automatiquement après 24h sans litige.
          </p>
        </div>

        {/* Comptes Sociaux Liés */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 relative group overflow-hidden hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Comptes Vérifiés</span>
            <Share2 className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{verifiedAccounts.length}</span>
            <span className="text-xs font-medium text-slate-400">sur {profile.socialAccounts.length}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {pendingAccounts.length > 0 ? `${pendingAccounts.length} compte(s) en attente de code` : "Tous vos comptes sont vérifiés"}
          </p>
        </div>

        {/* Tâches Aujourd'hui */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 relative group overflow-hidden hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tâches Accomplies</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{profile.dailyTasksCompleted}</span>
            <span className="text-xs font-medium text-emerald-400">aujourd'hui</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Plafond quotidien progressif anti-spam.
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/dashboard/social-accounts"
          className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Share2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Gérer mes comptes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Liez vos comptes TikTok ou chaînes YouTube et validez leur preuve de propriété par code bio.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
            Voir mes comptes <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href="/tasks"
          className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Coins className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Gagner des points</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consultez les vidéos disponibles, regardez-les 10 secondes et interagissez pour accumuler des points.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
            Découvrir les tâches <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href="/campaigns"
          className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Mes campagnes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Indiquez l&apos;URL d&apos;une vidéo de votre compte vérifié et recevez des likes, commentaires ou abonnements.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
            Lancer une campagne <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href="/shop"
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-amber-500/30 hover:border-amber-400/60 transition-all group flex flex-col justify-between shadow-lg shadow-amber-500/5"
        >
          <div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Acheter des points</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              3 packs fixes sans abonnement (50, 150, 500 pts) pour propulser vos publications immédiatement.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:text-amber-300">
            Accéder à la boutique <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}

