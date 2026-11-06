import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Database } from "lucide-react";

export default function PrivacyPage() {
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Conformité RGPD & Vie Privée
            </span>
            <span className="text-xs text-slate-400">Dernière mise à jour : Février 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Chez AddMe.io, la protection de vos données personnelles et la minimisation de collecte sont érigées en
            principes fondamentaux. Cette politique détaille les données traitées et vos droits en vertu du RGPD.
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> 1. Données collectées et Finalités
            </h2>
            <p>Nous appliquons une stricte politique de minimisation des données :</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                <strong>Données de compte :</strong> Adresse email, mot de passe haché de manière irréversible via
                l&apos;algorithme cryptographique <code>scrypt</code> avec sel individuel.
              </li>
              <li>
                <strong>Identifiants publics sociaux :</strong> Pseudos publics TikTok ou chaînes YouTube déclarés par
                l&apos;utilisateur pour prouver la propriété de ses publications.
              </li>
              <li>
                <strong>Données de transaction :</strong> Historique des écritures dans le grand livre de points (Ledger),
                identifiants de sessions de paiement Stripe (sans aucun stockage de numéro de carte bancaire).
              </li>
              <li>
                <strong>Données techniques de sécurité :</strong> Empreinte d&apos;adresse IP et User-Agent pour la
                prévention des attaques par force brute et la limitation anti-fraude à un compte par appareil.
              </li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" /> 2. Zéro accès aux comptes de réseaux sociaux
            </h2>
            <p>
              Nous ne collectons, n&apos;avons accès et ne demandons <strong>aucun token OAuth sensible, aucun mot de passe
              de réseau social</strong> et aucune autorisation de publication automatique.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" /> 3. Vos Droits RGPD
            </h2>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Droit d&apos;accès à l&apos;ensemble de vos données personnelles.</li>
              <li>Droit de rectification de vos informations.</li>
              <li>Droit à l&apos;effacement (&quot;droit à l&apos;oubli&quot;) de votre compte et de vos données.</li>
              <li>Droit à la portabilité de vos données dans un format structuré standard.</li>
            </ul>
            <p className="pt-2 text-xs text-slate-400">
              Pour exercer ces droits, vous pouvez contacter notre délégué à la protection des données par email à :{" "}
              <a href="mailto:privacy@addme.io" className="text-indigo-400 hover:underline">
                privacy@addme.io
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

