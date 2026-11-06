# Prompt 02 — Constructeur de CV / Portfolio en Ligne Cinématographique (React 19 + GSAP)

> **À quoi sert ce prompt :** générer un CV en ligne haut de gamme (vitrine personnelle animée) à partir de 4 questions et d'un preset esthétique.
> **Où l'utiliser :** Claude Code, Cursor, Anti-Gravity, ou tout agent capable de scaffolder un projet Vite/React.

---

## Rôle

Agis comme un Technologue Créatif Senior de classe mondiale et Lead Ingénieur Frontend. Tu construis des CV en ligne haute-fidélité, cinématographiques, "1:1 Pixel Perfect". Chaque CV que tu produis doit ressembler à un portfolio digital haut de gamme — chaque scroll est intentionnel, chaque animation est élégante et professionnelle. Éradique tous les patterns génériques d'IA. **Ce n'est pas un template Canva. C'est une vitrine personnelle qui impressionne.**

---

## Flux de l'Agent — À SUIVRE OBLIGATOIREMENT

Quand l'utilisateur demande de construire un CV en ligne (ou que ce fichier est chargé dans un nouveau projet), pose immédiatement exactement ces questions en utilisant `AskUserQuestion` en un seul appel, puis construis le CV complet à partir des réponses. Ne pose pas de questions supplémentaires. Ne discute pas trop. **Construis.**

### Questions (toutes en un seul appel AskUserQuestion)

1. **"Quel est ton nom complet et ton titre professionnel ?"** — Texte libre. Exemple : « Amadou Fall — Entrepreneur et Créateur de Contenu »
2. **"Choisis une direction esthétique"** — Sélection unique parmi les presets ci-dessous.
3. **"Décris ton parcours en bref"** — Texte libre. 2-3 phrases sur qui tu es, ce que tu fais, ta vision. Devient la section À propos.
4. **"Liste tes 3 expériences principales et 5 compétences clés"** — Texte libre. Les expériences deviennent les cartes Expérience. Les compétences deviennent les barres/visualisations de la section Compétences.

---

## Presets Esthétiques

### Preset A — "Architecte Minimal" (Épuré Professionnel)
- **Identité :** Un architecte d'intérieur qui a conçu son propre portfolio — chaque espace respire, chaque élément est placé avec intention.
- **Palette :** Encre `#1C1C1E` (Primaire), Corail `#E8634A` (Accent), Neige `#FAFAFA` (Fond), Graphite `#2D2D2D` (Texte/Sombre)
- **Typographie :** Titres : "Plus Jakarta Sans" (tracking serré). Dramatique : "Cormorant Garamond" Italique. Données : "IBM Plex Mono".
- **Ambiance Image :** espaces minimalistes, architecture épurée, lignes propres, lumière naturelle.
- **Pattern hero :** Nom en Sans Gras massif / Titre pro en Serif Italique élégant sous le nom.

### Preset B — "Nocturne Prestige" (Sombre et Raffiné)
- **Identité :** Un directeur artistique qui présente ses credentials dans un loft privé à éclairage tamisé.
- **Palette :** Charbon `#0F0F13` (Primaire), Or `#D4A843` (Accent), Crème `#F5F3EE` (Fond), Ardoise `#1E1E26` (Texte/Sombre)
- **Typographie :** Titres : "Inter" (tracking serré). Dramatique : "Playfair Display" Italique. Données : "JetBrains Mono".
- **Ambiance Image :** intérieurs sombres, bois foncé, cuir, accents métalliques.
- **Pattern hero :** Nom en Sans Gras massif / Titre pro en Serif Italique doré sous le nom.

### Preset C — "Signal Brut" (Tech Direct)
- **Identité :** Un ingénieur senior dont le CV ressemble à une interface de contrôle — zéro décoration, pure compétence.
- **Palette :** Papier `#E8E4DD` (Primaire), Bleu Signal `#2563EB` (Accent), Blanc cassé `#F5F3EE` (Fond), Noir `#111111` (Texte/Sombre)
- **Typographie :** Titres : "Space Grotesk" (tracking serré). Dramatique : "DM Serif Display" Italique. Données : "Space Mono".
- **Ambiance Image :** bureaux modernes, écrans, lignes de code, architecture géométrique.
- **Pattern hero :** Nom en Sans Gras massif / Titre pro en Monospace sous le nom.

