import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { formatNumber, formatPoints } from "../src/lib/format.ts";
import { POINT_PACKS } from "../src/lib/constants.ts";

test("Vérification des 12 points Responsive Mobile & Cohérence AddMe.io", async (t) => {
  const landingPage = fs.readFileSync(path.resolve("src/app/page.tsx"), "utf8");
  const navbar = fs.readFileSync(path.resolve("src/components/Navbar.tsx"), "utf8");
  const dashboard = fs.readFileSync(path.resolve("src/app/dashboard/page.tsx"), "utf8");
  const tasks = fs.readFileSync(path.resolve("src/app/tasks/page.tsx"), "utf8");
  const campaignsNew = fs.readFileSync(path.resolve("src/app/campaigns/new/page.tsx"), "utf8");
  const shop = fs.readFileSync(path.resolve("src/app/shop/page.tsx"), "utf8");
  const globalsCss = fs.readFileSync(path.resolve("src/app/globals.css"), "utf8");

  await t.test("Point 1 : Hero fond sombre #0E0D14, opacité dégradé <= 0.35, boutons secondaires opaques >= 4.5:1", () => {
    assert.match(landingPage, /bg-\[#0E0D14\]/, "Le fond du Hero doit être #0E0D14");
    assert.match(landingPage, /opacity-35 md:opacity-100/, "L'opacité du lac sur mobile doit être limitée à ~0.35");
    assert.match(landingPage, /bg-\[#18162A\]/, "Les boutons secondaires doivent avoir un fond opaque sombre");
  });

  await t.test("Point 2 : En-tête avec bouton burger et menu mobile complet", () => {
    assert.match(navbar, /md:hidden flex items-center justify-center min-h-\[44px\] min-w-\[44px\]/, "Bouton burger présent avec min 44px");
    assert.match(navbar, /href="#how"[^>]*>[\s\S]*?Fonctionnement/, "Menu mobile contient Fonctionnement");
    assert.match(navbar, /href="#ecosystem"[^>]*>[\s\S]*?Réseaux compatibles/, "Menu mobile contient Réseaux compatibles");
    assert.match(navbar, /href="#simulateur"[^>]*>[\s\S]*?Simulateur/, "Menu mobile contient Simulateur");
    assert.match(navbar, /href="#prix"[^>]*>[\s\S]*?Tarifs/, "Menu mobile contient Tarifs");
    assert.match(navbar, /href="#faq"[^>]*>[\s\S]*?FAQ/, "Menu mobile contient FAQ");
  });

  await t.test("Point 3 : Texte d'accroche court (2-3 lignes) sur mobile sans les 12 réseaux", () => {
    assert.match(landingPage, /sm:hidden text-sm sm:text-base leading-relaxed/, "Accroche mobile dédiée présente");
    // La version mobile ne doit pas lister les 12 réseaux
    const mobileAccroche = landingPage.match(/<p className="sm:hidden[\s\S]*?<\/p>/)?.[0] || "";
    assert.doesNotMatch(mobileAccroche, /TikTok, Instagram, YouTube, Facebook/, "L'accroche mobile ne doit pas lister tous les 12 réseaux");
  });

  await t.test("Point 4 : Stats 3 colonnes même hauteur, '12 Plateformes' sur une seule ligne", () => {
    assert.match(landingPage, /grid-cols-3 gap-2 sm:gap-4[\s\S]*?items-stretch/, "3 colonnes de même hauteur (items-stretch)");
    assert.match(landingPage, /12 Plateformes\s*<\/div>/, "Titre 12 Plateformes présent");
    assert.match(landingPage, /text-xs sm:text-base group-hover:text-\[#FFB84D\] transition-colors whitespace-nowrap[\s\S]*?12 Plateformes/, "12 Plateformes avec whitespace-nowrap");
  });

  await t.test("Point 5 : Pièce 'pt' compacte sans déborder ni couvrir de carte", () => {
    assert.match(landingPage, /coin-spin-3d absolute top-1 right-2 sm:-top-2 sm:right-2 w-12 h-12 sm:w-\[76px\] sm:h-\[76px\]/, "Pièce compacte w-12 h-12 sur mobile");
  });

  await t.test("Point 6 : Padding-bottom >= 88px pour dégager le chat flottant", () => {
    assert.match(navbar, /pb-24 lg:pb-0/, "Navbar workspace main possède pb-24 (96px >= 88px)");
    assert.match(dashboard, /pb-28/, "Dashboard possède pb-28 (112px >= 88px)");
    assert.match(tasks, /pb-28/, "Tasks possède pb-28");
    assert.match(shop, /pb-28/, "Shop possède pb-28");
    assert.match(campaignsNew, /pb-28/, "Campaigns new possède pb-28");
  });

  await t.test("Point 7 : Solde unique en pastille mobile, cartes solde masquées sur pages secondaires, grille 2 colonnes sur dashboard", () => {
    assert.match(tasks, /hidden sm:inline-flex/, "Carte solde masquée sur mobile dans tasks");
    assert.match(campaignsNew, /hidden sm:inline-flex/, "Carte solde masquée sur mobile dans campaigns/new");
    assert.match(shop, /hidden sm:inline-flex/, "Carte solde masquée sur mobile dans shop");
    assert.match(dashboard, /grid-cols-2 sm:grid-cols-2 xl:grid-cols-4/, "Dashboard cartes stats en grille 2 colonnes sur mobile");
  });

  await t.test("Point 8 : Format des nombres fr-FR, espace insécable, pas de .0 inutile", () => {
    assert.equal(formatPoints(2600), "2\u202f600 pts");
    assert.equal(formatPoints(2000, "points"), "2\u202f000 points");
    assert.equal(formatPoints(10000, "points"), "10\u202f000 points");
    assert.equal(formatPoints(50.0), "50 pts");
    assert.equal(formatNumber(10000), "10\u202f000");
  });

  await t.test("Point 9 : Cibles tactiles >= 44px et font-size 16px sur inputs mobile", () => {
    assert.match(globalsCss, /font-size:\s*16px\s*!important/, "Inputs à 16px sur mobile (évite zoom iOS)");
    assert.match(globalsCss, /\.addme-btn[\s\S]*?min-height:\s*44px/, "Boutons à min-height: 44px");
    assert.match(globalsCss, /\.addme-chip[\s\S]*?min-height:\s*44px/, "Chips à min-height: 44px");
  });

  await t.test("Point 10 : Gagner des points - deux rangées distinctes et aucune carte imbriquée", () => {
    assert.match(tasks, /1\. Réseau social/, "Titre rangée 1 réseaux présent");
    assert.match(tasks, /2\. Action demandée/, "Titre rangée 2 actions présent");
    assert.match(tasks, /overflow-x-auto/, "Défilement horizontal actif sur les filtres");
    assert.doesNotMatch(tasks, /addme-card-static space-y-4[\s\S]*?addme-card animate-up flex flex-col/, "Pas de carte imbriquée autour des cartes tâches");
  });

  await t.test("Point 11 : Pack Créateur sans répétition de Populaire", () => {
    const createurPack = POINT_PACKS.find(p => p.id === "PACK_CREATOR");
    assert.equal(createurPack?.name, "Pack Créateur", "Le nom du pack est 'Pack Créateur'");
    assert.equal(createurPack?.badge, "Populaire", "Le badge du pack est 'Populaire'");
    assert.doesNotMatch(landingPage, /Pack Créateur Populaire · Populaire/, "Aucun doublon 'Pack Créateur Populaire · Populaire' sur la landing");
    assert.doesNotMatch(shop, /Pack Créateur Populaire · Populaire/, "Aucun doublon 'Pack Créateur Populaire · Populaire' dans la boutique");
  });

  await t.test("Point 12 : Alignement du paiement par carte entre landing et boutique", () => {
    assert.match(landingPage, /Mobile Money : Orange · MTN · Wave · Moov/, "Mobile Money mis en avant sur la landing");
    assert.match(landingPage, /Carte \(Bientôt\)/, "Carte bancaire marquée comme bientôt disponible sur la landing");
    assert.match(shop, /Carte Bancaire[\s\S]*?Bientôt/, "Carte bancaire marquée comme Bientôt dans la boutique");
  });
});
