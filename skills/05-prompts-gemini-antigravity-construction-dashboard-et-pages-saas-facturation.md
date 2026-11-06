# Prompt 05 — Construction du Dashboard et des Pages du SaaS de Facturation (à donner à Gemini dans Anti-Gravity)

> **À quoi sert ce prompt :** faire construire l'interface du SaaS de facturation, page par page, à partir du plan généré par Claude (Prompt 04) et de captures d'écran Dribbble.
> **Où l'utiliser :** Anti-Gravity avec Gemini comme modèle.
> **Ce qu'il faut fournir :** ce prompt + le plan de Claude + les captures d'écran Dribbble.
> Ce fichier contient **deux prompts successifs** : d'abord le dashboard, puis les pages suivantes une fois le design validé.

---

## PROMPT 5.A — Dashboard et Sidebar (premier passage)

Tu es un designer et développeur front-end de classe mondiale avec plus de 15 ans d'expérience dans la création d'interfaces SaaS haute qualité, responsives et primées sur Dribbble et Awwwards.

Voici le plan d'implémentation complet pour notre SaaS de facturation :

```
[COLLER ICI LE PLAN GÉNÉRÉ PAR CLAUDE]
```

Et voici les captures d'écran d'inspiration pour le design :

```
[JOINDRE ICI LES CAPTURES D'ÉCRAN DRIBBBLE]
```

Commence par construire le **Dashboard** et la **sidebar de navigation** en suivant le plan d'implémentation et en t'inspirant du style visuel des captures d'écran.

### Règles à suivre

- Utilise **Next.js 14 (App Router)** et **Tailwind CSS**.
- Prends le style de design des captures d'écran (couleurs, typographie, espacements, disposition) et applique-le à toutes les pages.
- Pour l'instant, utilise des **données fictives codées en dur**. Pas de base de données encore.
- Les montants doivent être affichés en **FCFA** (ex : 250 000 FCFA).
- Les dates au format **jour/mois/année**.
- Les statuts des factures avec des **badges colorés** : vert pour payée, orange pour envoyée, gris pour brouillon, rouge pour en retard.
- **Design responsive** : sidebar sur desktop, hamburger sur mobile.
- Le code doit être **propre et bien structuré**.

Construis le dashboard complet avec la sidebar, les 4 cartes de stats, et le tableau des dernières factures. Une fois que j'ai validé le design, on passera aux autres pages.

---

## PROMPT 5.B — Pages suivantes (après validation du dashboard)

Le dashboard est validé. Maintenant, construis les pages suivantes en gardant **exactement le même style de design** :

### PAGE CRÉER UNE FACTURE
- Formulaire avec sélection du client (liste déroulante)
- Date d'émission (aujourd'hui par défaut), date d'échéance
- Section lignes de facture : chaque ligne a description, quantité, prix unitaire. Total de la ligne calculé automatiquement.
- Bouton ajouter une ligne, bouton supprimer une ligne
- En bas : sous-total, TVA 18%, total TTC
- Montants en FCFA, arrondis à l'entier
- Boutons : Sauvegarder comme brouillon / Envoyer

### PAGE LISTE DES FACTURES
- Tableau avec toutes les factures
- Filtres par statut (tous, brouillon, envoyée, payée, en retard)
- Barre de recherche par nom de client
- Clic sur une facture ouvre le détail

### PAGE DÉTAIL FACTURE
- Affichage complet avec toutes les lignes
- Bouton changer le statut
- Bouton modifier (formulaire pré-rempli)
- Bouton supprimer (avec confirmation)

### PAGE CLIENTS
- Liste de tous les clients
- Formulaire ajouter (nom, email, téléphone, adresse)
- Modifier et supprimer

Garde les données fictives. Même style que le dashboard.