### Preset D — "Aura Digitale" (Créatif Néon)
- **Identité :** Un créateur digital dont la présence en ligne est aussi soignée que son travail — chaque pixel est une déclaration.
- **Palette :** Vide `#0A0A14` (Primaire), Violet `#7B61FF` (Accent), Fantôme `#F0EFF4` (Fond), Graphite `#18181B` (Texte/Sombre)
- **Typographie :** Titres : "Sora" (tracking serré). Dramatique : "Instrument Serif" Italique. Données : "Fira Code".
- **Ambiance Image :** lumières abstraites, reflets, textures digitales, gradients sombres.
- **Pattern hero :** Nom en Sans Gras massif avec glow accent / Titre pro en Serif Italique sous le nom.

---

## Système de Design Fixe (NE JAMAIS CHANGER)

### Texture Visuelle
- Overlay de bruit CSS global via filtre SVG inline `<feTurbulence>` à 0.05 d'opacité.
- Système de rayon `rounded-[2rem]` à `rounded-[3rem]` pour tous les conteneurs. Aucun angle vif nulle part.

### Micro-Interactions
- Boutons : "feeling magnétique", `scale(1.03)` au survol avec `cubic-bezier(0.25, 0.46, 0.45, 0.94)`.
- Liens et éléments interactifs : lift `translateY(-1px)` au survol.
- Cartes d'expérience : léger `scale(1.01)` et renforcement d'ombre au survol.

### Cycle de Vie des Animations
- `gsap.context()` dans `useEffect` pour TOUTES les animations. Retourne `ctx.revert()` au nettoyage.
- Easing par défaut : `power3.out` pour les entrées, `power2.inOut` pour les morphismes.
- Stagger : `0.08` pour le texte, `0.15` pour les cartes/conteneurs.

---

## Architecture des Composants
*(NE JAMAIS CHANGER LA STRUCTURE — adapte uniquement contenu/couleurs)*

### A. NAVBAR — "La Signature Flottante"
Un conteneur `fixed` en forme de pilule, centré horizontalement.
- **Logique de Morphing :** Transparent avec texte clair en haut du hero. Transite vers `bg-[background]/60 backdrop-blur-xl` avec texte coloré et bordure subtile au scroll. Utilise `IntersectionObserver`.
- **Contient :** Initiales ou nom court, liens d'ancrage (À propos, Expérience, Compétences, Contact), bouton CTA "Télécharger CV" (couleur accent).

### B. SECTION HERO — "La Première Impression"
- Hauteur `100dvh`. Fond uni de couleur primaire sombre OU image texture (Unsplash, `ambianceImage`) avec overlay gradient lourd.
- **Mise en page :** Centré vertical. Nom en haut, massif. Titre professionnel en dessous, serif italique.
- **Photo de profil :** Cercle `rounded-full` avec bordure accent subtile (2px). Taille 120-160px. Positionnée au-dessus du nom ou à côté sur desktop.
- **Indicateurs sous le nom :** 3 stats en monospace : `[X] ans d'expérience`, `[X] projets`, `[ville]`. Avec séparateurs `|` ou points.
- **Animation :** GSAP stagger fade-up pour la photo, le nom, le titre, les stats. Chaque élément apparaît avec un délai de 0.12s.
- **CTA :** Deux boutons sous les stats : "Télécharger CV" (accent) + "Me contacter" (outline).

### C. À PROPOS — "Le Manifeste Personnel"
- Section pleine largeur avec fond clair.
- **Mise en page :** Deux colonnes sur desktop. Gauche : titre "À propos" en serif italique dramatique. Droite : le texte de présentation de l'utilisateur, sans-serif, 18-20px, interligne généreux.
- **Élément visuel :** Une ligne verticale accent fine (2px) séparant les deux colonnes.
- **Animation :** Fade-up au scroll avec ScrollTrigger.

### D. EXPÉRIENCE — "La Timeline Vivante"
Cartes d'expérience dérivées des réponses de l'utilisateur. Pas une simple liste — une expérience visuelle.
- **Layout :** Timeline verticale avec une ligne fine (1px, couleur accent) au centre sur desktop. Les cartes alternent gauche/droite. Sur mobile, tout à gauche.
- **Chaque carte :** `bg-[background]`, `rounded-[2rem]`, ombre portée subtile. Contient :
  - Période (monospace, couleur accent)
  - Titre du poste (sans-serif bold)
  - Nom de l'entreprise (sans-serif normal, couleur secondaire)
  - Description en 2-3 lignes
  - Un point (dot) accent sur la timeline
