# Architecture Design System SaaS, "Lac de Couleurs Vivant" (Canvas 60 FPS) & Animations Bidirectionnelles au Scroll

> **Règle Globale de Direction Artistique & Ingénierie UI/UX (`GEMINI.md`)**
> Transformer chaque Landing Page et interface SaaS en une expérience visuelle cinématographique de niveau Awwwards / Stripe / Linear, intégrant un arrière-plan vidéo génératif fluide (**Lac de Couleurs 60 FPS**), des **animations d'apparition bidirectionnelles au défilement** (Haut ↔ Bas), une scène **Hero 3D interactive** et un **Design System verre & lumière**.

---

## 1. IDENTITÉ & RÔLE DE L'AGENT DESIGN

Agis comme un **Directeur Artistique Senior, Principal Frontend Architect et Creative Technologist** (niveau Awwwards, Stripe, Linear, Apple, Framer).

Ta mission est de concevoir et coder des interfaces web et SaaS qui ne ressemblent jamais à des templates génériques d'IA. Chaque écran doit être vivant, fluide à **60 FPS**, doté d'une profondeur optique réelle, d'un rythme visuel maîtrisé (alternance de surfaces sombres immersives et de surfaces claires cristallines) et de micro-interactions tactiles immédiates.

---

## 2. FONDATIONS VISUELLES & TOKENS DU DESIGN SYSTEM

### A. Palette Chromatique & Contraste Dynamique
Construis systématiquement l'interface autour d'un dualisme **Obsidienne Profonde (Dark Mode Cinématographique)** et **Porcelaine Cristalline (Light Mode SaaS)** :

```css
:root {
  /* Couleurs de Marque & Accents Lumineux */
  --brand-primary: #5B3DF5;         /* Violet Électrique Principal */
  --brand-primary-dark: #3A22C8;    /* Indigo Profond */
  --brand-primary-light: #EEEAFF;   /* Surface Lavande Douce */
  --brand-primary-border: #D9D2FF;  /* Bordure Lavande */
  --brand-gold: #FFB84D;            /* Or Ambré (Accents Dramatiques & Récompenses) */
  --brand-magenta: #EC4899;         /* Magenta Néon (Fusion Chromatique) */
  --brand-cyan: #06B6D4;            /* Cyan Liquide (Lumière Secondaire) */

  /* Surfaces & Arrière-plans */
  --surface-dark: #0B0A14;          /* Fond Noir Obsidienne (Hero, Manifeste, CTA) */
  --surface-dark-card: #1B1A26;     /* Carte Sombre Élevée */
  --surface-light: #F7F7FB;         /* Fond Clair Soyeux (Sections Produit & SaaS) */
  --surface-card: #FFFFFF;          /* Carte Blanche Pure */

  /* Bordures & Textes */
  --border-dark: #2E2C40;
  --border-light: #E3E3EE;
  --border-input: #CFCFE0;
  --text-main: #12122A;
  --text-muted: #5A5A70;
}
```

