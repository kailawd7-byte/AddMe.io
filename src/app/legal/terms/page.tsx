import Link from "next/link";
import { ArrowLeft, Shield, FileText, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Documentation Juridique
            </span>
            <span className="text-xs text-slate-400">Dernière mise à jour : Février 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
            Conditions Générales d&apos;Utilisation (CGU)
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Les présentes conditions régissent l&apos;accès et l&apos;utilisation de la plateforme AddMe.io, service
            d&apos;échange d&apos;engagement pair-à-pair entre créateurs de contenu.
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              1. Objet du Service et Nature P2P
            </h2>
            <p>
              AddMe.io est une plateforme technique facilitant la mise en relation entre créateurs indépendants souhaitant
              découvrir et interagir avec les publications vidéo publiques d&apos;autres utilisateurs sur TikTok et YouTube.
            </p>
            <p>
              <strong>Engagement 100% Manuel :</strong> Aucun robot, script ou mécanisme d&apos;automatisation n&apos;est
              fourni ni toléré. Toutes les interactions (mentions j&apos;aime, commentaires, abonnements) sont accomplies
              manuellement par des utilisateurs réels sur les applications officielles respectives.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              2. Sécurité des Comptes et Confidentialité Absolue
            </h2>
            <p>
              La plateforme AddMe.io <strong>ne demande, n&apos;enregistre et ne stocke JAMAIS</strong> les mots de passe,
              identifiants d&apos;accès ou clés privées de vos comptes de réseaux sociaux.
            </p>
            <p>
              La propriété d&apos;un compte social est vérifiée de manière passive par la présence temporaire d&apos;un code
              alphanumérique unique généré par la plateforme (format <code className="text-amber-400">ADDME-XXXXX</code>)
              placé volontairement par le créateur dans sa bio ou description publique.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              3. Système de Points (Ledger) et Règles Financières
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>
                Les points constituent une unité de mesure interne à la plateforme permettant d&apos;équilibrer les
                échanges d&apos;engagement.
              </li>
              <li>
                Les points peuvent être acquis soit en interagissant manuellement avec les publications d&apos;autres membres,
                soit par l&apos;achat de packs de points à prix fixe.
              </li>
              <li>
                Les points n&apos;ont aucune valeur monétaire légale, ne constituent pas un instrument financier et ne peuvent
                faire l&apos;objet d&apos;aucun rachat, remboursement monétaire ou retrait en espèces.
              </li>
              <li>
                En cas d&apos;annulation d&apos;une campagne par son créateur, les points correspondant aux tâches non consommées
                sont immédiatement recrédités à son solde.
              </li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              4. Période de Rétention, Lutte Anti-Fraude et Sanctions
            </h2>
            <p>
              Afin d&apos;éviter les désengagements frauduleux immédiats (ex: retrait d&apos;un like ou désabonnement sitôt
              la tâche validée), les points attribués à un travailleur font l&apos;objet d&apos;une période de séquestre
              conservatoire de 24 heures.
            </p>
            <p>
              Tout désabonnement ultérieur, suppression de commentaire ou comportement déloyal avéré entraîne une pénalité
              immédiate sur le score de réputation, la révocation des points associés et la suspension ou le bannissement
              définitif du compte.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              5. Achat de Packs de Points et Droit de Rétractation
            </h2>
            <p>
              Les achats de packs de points s&apos;effectuent en paiement unique par carte bancaire sécurisée via notre
              prestataire Stripe. Conformément à l&apos;article L221-28 du Code de la consommation, les points constituant
              un contenu numérique fourni immédiatement après confirmation, l&apos;utilisateur renonce expressément à son
              droit de rétractation dès la mise à disposition des points sur son compte.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

