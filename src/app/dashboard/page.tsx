"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Plus,
  CheckCircle2,
  Clock,
  Share2,
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

interface CampaignItem {
  id: string;
  platform: string;
  actionType: string;
  videoUrl: string;
  totalQuantity: number;
  completedQuantity: number;
  rewardPerUnit?: number;
  rewardPerTask?: number;
  status: string;
}

interface RecommendedTask {
  taskId: string;
  campaignId: string;
  platform: string;
  actionType: string;
  videoUrl: string;
  rewardPoints: number;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [recommendedTasks, setRecommendedTasks] = useState<RecommendedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [meRes, campRes, tasksRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/campaigns"),
          fetch("/api/tasks"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated) {
            setProfile(meData.user);
          }
        }

        if (campRes.ok) {
          const campData = await campRes.json();
          setCampaigns(campData.campaigns || []);
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setRecommendedTasks((tasksData.tasks || []).slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="h-10 w-10 border-3 border-[#5B3DF5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="addme-card max-w-md w-full space-y-4">
          <h2 className="text-2xl font-extrabold text-[#12122A]">Session expirée</h2>
          <p className="text-sm text-[#5A5A70]">
            Veuillez vous reconnecter pour accéder à votre tableau de bord.
          </p>
          <Link href="/login" className="addme-btn addme-btn-primary w-full">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.email.split("@")[0];
  const verifiedAccounts = profile.socialAccounts.filter((a) => a.status === "VERIFIED");
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const totalReceivedActions = campaigns.reduce(
    (acc, c) => acc + (c.completedQuantity || 0),
    0
  );

  const formatActionLabel = (action: string) => {
    if (action === "LIKE") return "Like";
    if (action === "COMMENT") return "Commentaire";
    if (action === "SUBSCRIBE") return "Abonnement";
    return action;
  };

  const formatPlatformLabel = (platform: string) => {
    if (platform === "TIKTOK") return "TikTok";
    if (platform === "INSTAGRAM") return "Instagram";
    if (platform === "YOUTUBE") return "YouTube";
    return platform;
  };

  return (
    <div className="flex-1 p-6 sm:p-8 max-w-[1160px] w-full mx-auto space-y-6">
      {/* Alertes prioritaires (Email non vérifié / Aucun compte lié) */}
      {!profile.isEmailVerified && (
        <div className="p-4 rounded-2xl bg-[#EEEAFF] border border-[#D9D2FF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[#5B3DF5] shrink-0" />
            <div className="text-sm text-[#12122A]">
              <strong className="font-bold">Email non vérifié :</strong> Validez
              votre compte avec votre code à 6 chiffres pour sécuriser
              votre profil et confirmer vos <strong>+50 points offerts</strong>.
            </div>
          </div>
          <Link
            href="/verify-email"
            className="addme-btn addme-btn-primary text-xs py-2.5 px-4 shrink-0"
          >
            Valider mon adresse email
          </Link>
        </div>
      )}

      {verifiedAccounts.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Share2 className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-sm text-amber-950">
              <strong className="font-bold">Aucun compte social vérifié :</strong>{" "}
              Liez votre compte TikTok, Instagram ou YouTube pour pouvoir lancer
              vos campagnes.
            </div>
          </div>
          <Link
            href="/dashboard/social-accounts"
            className="addme-btn bg-[#12122A] text-white hover:bg-[#2A2A45] text-xs py-2.5 px-4 shrink-0"
          >
            Lier un compte social
          </Link>
        </div>
      )}

      {/* En-tête du Tableau de bord (Style exact Dashboard.dc.html) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-[#12122A] m-0 tracking-tight">
            Bonjour, {displayName}
          </h1>
          <p className="text-sm text-[#5A5A70] mt-0.5">
            Pilotez vos points, vos campagnes et vos interactions en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {profile.role === "ADMIN" && (
            <Link
              href="/admin"
              className="addme-btn addme-btn-ghost text-xs py-2.5 px-4"
            >
              <ShieldCheck className="h-4 w-4 text-[#5B3DF5]" />
              Panel Admin
            </Link>
          )}
          <Link href="/campaigns/new" className="addme-btn addme-btn-primary">
            <Plus className="h-4 w-4" />
            <span>Nouvelle campagne</span>
          </Link>
        </div>
      </div>

      {/* 4 Cartes de Statistiques (Style exact Dashboard.dc.html) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        {/* Carte 1 : Solde (#5B3DF5 - Reste TOUJOURS Violet en clair comme en sombre) */}
        <div
          className="addme-card addme-card-solde animate-up flex flex-col justify-between"
          style={{ background: "#5B3DF5", borderColor: "#5B3DF5", color: "#FFFFFF" }}
        >
          <div>
            <div className="text-sm font-medium opacity-90 text-white">Solde disponible</div>
            <div className="text-[42px] font-extrabold leading-tight my-1.5 text-white">
              {profile.balance.toFixed(1)} pts
            </div>
          </div>
          <Link
            href="/shop"
            className="btn-solde-shop addme-btn bg-white text-[#3A22C8] hover:bg-[#F7F7FB] text-xs py-2.5 px-4 w-fit mt-2 font-bold shadow-xs"
          >
            Acheter des points
          </Link>
        </div>

        {/* Carte 2 : Tâches effectuées / Points gagnés */}
        <div className="addme-card animate-up-1 flex flex-col justify-between">
          <div>
            <div className="text-sm text-[#5A5A70] font-medium">
              Tâches (Aujourd’hui)
            </div>
            <div className="text-[34px] font-extrabold text-[#12122A] mt-2">
              +{profile.dailyTasksCompleted}
            </div>
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-3 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Crédit direct sans attente 24h</span>
          </div>
        </div>

        {/* Carte 3 : Interactions reçues / Campagnes */}
        <div className="addme-card animate-up-2 flex flex-col justify-between">
          <div>
            <div className="text-sm text-[#5A5A70] font-medium">
              Actions reçues ({activeCampaigns.length} actives)
            </div>
            <div className="text-[34px] font-extrabold text-[#12122A] mt-2">
              {totalReceivedActions}
            </div>
          </div>
          <Link
            href="/campaigns"
            className="text-xs font-bold text-[#5B3DF5] hover:underline mt-3 inline-flex items-center gap-1"
          >
            <span>Gérer mes campagnes</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Carte 4 : Réputation */}
        <div className="addme-card animate-up-3 flex flex-col justify-between">
          <div>
            <div className="text-sm text-[#5A5A70] font-medium">Réputation</div>
            <div className="text-[34px] font-extrabold text-[#12122A] mt-2">
              {profile.reputationScore.toFixed(0)}/100
            </div>
          </div>
          <div className="text-xs text-[#5A5A70] mt-3">
            Indice de fiabilité communautaire
          </div>
        </div>
      </div>

      {/* Grille Principale 2 Colonnes : Mes campagnes actives + Tâches recommandées (Style Dashboard.dc.html) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Colonne Gauche : Mes campagnes actives */}
        <div className="lg:col-span-7 addme-card animate-up">
          <div className="flex items-center justify-between mb-3">
            <b className="text-lg font-extrabold text-[#12122A]">
              Mes campagnes actives
            </b>
            <Link
              href="/campaigns"
              className="text-xs font-bold text-[#5B3DF5] hover:underline"
            >
              Tout voir ({campaigns.length})
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="py-10 text-center space-y-3 border-t border-[#E3E3EE] mt-2">
              <p className="text-sm text-[#5A5A70]">
                Vous n’avez pas encore lancé de campagne de visibilité.
              </p>
              <Link
                href="/campaigns/new"
                className="addme-btn addme-btn-primary text-xs"
              >
                Créer ma première campagne
              </Link>
            </div>
          ) : (
            <div>
              {campaigns.slice(0, 4).map((camp, idx) => {
                const pct = Math.min(
                  100,
                  Math.round(
                    ((camp.completedQuantity || 0) /
                      Math.max(1, camp.totalQuantity)) *
                      100
                  )
                );
                const isShort = camp.platform === "TIKTOK" ? "TT" : camp.platform === "INSTAGRAM" ? "IG" : "YT";

                return (
                  <div key={camp.id} className="addme-row">
                    <div className="addme-thumb">{isShort}</div>
                    <div className="flex-1 min-w-0">
                      <b className="block text-sm font-bold text-[#12122A] truncate">
                        Publication #{idx + 1} · {formatPlatformLabel(camp.platform)}
                      </b>
                      <div className="text-xs text-[#5A5A70] mt-0.5 flex items-center gap-2">
                        <span>
                          {formatPlatformLabel(camp.platform)} ·{" "}
                          {formatActionLabel(camp.actionType)}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-[#5B3DF5]">
                          {camp.rewardPerUnit ?? camp.rewardPerTask ?? 1} pt/pers.
                        </span>
                      </div>
                    </div>

                    {camp.status === "ACTIVE" ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-extrabold text-[#12122A]">
                            {camp.completedQuantity}/{camp.totalQuantity}
                          </div>
                          <div className="text-[11px] text-[#5A5A70]">{pct}%</div>
                        </div>
                        <i className="block w-[110px] h-2 rounded-full bg-[#E3E3EE] overflow-hidden">
                          <b
                            className="block h-full bg-[#5B3DF5] rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </i>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-[#F7F7FB] border border-[#E3E3EE] text-xs font-semibold text-[#5A5A70]">
                        {camp.status === "COMPLETED" ? "Terminée" : "Annulée"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne Droite : Tâches recommandées (Style Dashboard.dc.html) */}
        <div className="lg:col-span-5 addme-card animate-up-1">
          <div className="flex items-center justify-between mb-3">
            <b className="text-lg font-extrabold text-[#12122A]">
              Tâches recommandées
            </b>
            <span className="text-xs font-bold text-[#5B3DF5]">
              Crédit immédiat
            </span>
          </div>

          {recommendedTasks.length === 0 ? (
            <div className="py-8 text-center space-y-2 border-t border-[#E3E3EE] mt-2">
              <p className="text-sm text-[#5A5A70]">
                Aucune tâche en attente dans votre flux pour l’instant.
              </p>
              <p className="text-xs text-[#5A5A70]">
                Revenez dès qu'un créateur publie une nouvelle mission !
              </p>
            </div>
          ) : (
            <div>
              {recommendedTasks.map((task) => (
                <div key={task.taskId} className="addme-row">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#12122A]">
                      {formatPlatformLabel(task.platform)} ·{" "}
                      {formatActionLabel(task.actionType)}
                    </div>
                    <div className="text-xs text-[#5A5A70] truncate">
                      {task.videoUrl}
                    </div>
                  </div>
                  <span className="text-[#5B3DF5] font-extrabold text-base">
                    +{task.rewardPoints} pt{task.rewardPoints > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/tasks"
            className="addme-btn addme-btn-primary w-full mt-5"
          >
            <span>Voir toutes les tâches</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Section Comptes Sociaux Liés */}
      <div className="addme-card animate-up-2">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <b className="text-lg font-extrabold text-[#12122A]">
              Mes comptes sociaux liés
            </b>
            <p className="text-xs text-[#5A5A70] mt-0.5">
              TikTok, Instagram et YouTube vérifiés par code biographie (sans mot de passe).
            </p>
          </div>
          <Link
            href="/dashboard/social-accounts"
            className="addme-btn addme-btn-ghost text-xs py-2.5 px-4"
          >
            Gérer mes comptes ({profile.socialAccounts.length})
          </Link>
        </div>

        {profile.socialAccounts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#F7F7FB] border border-dashed border-[#CFCFE0] text-center space-y-2">
            <p className="text-sm font-semibold text-[#12122A]">
              Aucun profil social associé
            </p>
            <p className="text-xs text-[#5A5A70]">
              Ajoutez votre pseudo TikTok, Instagram ou YouTube pour lancer vos
              premières campagnes.
            </p>
            <Link
              href="/dashboard/social-accounts"
              className="addme-btn addme-btn-primary text-xs mt-2"
            >
              Lier mon premier compte
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.socialAccounts.map((acc) => {
              const isVerified = acc.status === "VERIFIED";
              const shortCode =
                acc.platform === "TIKTOK"
                  ? "TT"
                  : acc.platform === "INSTAGRAM"
                  ? "IG"
                  : "YT";

              return (
                <div
                  key={acc.id}
                  className="p-4 rounded-2xl bg-[#F7F7FB] border border-[#E3E3EE] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="addme-thumb w-11 h-11 text-xs">{shortCode}</div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#12122A] truncate">
                        @{acc.identifier}
                      </div>
                      <div className="text-[11px] text-[#5A5A70]">
                        {formatPlatformLabel(acc.platform)}
                      </div>
                    </div>
                  </div>

                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Vérifié
                    </span>
                  ) : (
                    <Link
                      href="/dashboard/social-accounts"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold shrink-0 hover:bg-amber-100"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Vérifier
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
