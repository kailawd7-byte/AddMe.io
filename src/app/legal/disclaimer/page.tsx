import Link from "next/link";
import { ArrowLeft, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Avertissement Officiel Obligatoire
            </span>
            <span className="text-xs text-slate-400">Important • À lire attentivement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
            Avertissement & Déni de Responsabilité
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Mise en garde essentielle relative à l&apos;utilisation d&apos;outils d&apos;échange d&apos;engagement et
            aux conditions d&apos;utilisation des plateformes tierces TikTok et YouTube.
          </p>
        </div>

        {/* Encadré d'Avertissement Majeur */}
        <div className="p-6 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0" />
            <h2 className="text-lg font-bold text-white">
              Avertissement Relatif aux Règles des Réseaux Sociaux
            </h2>
          </div>
          <p className="text-sm text-rose-200 leading-relaxed font-medium">
            L&apos;échange d&apos;engagement mutuel, de mentions j&apos;aime, de commentaires ou d&apos;abonnements peut
            être considéré par certaines plateformes tierces (notamment TikTok, ByteDance Ltd, YouTube ou Google LLC)
            comme une pratique contraire à leurs conditions d&apos;utilisation ou à leurs politiques de lutte contre
            l&apos;engagement artificiel (&quot;Spam and deceptive practices&quot;).
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white">1. Responsabilité Exclusive de l&apos;Utilisateur</h3>
            <p>
              L&apos;utilisateur reconnaît et accepte expressément qu&apos;il recourt aux services d&apos;échange
              d&apos;engagement d&apos;AddMe.io sous sa seule, entière et exclusive responsabilité.
            </p>
            <p>
              AddMe.io ne saurait en aucun cas être tenu responsable de sanctions, restrictions de visibilité
              (&quot;shadowban&quot;), suspensions temporaires ou fermetures définitives de comptes décidées par TikTok,
              YouTube ou toute autre plateforme tierce.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white">2. Absence de Garantie de Résultat ou de Croissance</h3>
            <p>
              AddMe.io agit exclusivement comme intermédiaire technique garantissant que des utilisateurs réels
              accomplissent manuellement les interactions convenues.
            </p>
            <p>
              <strong>Aucun résultat algorithmique n&apos;est garanti :</strong> AddMe.io ne garantit aucun positionnement
              dans les pages &quot;Pour Toi&quot; (FYP) de TikTok, aucune mise en avant sur YouTube, aucun chiffre de vues,
              ni aucun succès commercial ou viral. Les algorithmes des plateformes sociales demeurent souverains et
              imprévisibles.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white">3. Indépendance Vis-à-Vis de TikTok et YouTube</h3>
            <p>
              AddMe.io est un projet indépendant et n&apos;est en aucun cas affilié, sponsorisé, associé, validé ou
              soutenu par TikTok, ByteDance Ltd, YouTube, Alphabet Inc ou Google LLC. Les marques et logos mentionnés
              demeurent la propriété exclusive de leurs détenteurs légaux respectifs.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

