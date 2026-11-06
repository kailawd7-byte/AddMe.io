# Prompt 04 — Plan d'Implémentation d'un SaaS de Facturation pour Entrepreneurs Africains (à donner à Claude)

> **À quoi sert ce prompt :** faire produire par Claude un plan d'implémentation complet et détaillé avant d'écrire la moindre ligne de code.
> **Où l'utiliser :** Claude (chat ou Claude Code). C'est la **première étape** du workflow « Claude planifie, Gemini construit ».
> **Étape suivante :** donner le plan généré au Prompt 05 (Gemini / Anti-Gravity).

---

## Le Prompt

Tu es un architecte logiciel et designer senior de classe mondiale avec plus de 15 ans d'expérience dans la conception d'applications SaaS de haute qualité. Tu as conçu des produits pour des entreprises de premier plan.

On veut construire un SaaS full-stack de facturation pour les entrepreneurs africains. C'est très important que tu fasses ça bien — c'est un produit que de vrais utilisateurs vont utiliser pour gérer leur argent.

### En tant qu'utilisateur, on veut pouvoir :

- Voir toutes les factures et les statistiques dans un beau dashboard (nombre total, montant facturé, montant payé, montant en attente)
- Créer de nouvelles factures avec un formulaire complet mais simple (lignes dynamiques, calcul automatique TVA 18%, montants en FCFA)
- Gérer une liste de clients (nom, email, téléphone, adresse)
- Suivre les statuts des factures (brouillon, envoyée, payée, en retard)
- Configurer les paramètres de l'entreprise (nom, adresse, logo)
- Tout ce qu'une application SaaS de facturation classique inclurait.

### Stack technique

Le SaaS doit utiliser **Next.js 14 (App Router)**, **Supabase** pour la base de données et l'authentification, et **Tailwind CSS**. On déploiera sur **Vercel**.

### Flux de travail prévu

Je définirai l'UX via des captures d'écran, donc ne t'inquiète pas des détails de design pour l'instant. Le flux sera :

1. D'abord, on construira les fonctionnalités principales en utilisant des captures d'écran comme inspiration de design. Tu prendras le style de design des captures, et tu l'utiliseras pour construire toutes les pages connectées.
2. Ensuite, on le rendra interactif avec des données locales et on s'assurera que les routes fonctionnent.
3. Ensuite, on ajoutera la base de données et les tests avec Supabase.
4. Ensuite, on ajoutera l'authentification.
5. Ensuite, on fera une landing page.
6. Finalement, on fera un passage de bout en bout et on s'assurera que tout fonctionne, incluant le middleware d'authentification, la sécurité, les tests, etc., puis on déploiera et on retestera.

### Demande finale

Réfléchis extrêmement fort et génère un plan d'implémentation complet et détaillé. Une fois que tu en as développé un qui est solide, reviens ici et je te fournirai les captures d'écran d'inspiration.
