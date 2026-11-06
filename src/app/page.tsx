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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Banner Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs sm:text-sm font-medium mb-8 backdrop-blur-sm animate-fade-in">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span>Plateforme P2P éthique — 100% d'interactions manuelles réelles</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Échangez votre engagement. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
            Propulsez vos vidéos TikTok & YouTube.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Gagnez des points en interagissant manuellement avec les publications de créateurs vérifiés, 
          puis réinvestissez vos points pour stimuler la visibilité de vos propres vidéos. Sans bot, sans automatisation, et{" "}
          <strong className="text-white font-semibold">sans jamais donner vos identifiants</strong>.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
          >
            Commencer maintenant (+10 pts offerts)
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all"
          >
            Se connecter
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            <span>0 mot de passe social requis</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>Preuve par code en bio</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>Séquestre 24h & Anti-fraude</span>
          </div>
        </div>
      </section>

      {/* Live Metrics Showcase */}
      <section className="py-12 border-y border-slate-800/60 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">100%</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Interactions manuelles</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">2 Réseaux</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">TikTok & YouTube</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800">
              <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400">10 s min.</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Visionnage par tâche</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">0 Bot</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">Sécurité de vos comptes</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Comment fonctionne l'échange d'engagement ?
          </h2>
          <p className="mt-4 text-slate-400">
            Un écosystème pair-à-pair transparent conçu pour faire décoller vos vidéos sans risquer vos comptes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Étape 1 */}
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 relative group hover:border-indigo-500/50 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Liez votre compte</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ajoutez votre pseudo TikTok ou votre chaîne YouTube. Un code unique (ex: <code className="text-indigo-300 font-mono">ADDME-9A82F</code>) vous est fourni à placer temporairement dans votre bio pour prouver que vous en êtes l'unique propriétaire.
            </p>
          </div>

          {/* Étape 2 */}
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 relative group hover:border-cyan-500/50 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Interagissez & Gagnez</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ouvrez les vidéos d'autres membres, regardez-les au moins 10 secondes, likez, commentez ou abonnez-vous manuellement. Validez votre tâche pour accumuler des points sur votre solde.
            </p>
          </div>

          {/* Étape 3 */}
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 relative group hover:border-emerald-500/50 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Lancez vos campagnes</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Dépensez vos points pour promouvoir les URLs de vos publications. La distribution est progressive avec un plafond quotidien pour maximiser la rétention et respecter les algorithmes.
            </p>
          </div>
        </div>
      </section>

      {/* Anti-Fraud & Ethics Manifesto */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950/40 border border-indigo-500/30 text-center sm:text-left flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-4 w-4" />
              Sécurité & Équité Maximale
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Une protection active contre la triche
            </h3>
            <p className="mt-3 text-slate-300 text-sm leading-relaxed">
              Grâce à la période de rétention de 24h, au système de signalement par le créateur et aux contrôles aléatoires avec capture d'écran, vos points sont garantis et protégés contre les désabonnements opportunistes.
            </p>
          </div>
          <Link
            href="/register"
            className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shrink-0 shadow-lg shadow-indigo-600/30"
          >
            Rejoindre la communauté
          </Link>
        </div>
      </section>
    </div>
  );
}