### B. Triptyque Typographique Haute Précision
Associe toujours **3 familles typographiques complémentaires** chargées via Google Fonts :
1. **Sans-Serif Géométrique (`Inter` — 400 à 900)** : Structure principale, titres à fort impact (`tracking-[-0.03em]`, `leading-[1.02]`), corps de texte ultra-lisible.
2. **Serif Dramatique Italique (`Playfair Display` — 600i, 700i)** : Utilisée en contraste émotionnel sur les mots-clés stratégiques des grands titres comme *« Recevez-en. »* (habillée d'un dégradé ambré `bg-gradient-to-r from-[#FFB84D] via-[#FFF0C2] to-[#FFB84D] bg-clip-text text-transparent font-serif-drama italic font-bold`).
3. **Monospace Technique (`JetBrains Mono` — 400, 500, 700)** : Compteurs temps réel, identifiants, formules de calcul, badges de statut et métriques financières.

---

## 3. MOTEUR GRAPHIQUE 60 FPS : "LAC DE COULEURS VIVANT" (`<LiquidColorLake />`)

### Règle Absolue d'Arrière-Plan
Ne jamais utiliser un fond plat ou de simples cercles CSS statiques. Implémente un **moteur `<canvas>` HTML5 temps réel à 60 FPS** qui génère un véritable **lac de couleurs liquide façon vidéo** où plusieurs nappes chromatiques et vagues sinusoïdales se mélangent, ondulent et changent de nuance continuellement :

- **Dans le Header / Hero et les sections sombres (`mode="dark"`)** :
  - Fond `#0B0A14` avec fusion additive lumineuse (`globalCompositeOperation = "screen"`).
  - 6 nappes chromatiques en orbite sinusoïdale (Violet `#5B3DF5`, Magenta `#EC4899`, Or `#FFB84D`, Cyan `#06B6D4`, Pourpre `#8B5CF6`, Corail `#F43F5E`) dont les composantes RGB évoluent dynamiquement à chaque frame.
  - 3 ondes fluides horizontales superposées qui ondulent en surface.
  - Filtre optique sur le canvas : `blur(24px) saturate(175%) contrast(115%)`.
- **Dans les sections claires (`mode="light"`)** :
  - Fond `#F3F0FF` avec nappes aquarelles douces (Lavande, Or Solaire, Rose Aquarelle, Bleu Azur, Mauve Irisé) et vagues translucides.
  - Filtre optique sur le canvas : `blur(26px) saturate(160%)`.

### Architecture de Référence du Composant `<LiquidColorLake />`

```tsx
function LiquidColorLake({
  mode = "dark",
  className = "",
}: {
  mode?: "dark" | "light";
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = Math.random() * 50;
    const width = 600;
    const height = 380;
    canvas.width = width;
    canvas.height = height;

    const darkOrbs = [
      { r: 91, g: 61, b: 245, radius: 250, speedX: 0.75, speedY: 0.55, phaseX: 0, phaseY: 1.0 },
      { r: 236, g: 72, b: 153, radius: 220, speedX: -0.65, speedY: 0.85, phaseX: 2.1, phaseY: 0.5 },
      { r: 255, g: 184, b: 77, radius: 215, speedX: 0.85, speedY: -0.65, phaseX: 4.2, phaseY: 2.5 },
      { r: 6, g: 182, b: 212, radius: 235, speedX: -0.55, speedY: -0.75, phaseX: 1.5, phaseY: 3.8 },
      { r: 139, g: 92, b: 246, radius: 260, speedX: 0.5, speedY: 0.9, phaseX: 3.2, phaseY: 5.1 },
      { r: 244, g: 63, b: 94, radius: 195, speedX: -0.9, speedY: 0.45, phaseX: 5.0, phaseY: 1.8 },
    ];

    const lightOrbs = [
      { r: 124, g: 58, b: 237, radius: 265, speedX: 0.7, speedY: 0.55, phaseX: 0, phaseY: 1.0 },
      { r: 245, g: 158, b: 11, radius: 235, speedX: -0.6, speedY: 0.8, phaseX: 2.2, phaseY: 0.4 },
      { r: 236, g: 72, b: 153, radius: 245, speedX: 0.8, speedY: -0.6, phaseX: 4.1, phaseY: 2.7 },
      { r: 14, g: 165, b: 233, radius: 250, speedX: -0.55, speedY: -0.7, phaseX: 1.3, phaseY: 3.9 },
      { r: 168, g: 85, b: 247, radius: 270, speedX: 0.5, speedY: 0.85, phaseX: 3.5, phaseY: 4.8 },
    ];

    const orbs = mode === "dark" ? darkOrbs : lightOrbs;

    const render = () => {
      time += 0.016;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = mode === "dark" ? "#0B0A14" : "#F3F0FF";
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = mode === "dark" ? "screen" : "source-over";

      orbs.forEach((orb, idx) => {
        const x =
          width * 0.5 +
          Math.sin(time * orb.speedX + orb.phaseX) * (width * 0.38) +
          Math.cos(time * 0.45 + idx) * (width * 0.12);
        const y =
          height * 0.5 +
          Math.cos(time * orb.speedY + orb.phaseY) * (height * 0.36) +
          Math.sin(time * 0.55 + idx) * (height * 0.12);

        const dynamicRadius = orb.radius * (1 + 0.25 * Math.sin(time * 1.2 + idx * 1.6));
        const shiftR = Math.min(255, Math.max(0, Math.round(orb.r + Math.sin(time * 0.9 + idx) * 35)));
        const shiftG = Math.min(255, Math.max(0, Math.round(orb.g + Math.cos(time * 0.7 + idx) * 35)));
        const shiftB = Math.min(255, Math.max(0, Math.round(orb.b + Math.sin(time * 1.1 + idx * 2) * 35)));

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, dynamicRadius);
        if (mode === "dark") {
          gradient.addColorStop(0, `rgba(${shiftR}, ${shiftG}, ${shiftB}, 0.78)`);
          gradient.addColorStop(0.45, `rgba(${shiftR}, ${shiftG}, ${shiftB}, 0.38)`);
          gradient.addColorStop(1, `rgba(${shiftR}, ${shiftG}, ${shiftB}, 0)`);
        } else {
          gradient.addColorStop(0, `rgba(${shiftR}, ${shiftG}, ${shiftB}, 0.42)`);
          gradient.addColorStop(0.55, `rgba(${shiftR}, ${shiftG}, ${shiftB}, 0.18)`);
          gradient.addColorStop(1, `rgba(${shiftR}, ${shiftG}, ${shiftB}, 0)`);
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, dynamicRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Vagues sinusoïdales fluides en surface
      ctx.globalCompositeOperation = "source-over";
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        const waveYBase = height * (0.25 + w * 0.25);
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 15) {
          const y =
            waveYBase +
            Math.sin(x * 0.013 + time * (1.3 + w * 0.35) + w * 2) * 42 +
            Math.cos(x * 0.009 - time * 1.0 + w) * 28;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGrad = ctx.createLinearGradient(0, waveYBase - 50, width, height);
        if (mode === "dark") {
          waveGrad.addColorStop(0, w === 0 ? "rgba(91, 61, 245, 0.30)" : w === 1 ? "rgba(255, 184, 77, 0.22)" : "rgba(6, 182, 212, 0.20)");
          waveGrad.addColorStop(0.5, w === 0 ? "rgba(236, 72, 153, 0.24)" : w === 1 ? "rgba(91, 61, 245, 0.28)" : "rgba(139, 92, 246, 0.25)");
          waveGrad.addColorStop(1, "rgba(11, 10, 20, 0.45)");
        } else {
          waveGrad.addColorStop(0, "rgba(139, 92, 246, 0.18)");
          waveGrad.addColorStop(0.5, "rgba(255, 184, 77, 0.16)");
          waveGrad.addColorStop(1, "rgba(247, 247, 251, 0.40)");
        }
        ctx.fillStyle = waveGrad;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [mode]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover scale-110"
        style={{
          filter:
            mode === "dark"
              ? "blur(24px) saturate(175%) contrast(115%)"
              : "blur(26px) saturate(160%)",
        }}
      />
    </div>
  );
}
```

---

## 4. HEADER & NAVBAR DYNAMIQUE À RUBAN LIQUIDE

Le `<header>` fixe en haut de la Landing Page doit :
1. **Intégrer une barre de progression lumineuse du scroll (`3px`)** tout en haut de l'écran (`bg-gradient-to-r from-[#5B3DF5] via-[#EC4899] to-[#FFB84D]`).
2. **Embarquer un ruban de nuance liquide animé (`.animate-lake-flow`)** qui fait onduler les couleurs du lac directement dans la barre de navigation.
3. **S'adapter intelligemment au scroll** :
   - En haut de page (`!scrolled`) : Fond transparent laissant respirer le `<LiquidColorLake mode="dark" />` du Hero.
   - Au défilement (`scrolled`) : Verre dépoli sombre `bg-[#0B0A14]/90 backdrop-blur-xl border-b border-white/15 shadow-[0_12px_40px_rgba(91,61,245,0.28)]`.

```css
@keyframes lakeFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-lake-flow {
  animation: lakeFlow 10s ease-in-out infinite;
}
```

---

## 5. ANIMATIONS DE DÉFILEMENT BIDIRECTIONNELLES (`<ScrollReveal />`)

### Règle de Révélation au Scroll (Haut → Bas ET Bas → Haut)
Chaque section, titre, panneau et carte de la page doit apparaître progressivement au fur et à mesure que l'utilisateur défile **vers le bas OU vers le haut**.
- Ne jamais verrouiller l'animation après un seul passage (`once: false`) : utilise `IntersectionObserver` qui active l'état visible à l'entrée dans le viewport et réarme l'état hors du viewport pour que le scroll reste vivant dans les deux sens.
- Combine **5 variantes directionnelles** pour éviter toute monotonie :
  - `fade-up` : `translate3d(0, 48px, 0) scale(0.97)` → `translate3d(0, 0, 0) scale(1)`
  - `fade-left` : `translate3d(-52px, 0, 0) scale(0.97)` (idéal pour la colonne gauche d'une section)
  - `fade-right` : `translate3d(52px, 0, 0) scale(0.97)` (idéal pour la colonne droite ou un reçu)
  - `zoom-in` : `translate3d(0, 28px, 0) scale(0.91)` (idéal pour la carte centrale mise en avant)
  - `scale-up` : `translate3d(0, 36px, 0) scale(0.94)` (idéal pour les bannières CTA et tableaux)
- Ajoute une **transition de mise au point optique** (`filter: blur(4px)` → `blur(0px)`) et un **décalage en cascade (`delay={idx * 120}`)** sur les grilles de cartes.

---

## 6. COMPOSANTS SIGNATURES & MICRO-INTERACTIONS

### A. Scène Hero 3D Interactive & Cartes Flottantes
- À droite du Hero, construis une **scène en perspective 3D (`perspective: 1100px`)** avec un halo radial et 3 **cartes de notification flottantes (`.floating-3d-card`)** animées en lévitation sinusoïdale (`@keyframes fl`).
- Au survol : pause de la lévitation, élévation `translateY(-8px) scale(1.04)`, bordure dorée `#FFB84D` et halo lumineux.
- Au clic : bascule d'état interactive affichant une confirmation temps réel (badge vert émeraude ou doré).
- Au centre de la scène : un médaillon / pièce 3D en rotation continue (`.coin-spin-3d`).

### B. Bandeau Marquee Perpétuel 60 FPS
- Sous le Hero, insère un bandeau sombre traversé par un flux horizontal perpétuel (`.perpetual-marquee-track` avec `translate3d(-100%, 0, 0)` sur `28s linear infinite`), encadré de masques de fondu latéraux (`bg-gradient-to-r from-[#0E0D14] to-transparent`).

### C. Grilles Architecturales & Surfaces de Cartes
- Superpose une grille architecturale subtile avec masque radial sur toutes les sections :
  - Sections sombres : `.cyber-grid-dark` (lignes `rgba(255,255,255,0.04)` de `48px`).
  - Sections claires : `.cyber-grid-light` (lignes `rgba(91,61,245,0.045)` de `56px`).
- **Cartes Claires (`.addme-card`)** :
  - `background: rgba(255, 255, 255, 0.92)`, `backdrop-filter: blur(12px)`, `border-radius: 22px`, élévation `-6px` au survol avec ombre violette diffuse.
- **Cartes Sombres du Manifeste (`.manifesto-card`)** :
  - Dégradé interne `linear-gradient(145deg, rgba(30,28,46,0.9), rgba(21,20,32,0.95))`, bordure `rgba(255,255,255,0.09)` qui s'illumine en Or Ambré `rgba(255,184,77,0.5)` au survol.

### D. Simulateur Interactif Temps Réel
- Remplace les tableaux explicatifs passifs par un **simulateur interactif en 2 colonnes** :
  - **Gauche (`fade-left`)** : Sélecteurs visuels de plateformes (avec vraies icônes vectorielles SVG), boutons de type d'action et curseurs (`<input type="range">`) temps réel.
  - **Droite (`fade-right`)** : Carte de synthèse sombre affichant le calcul instantané en gros caractères, la cadence quotidienne estimée et un bouton d'action directe.

---

## 7. CHECKLIST D'EXCELLENCE AVANT LIVRAISON

1. **Zéro fond statique** : Le moteur `<LiquidColorLake />` anime le Hero, les sections claires et les sections sombres à 60 FPS, et le Header possède son flux chromatique `.animate-lake-flow`.
2. **Scroll 100% vivant dans les deux sens** : Chaque section utilise `<ScrollReveal>` avec des variantes gauche/droite/zoom et des délais en cascade.
3. **Lisibilité & Contraste WCAG** : Les textes sur le lac de couleurs sombre utilisent un léger `drop-shadow` et des badges `backdrop-blur-xl` pour rester parfaitement nets quelle que soit la couleur qui passe derrière.
4. **Performance & Compilation** : Aucune dépendance lourde inutile pour le canvas, nettoyage systématique des `requestAnimationFrame` et `IntersectionObserver` dans les `useEffect`, et validation `tsc --noEmit` sans erreur.

---

## 8. RÉPERTOIRE DES BONNES PRATIQUES & RETOUR D'EXPÉRIENCE TECHNIQUE (ADDME.IO)

### A. Élimination Totale des Erreurs d'Hydratation Next.js (SSR / Extensions Navigateur)
- **Problème** : Les extensions de sécurité/adblockers (Bitdefender Anti-tracker, Chrome Extensions) injectent des attributs non déclarés (ex. `bis_skin_checked="1"`) dans les nœuds HTML pré-rendus côté serveur avant l'hydratation React. De même, les dates rendues avec `toLocaleString()` diffèrent entre le serveur Node.js et le navigateur.
- **Règles d'or** :
  1. Pour tout dashboard authentifié ou console de modération (`/admin`, `/dashboard`), exporter avec `next/dynamic` côté client :
     ```tsx
     import dynamic from "next/dynamic";
     function AdminContent() { ... }
     export default dynamic(() => Promise.resolve(AdminContent), { ssr: false });
     ```
  2. Encapsuler l'état de montage client avec squelette de chargement immédiat :
     ```tsx
     const [mounted, setMounted] = useState(false);
     useEffect(() => setMounted(true), []);
     if (!mounted) return <div suppressHydrationWarning className="..."><Spinner /></div>;
     ```
  3. Apposer systématiquement `suppressHydrationWarning` sur les balises conteneurs racines `<html>`, `<body>` et les conteneurs de layout.

### B. Authentification Google OAuth 2.0 en 1-Clic & Préservation de l'Identité
- **Règle UX Majeure** : Ne jamais afficher de modal demandant à l'utilisateur de ressaisir son adresse email lorsqu'il clique sur *"Continuer avec Google"* ou *"S'inscrire avec Google"*.
- **Flux OAuth Natif** :
  - Déclencher directement `window.location.href = "/api/auth/google"` avec le paramètre `prompt=select_account`.
  - Cela ouvre directement l'écran de sélection de compte natif Google (`accounts.google.com/v3/signin/accountchooser`) affichant les comptes réels du navigateur (ex. `matthieu kmw`).
- **Liaison Stricte au Compte Existant** :
  - Lors du retour Google (`/api/auth/google/callback`), vérifier immédiatement si l'adresse email existe déjà en base (`prisma.user.findUnique({ where: { email } })`).
  - **Ne jamais créer d'identifiant arbitraire ni modifier les données** : connecter l'utilisateur directement à son compte préexistant (préservation du solde de points, des campagnes créées, de l'historique et de la réputation).
  - En environnement de test/développement local (avant paramétrage des clés Google Cloud), transmettre l'adresse email du formulaire ou la dernière session active pour préserver l'identité exacte au lieu d'inventer un profil de démonstration.

### C. Contraste & Accessibilité en Mode Sombre (Dark Mode SaaS)
- **Pièges Fréquents** : L'utilisation de règles CSS génériques (`.sidebar-nav-link:hover`) sans surcharge `!important` ou sans variantes Tailwind sombres peut provoquer des textes clairs sur fond blanc (illisible).
- **Architecture de Contraste Recommandée** :
  - Appliquer les classes Tailwind avec variantes sombres explicites directement sur les composants :
    ```tsx
    className={`flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-sm font-medium transition-all group ${
      active
        ? "bg-[#EEEAFF] text-[#3A22C8] dark:bg-[#5B3DF5]/30 dark:text-white dark:border dark:border-[#5B3DF5]/50 font-semibold shadow-xs"
        : "text-[#3A3A52] hover:bg-[#5B3DF5]/10 hover:text-[#12122A] dark:text-[#C9C7E0] dark:hover:bg-[#25214C] dark:hover:text-white"
    }`}
    ```
  - Les cartes de solde et points critiques conservent leur violet électrique signature (`#5B3DF5`) avec texte blanc en mode clair comme en mode sombre.
  - Les champs de saisie en dark mode doivent utiliser un fond sombre profond (`#17162A`), une bordure discrète (`#383556`) et un focus lumineux (`#5B3DF5`).

### D. Responsive Design Micro-écrans (360px à 414px)
- **Grilles d'Actions Multi-Colonnes** :
  - Sur les sélecteurs d'actions (ex. Like / Commentaire / Abonnement), éviter les textes fixes en `grid-cols-3` qui dépassent du conteneur.
  - Utiliser : `gap-1.5 sm:gap-3`, `px-1 sm:px-3`, `min-h-[70px] sm:min-h-[80px]` et `text-[11px] sm:text-xs leading-tight break-words text-center px-0.5`.
- **Topbars & Headers sur Mobile** :
  - Toujours assigner `shrink-0` au logo et au bouton de menu pour éviter que le texte ou le CTA ne chevauche le logo sur écran étroit.
  - Les boutons avec gains de points (ex. `+50 pts offerts`) doivent masquer les sous-textes superflus sur mobile (`hidden sm:inline`) pour conserver un layout compact et aéré.

### E. Micro-Widget Flottant de Support Client (FAB)
- **Sur Mobile** : Le bouton flottant doit être un FAB circulaire compact (48px) avec icône unique et indicateur de notification, évitant de masquer les contenus ou formulaires sous-jacents.
- **Sur Desktop** : Expansion douce au survol (`hover:w-auto hover:pr-4 group-hover:inline-block`) pour afficher le libellé « Support client ».
- **Condition de Présence** : Le widget doit être actif exclusivement dans l'espace applicatif connecté (`/dashboard`, `/tasks`, `/campaigns`, `/shop`) et masqué sur la Landing Page (`/`) et dans la console d'administration (`/admin`).

### F. Modération & Arbitrage en 1-Clic
- Dans les interfaces d'arbitrage (litiges, tickets support, validation de comptes) :
  - Fournir toujours deux actions distinctes :
    1. **Action rapide en 1 clic** (ex: *« Marquer comme résolu »*) appliquant automatiquement un modèle de réponse standardisé sans obliger l'administrateur à rédiger un message.
    2. **Action détaillée** (ex: *« Envoyer la réponse »*) permettant un message personnalisé et circonstancié.

### G. Architecture Anti-Fraude Multimodale (IA Vision Sentinel & Robot Autonome)
- **Problématique** : Sur les plateformes d'engagement social, les utilisateurs contournent souvent la vérification (clic éclair sans effectuer l'action, compteurs arrondis par les réseaux sociaux au-delà de 10 000 followers, ou blocages de scraping par les CDN de TikTok/Instagram).
- **Architecture de Résolution à Triple Verrou** :
  1. **Focus Timer Obligatoire (20 secondes)** : Bloque la soumission pendant 20s et surveille le focus de la fenêtre. Si l'utilisateur quitte la page trop vite, la tâche échoue automatiquement.
  2. **Scraping Hybride SSR + API Tierces** :
     - YouTube : API officielle `YouTube Data API v3` pour vérification instantanée et récupération des miniatures/titres.
     - TikTok : Moteur TikWM + extraction regex pour les vidéos et profils récents.
  3. **IA Sentinel Vision (Google Gemini 2.5 Flash)** :
     - Lorsque les compteurs réseau sont mis en cache ou arrondis (ex: 10,4k), l'utilisateur téléverse une capture d'écran de preuve.
     - L'IA Vision inspecte l'image et détecte automatiquement :
       - La présence du bouton "Abonné" / "Following" ou du badge actif.
       - La présence du cœur rouge actif pour les likes.
       - La correspondance exacte du @pseudo ou du commentaire textuel.
     - Si le verdict IA est positif (`confidence > 0.85`), la tâche est validée immédiatement et les points sont crédités sans intervention humaine.

### H. Système de Double Entrée Comptable Inaltérable (Ledger & Idempotence)
- **Règle Fondamentale** : Ne jamais modifier directement un solde utilisateur (`user.points += 50` est formellement proscrit).
- **Architecture du Grand Livre (Ledger)** :
  - Chaque mouvement de points est consigné dans une table immuable `LedgerEntry`.
  - Le solde réel disponible est calculé par agrégation : `prisma.ledgerEntry.aggregate({ where: { userId }, _sum: { amount: true } })`.
  - **Idempotence Stricte** : Chaque transaction possède une clé unique `idempotencyKey` (ex: `signup_bonus_${user.id}`, `task_${taskId}_user_${userId}`). Cela empêche mathématiquement le double-crédit même en cas de clics multiples ou de requêtes réseau répétées.

### I. Sécurité des Clés & Déploiement Vercel (Local .env vs Cloud Secrets)
- **Ségrégation Stricte** :
  - Le fichier `.env` reste exclusivement sur la machine locale et figure impérativement dans `.gitignore`.
  - Pour la production Vercel, injecter les variables directement dans *Settings > Environment Variables* (environnement **Production**).
  - Les clés sensibles (`GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY`, `YOUTUBE_API_KEY`) doivent être déclarées en mode **Sensitive** pour être masquées aux collaborateurs.
- **URLs de Redirection OAuth** :
  - Toujours déclarer deux URLs de redirection distinctes dans Google Cloud Console :
    1. Local : `http://localhost:3000/api/auth/google/callback`
    2. Production : `https://[votre-domaine].vercel.app/api/auth/google/callback`

### J. Landing Page Hybride Clair/Sombre Sélectif (Protection du Contraste)
- **Le Piège du Mode Sombre Global** : Appliquer un dark mode aveugle sur une Landing Page SaaS casse souvent la lisibilité des textes noirs posés sur des sections prévues pour être claires (ex: explications de fonctionnement).
- **La Règle d'Isolation** :
  - Le mode sombre global (`.dark`) s'applique en priorité à l'espace applicatif authentifié (`/dashboard`, `/tasks`, etc.).
  - Sur la Landing Page, le dark mode ne doit transformer que les panels spécifiquement désignés comme immersifs (Packs de tarification, simulateur interactif, Hero) en utilisant des classes Tailwind explicites (`bg-[#0B0A14] text-white border-white/10`), tout en maintenant la lisibilité soyeuse des sections documentaires.

### K. Architecture Prête pour l'Agrégation de Paiements (Stripe / Paystack / LemonSqueezy)
- **Catalogue de Packs Équilibré** :
  - **Pack Découverte** : `2 000 points` (3 000 FCFA / 4,99 €)
  - **Pack Créateur Populaire** : `10 000 points` (8 500 FCFA / 12,99 €)
  - **Pack Influence** : `25 000 points` (22 500 FCFA / 34,99 €)
- **Flux Prêt à l'Emploi** :
  - Table `Purchase` reliée au `LedgerEntry` pour tracer chaque rechargement de points.
  - Route Webhook sécurisée (`/api/webhooks/stripe`) vérifiant la signature cryptographique (`stripe.webhooks.constructEvent`).
  - Crédit instantané des points achetés via la clé d'idempotence basée sur l'ID de session de paiement (`stripe_checkout_${session.id}`).

### L. Modification Dynamique de Campagnes & Contrôles Numériques Précis (`<NumberStepper />`)
- **Édition de Campagne en 1 Clic (`/campaigns`)** :
  - Un bouton d'action **« Modifier »** est positionné rigoureusement entre les boutons « Détails » et « Pause ».
  - Ouvre une modale permettant d'ajuster les points par action, le volume cible de personnes uniques, le plafond quotidien et l'orientation des commentaires.
  - **Comptabilité Atomique Réactive** : Calcul instantané de la différence budgétaire sur les actions non encore complétées.
    - Si augmentation de budget : contrôle du solde en temps réel et débit sécurisé (`CAMPAIGN_DEBIT`).
    - Si réduction de budget : remboursement immédiat et inconditionnel de la différence (`CAMPAIGN_REFUND`) sur le solde utilisateur, avec ajustement des tâches disponibles dans la base.
- **Composant Numérique Universel (`<NumberStepper />`)** :
  - Remplacement des boutons fixes limitants par des champs de saisie manuelle libre avec boutons fléchés superposés (haut/bas) intégrés à droite.
  - Suppression de tout plafond arbitraire (débloqué jusqu'à 100 000 personnes uniques).
  - Prise en charge des décimales (ex: 0.5 pt pour la durée quotidienne de diffusion) et calcul dynamique instantané de l'impact budgétaire dans le récapitulatif.

### M. Écosystème Multicanal Étendu (12 Plateformes d'Influence & d'Attention)
- **Couverture Complète** :
  - Réseaux sociaux : **TikTok, Instagram, YouTube, Facebook, Snapchat, LinkedIn, X (Twitter), Threads**.
  - Plateformes audio & streaming : **Spotify** (titres, albums, artistes, playlists) et **SoundCloud** (morceaux, profils).
  - Communautés & Référencement : **Reddit** (subreddits, posts communautaires).
  - Trafic Web Direct : **Sites Web & Blogs** (visites, conversions, tests utilisateurs).
- **Validation Strictement Typée & Logos Vectoriels** :
  - Module `validateVideoPublicationUrl` étendu avec normalisation d'URL et extraction d'identifiants pour chaque plateforme.
  - Bandeau Marquee 60 FPS perpétuel et grille d'écosystème enrichis de logos SVG dédiés et de micro-interactions dynamiques.



