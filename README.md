# AddMe.io — Plateforme P2P d'Échange d'Engagement Réel

> **AddMe.io** est un SaaS d'échange d'engagement éthique entre créateurs de contenu sur **TikTok** et **YouTube**.  
> Les utilisateurs gagnent des points en interagissant manuellement avec des publications, puis dépensent ces points pour propulser leurs propres vidéos.

---

## ⚡ Principes Fondamentaux & Règles d'Or

- **100% Humain & Zéro Bot** : Aucune automatisation, aucune API privée non autorisée, aucun mot de passe de réseau social demandé.
- **Engagement par Publication Uniquement** : L'engagement s'effectue exclusivement sur des **URLs de publications réelles** (vidéos TikTok, vidéos YouTube / Shorts), jamais sur de simples liens de profil.
- **Preuve de Propriété de Compte** : Liaison via un code unique généré par la plateforme (`ADDME-XXXXX`) à placer temporairement dans la bio/description du compte.
- **Règle d'Unicité** : Un compte social vérifié = un seul utilisateur propriétaire.
- **Système de Points Append-Only (Ledger)** : Grand livre comptable immuable garantissant l'atomicité, l'idempotence et l'impossibilité absolue d'un solde négatif.
- **Économie Soutenable** : La récompense travailleur est toujours inférieure au coût prélevé au créateur (ex: Like à 1.0 pt gagné vs 1.3 pts coûté).

---

## 🚀 Périmètre Fonctionnel (MVP)

### 1. Authentification & Sécurité
- Inscription, connexion, sessions JWT sécurisées (HTTP-only cookies).
- Vérification d'email avec bonus de bienvenue automatique (+10 points).
- Réinitialisation de mot de passe sécurisée.
- Rate limiting anti-bruteforce (5 essais / 15 minutes).

### 2. Liaison de Comptes Sociaux
- Support de **TikTok** et **YouTube**.
- Génération d'un code de vérification unique formaté `ADDME-XXXXX`.
- Validation manuelle par l'administrateur ou par vérification.
- Seul le propriétaire vérifié peut créer des campagnes pour son compte.

### 3. Cycle de Vie des Campagnes
- Création avec URL de vidéo validée, choix du réseau et de l'action (**Like**, **Commentaire**, **Abonnement**).
- Débit atomique immédiat du coût total.
- Distribution progressive dans le temps avec plafond journalier (`dailyCap`).
- Mise en pause / Réactivation en un clic.
- Annulation avec remboursement intégral et atomique des points non consommés (`CAMPAIGN_REFUND`).

### 4. Réalisation de Tâches & Anti-Fraude
- Découverte des tâches disponibles avec filtres par réseau et type d'action.
- Anti self-tasking (impossible de voir ou réaliser ses propres tâches).
- Anti double-interaction (impossible de répéter la même action sur la même publication).
- **Chronomètre serveur obligatoire de 10 secondes** lors du visionnage.
- Contrôle aléatoire avec demande de capture d'écran de preuve (échantillonnage 10%).
- **Séquestre de 24 heures** avant déblocage définitif des points au travailleur.
- Droit de signalement pour le propriétaire de la campagne en cas de non-respect.
- Score de réputation dynamique avec suspension automatique en dessous du seuil critique.

### 5. Boutique de Points
- 3 packs fixes à prix unique :
  - **Pack Starter** : 50 points — 4,99 €
  - **Pack Créateur** : 150 points — 12,99 €
  - **Pack Pro** : 500 points — 34,99 €
- Intégration Stripe Checkout & Webhook idempotent pour le crédit sécurisé.
- Mode de simulation sandbox disponible pour les environnements de test.

### 6. Panel Administrateur
- Statistiques globales en temps réel (utilisateurs, points en circulation, litiges).
- Modération des comptes sociaux en attente.
- Arbitrage des signalements (confirmation de fraude avec sanction de réputation ou rejet du signalement).
- Gestion des utilisateurs (suspension / réactivation / ajustement manuel de points avec journal d'audit).
- Configuration dynamique des coûts, récompenses et plafonds système.

### 7. Conformité & Pages Légales
- Conditions Générales d'Utilisation (CGU).
- Politique de Confidentialité conforme RGPD.
- Avertissement officiel sur les règles des réseaux sociaux et déni de responsabilité.

---

## 🛠 Stack Technique

- **Framework** : Next.js 15 (App Router, React 19)
- **Langage** : TypeScript (mode strict)
- **Styles** : Tailwind CSS v3 (Thème Dark Mode moderne, glassmorphism)
- **Base de Données** : Prisma ORM (SQLite en local, compatible PostgreSQL en production)
- **Sécurité** : Cryptographie native Node.js (`scrypt`, SHA-256 HMAC)
- **Paiements** : Stripe Checkout & Webhooks

---

## 📦 Installation & Démarrage Local

### Prérequis
- Node.js >= 18.18.0
- npm ou pnpm

### 1. Cloner le dépôt
```bash
git clone https://github.com/kailawd7-byte/AddMe.io.git
cd AddMe.io
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
Copiez le fichier `.env.example` en `.env` :
```bash
cp .env.example .env
```

### 4. Initialiser la base de données
```bash
npx prisma db push
node prisma/seed.js
```

Le script de seed crée automatiquement les paramètres par défaut et le compte administrateur initial :
- **Email** : `admin@addme.io`
- **Mot de passe** : `AdminPassword123!`

### 5. Lancer l'application
```bash
# Mode développement
npm run dev

# Ou build et démarrage production
npm run build
npm run start
```
L'application est disponible sur [http://localhost:3000](http://localhost:3000).

---

## 🧪 Tests Unitaires & d'Intégration

La suite de tests automatisée couvre l'intégralité du grand livre financier (ledger), de l'authentification, de l'anti-fraude et des paiements :

```bash
npm test
```

> **57 tests réussis sur 57 (100% de succès)** :
> - Validation des entrées et sécurité cryptographique
> - Intégration base de données & bonus de bienvenue
> - Validation stricte des URLs de publications (TikTok & YouTube)
> - Ledger append-only, non-solde négatif et idempotence
> - Cycle de vie des campagnes et remboursements au prorata
> - Chronomètre 10s, séquestre 24h et arbitrage des signalements
> - Packs de points, checkout Stripe et webhooks
> - Panel administrateur, audit et modération

---

## 📄 Licence

Ce projet est sous licence MIT.