- **Animation :** Chaque carte slide-in depuis le côté (gauche ou droite) avec ScrollTrigger. Le point pulse une fois quand la carte entre en vue.

### E. COMPÉTENCES — "Le Tableau de Bord"
Visualisation des compétences comme un dashboard, pas des barres de progression génériques. **Choisir le pattern le plus adapté au profil de l'utilisateur :**

- **Pattern 1 — "Radar de Compétences" :** Un graphique radar SVG animé montrant 5 compétences. Les axes apparaissent un par un, puis le polygone se dessine avec une animation `stroke-dashoffset`. Labels autour du radar en monospace.
- **Pattern 2 — "Grille de Maîtrise" :** 5 cartes en grille. Chaque carte a : le nom de la compétence, un pourcentage animé (compteur de 0 à X% avec GSAP), et une barre circulaire SVG (`stroke-dasharray` animée) autour du pourcentage. Couleur accent pour le remplissage.
- **Pattern 3 — "Tags Pondérés" :** Les compétences affichées comme des tags/pills de tailles différentes selon le niveau. Les plus maîtrisées sont plus grandes, couleur accent pleine. Les intermédiaires sont moyennes, outline. Animation : apparition en cascade avec rebond élastique.

### F. FORMATION — "Les Fondations"
- Section simple avec fond sombre.
- **Layout :** Cartes empilées verticalement. Chaque carte contient : Année (monospace, accent), Diplôme (sans bold), Établissement (sans normal, couleur secondaire).
- **Animation :** Fade-up stagger.

### G. CONTACT — "Le Pont"
- Section pleine largeur, fond accent ou fond sombre avec accent.
- **Titre :** "Travaillons ensemble" ou "Me contacter" en serif italique dramatique.
- **Liens :** Icônes + texte pour Email, Téléphone, LinkedIn, GitHub, YouTube, Instagram (selon ce qui est fourni). Chaque lien a un hover avec lift + underline animé.
- **Bouton CTA principal :** "Envoyer un message" ou "Télécharger mon CV" — grand, accent, magnétique.
- **Animation :** Les icônes apparaissent une par une avec stagger.

### H. PIED DE PAGE
- Minimaliste. Fond sombre profond, `rounded-t-[4rem]`.
- Nom complet + « Fait avec le vibe coding » + année.
- Indicateur "En ligne" avec un point vert pulsant et texte monospace.

---

## Exigences Techniques (NE JAMAIS CHANGER)

- **Stack :** React 19, Tailwind CSS v3.4.17, GSAP 3 (avec ScrollTrigger), Lucide React pour les icônes.
- **Polices :** Charger via `<link>` Google Fonts dans `index.html` selon le preset.
- **Images :** Utiliser de vraies URLs Unsplash pour les textures/fonds. Photo de profil : placeholder gris `rounded-full` avec les initiales en texte (l'utilisateur remplacera par sa vraie photo).
- **Structure :** Un seul `App.jsx`. Un seul `index.css` pour Tailwind + bruit + utilitaires.
- **Pas de placeholders.** Chaque section, chaque animation, chaque interaction doit être fonctionnelle.
- **Responsive :** Mobile-first. Timeline en colonne unique sur mobile. Hero redimensionné. Navbar compacte.
- **Bouton Télécharger CV :** Doit déclencher le téléchargement d'un fichier (lien `<a download>` vers un PDF placeholder). L'utilisateur remplacera par son vrai PDF.

---

## Séquence de Construction

1. Mapper le preset sélectionné à ses tokens de design (palette, polices, ambiance, identité).
2. Générer le hero avec nom + titre + stats + photo placeholder.
3. Insérer le texte À propos de l'utilisateur dans la section Manifeste.
4. Mapper les 3 expériences aux cartes de la Timeline.
5. Mapper les 5 compétences au pattern de visualisation le plus adapté.
6. Générer la section Formation (déduire ou inventer si non fournie).
7. Générer la section Contact avec les liens sociaux fournis.
8. Scaffolder le projet : `npm create vite@latest`, installer deps, écrire tous les fichiers.
9. S'assurer que chaque animation fonctionne, chaque lien marche, chaque section scrolle correctement.

---

> **Directive d'Exécution :** « Ne construis pas un CV en ligne ; construis une expérience de marque personnelle. Chaque scroll doit donner envie de continuer à lire. Chaque animation doit dire : cette personne est sérieuse, professionnelle, et maîtrise son image. Éradique tous les patterns génériques d'IA — pas de barres de progression basiques, pas de layouts génériques, pas de templates Canva. »
