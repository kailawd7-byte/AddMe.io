import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Vérification des 7 raffinements UI/UX & Responsive Mobile demandés par l'utilisateur", async (t) => {
  const landingPage = fs.readFileSync(path.resolve("src/app/page.tsx"), "utf8");
  const navbar = fs.readFileSync(path.resolve("src/components/Navbar.tsx"), "utf8");
  const dashboard = fs.readFileSync(path.resolve("src/app/dashboard/page.tsx"), "utf8");
  const campaigns = fs.readFileSync(path.resolve("src/app/campaigns/page.tsx"), "utf8");
  const supportWidget = fs.readFileSync(path.resolve("src/components/SupportWidget.tsx"), "utf8");
  const globalsCss = fs.readFileSync(path.resolve("src/app/globals.css"), "utf8");

  await t.test("1. Écosystème des 12 plateformes : Instagram possède sa signature chromatique #E1306C", () => {
    assert.match(
      landingPage,
      /hover:text-\[#E1306C\][\s\S]*?Instagram/,
      "Instagram a sa propre couleur magenta/rose #E1306C au lieu de blanc"
    );
  });

  await t.test("2. Simulateur : Étape 2 'Action souhaitée' avec textes compacts responsives sans débordement", () => {
    assert.match(
      landingPage,
      /shortLabel:\s*"Comment\."/,
      "Label court 'Comment.' pour mobile"
    );
    assert.match(
      landingPage,
      /shortLabel:\s*"Abonner"/,
      "Label court 'Abonner' pour mobile"
    );
    assert.match(
      landingPage,
      /overflow-hidden/,
      "Boutons du simulateur avec overflow-hidden"
    );
  });

  await t.test("3. Menu Burger Landing Page : Icônes cliquables de la communauté sans long bouton textuel", () => {
    // Dans le menu mobile burger de la landing page, le composant SocialCommunityIcons doit être présent
    assert.match(
      navbar,
      /<SocialCommunityIcons[\s\S]*?\/>/,
      "Composant SocialCommunityIcons présent dans le menu burger"
    );
    // Le bouton 'Mon Dashboard' ne doit plus être dans le menu burger de la landing page
    const landingMobileSection = navbar.substring(navbar.indexOf("Menu Déroulant Mobile"), navbar.indexOf("landing-page"));
    assert.doesNotMatch(
      landingMobileSection,
      /<span>Mon Dashboard[\s\S]*?<\/span>/,
      "Le bouton redondant 'Mon Dashboard' a été retiré du menu burger mobile de la landing"
    );
    assert.doesNotMatch(
      landingMobileSection,
      /<span>Rejoindre la communauté Discord<\/span>/,
      "Le long libellé textuel 'Rejoindre la communauté Discord' a été remplacé par des icônes"
    );
  });

  await t.test("4. Menu Drawer Dashboard : Icône Discord compacte sans long pavé rectangulaire", () => {
    const dashboardDrawerSection = navbar.substring(navbar.indexOf("Drawer Mobile"), navbar.indexOf("Sidebar Desktop"));
    assert.match(
      dashboardDrawerSection,
      /DiscordIcon/,
      "Icône Discord présente dans le drawer mobile"
    );
    assert.doesNotMatch(
      dashboardDrawerSection,
      /px-3\.5 py-2\.5 rounded-xl text-xs font-bold transition-all bg-\[#5865F2\]\/10[\s\S]*?Rejoindre/,
      "Le long bandeau 'Communauté Discord ... Rejoindre' a été remplacé"
    );
  });

  await t.test("5. Dashboard - Mes campagnes actives : Structure en carte avec barre de progression pleine largeur", () => {
    assert.match(
      dashboard,
      /p-3\.5 sm:p-4 rounded-2xl border border-\[#E3E3EE\]/,
      "Chaque campagne est logée dans une carte dédiée aérée"
    );
    assert.match(
      dashboard,
      /w-full h-2 rounded-full bg-\[#E3E3EE\]/,
      "La barre de progression occupe toute la largeur de la carte sans chevauchement"
    );
    assert.doesNotMatch(
      dashboard,
      /<div key=\{camp\.id\} className="addme-row">/,
      "L'ancienne disposition écrasée 'addme-row' a été supprimée"
    );
  });

  await t.test("6. Mes Campagnes (/campaigns) : Boutons d'actions compacts sur mobile qui ne débordent pas", () => {
    assert.match(
      campaigns,
      /<span className="hidden sm:inline">Détails<\/span>/,
      "Texte 'Détails' masqué sur mobile (seule l'icône apparaît)"
    );
    assert.match(
      campaigns,
      /<span className="hidden sm:inline">Modifier<\/span>/,
      "Texte 'Modifier' masqué sur mobile (seule l'icône apparaît)"
    );
    assert.match(
      campaigns,
      /!min-h-\[36px\] !min-w-\[36px\] sm:!min-w-0/,
      "Boutons d'action compacts de 36px sur mobile pour tenir entièrement dans le panel"
    );
  });

  await t.test("7. Support Client Flottant (FAB) : Cercle pur sans conteneur carré opaque en mode sombre", () => {
    assert.doesNotMatch(
      supportWidget,
      /<aside aria-label="Support client"/,
      "Le trigger FAB n'utilise plus la balise <aside>"
    );
    assert.match(
      supportWidget,
      /role="region"[\s\S]*?aria-label="Support client"[\s\S]*?!bg-transparent !border-0/,
      "Le conteneur est transparent et sans bordure"
    );
    assert.match(
      globalsCss,
      /\[aria-label="Support client"\]\s*\{\s*background:\s*transparent\s*!important;\s*border:\s*none\s*!important;/,
      "Règle CSS explicite empêchant tout arrière-plan ou bordure carrée en dark mode"
    );
  });

  await t.test("8. Footer & Communauté : Retrait de la pile textuelle Discord au profit des icônes cliquables (Discord, Telegram, Instagram, TikTok, Facebook)", () => {
    const socialIconsFile = fs.readFileSync(path.resolve("src/components/SocialCommunityIcons.tsx"), "utf8");
    const footerSection = landingPage.substring(landingPage.indexOf("<footer"));
    // Vérifier l'intégration dans le footer de la landing
    assert.match(footerSection, /<SocialCommunityIcons \/>/, "SocialCommunityIcons est présent dans le footer de la landing");
    assert.doesNotMatch(footerSection, /<span>Communauté Discord<\/span>/, "L'ancienne pile textuelle 'Communauté Discord' a été retirée du footer");
    
    // Vérifier les 5 réseaux configurés
    assert.match(socialIconsFile, /id:\s*"discord"/, "Discord configuré");
    assert.match(socialIconsFile, /id:\s*"telegram"/, "Telegram configuré");
    assert.match(socialIconsFile, /id:\s*"instagram"/, "Instagram configuré");
    assert.match(socialIconsFile, /id:\s*"tiktok"/, "TikTok configuré");
    assert.match(socialIconsFile, /id:\s*"facebook"/, "Facebook configuré");
    
    // Vérifier le comportement des liens : Discord a l'URL externe, les autres ont preventDefault()
    assert.match(socialIconsFile, /e\.preventDefault\(\)/, "Les réseaux sans URL active empêchent la navigation au clic");
  });
});
