# Feuille de route — F&T et Premium sur un même site

*2026-09-24 · complète `docs/cahier-des-charges-v2.md`. Rien ici n'est encore construit.*

## Décisions du Gérant (2026-09-24)

- **Un seul site, deux activités**, avec un sélecteur visible en haut de chaque page pour passer
  de l'une à l'autre (maquette : canevas « Conciergerie F&T — Accueil », planche « Sélecteur »).
- **F&T garde son identité** : crème `#F6F1E8`, forêt profonde `#2E3B32`, sauge `#4A5D4F`,
  terre cuite `#A94F32`, texte `#1F2A22` ; polices Fraunces (titres) et Karla (texte) ; logo : la clé.
- **Premium change de couleurs** : trois palettes proposées (Marine & or, Noir & or, Prune &
  champagne), choix en attente.
- **F&T reprend le fonctionnement de GuestLucky pour le Gérant, en l'améliorant** : l'outil est
  construit pour son propre usage.

## Principe technique du sélecteur

- Deux entrées sur le même site : `/` et les pages F&T d'un côté, `/premium` et ses pages de l'autre.
  Les espaces connectés existants (client, concierge, admin, partenaire) ne changent pas d'adresse.
- Chaque activité applique son propre thème (variables de couleurs et polices) à ses pages.
  Le thème sombre actuel de Premium n'est plus le thème global du site.
- Le sélecteur est un vrai lien (accessible au clavier, `aria-current` sur l'activité en cours).
- Page d'accueil par défaut : **F&T** (activité qui génère déjà des revenus). À confirmer.

## Blocages techniques, à lever dans cet ordre

1. **Base de données.** `concierge-app-prod` est en pause (`INACTIVE`) ; `concierge-app-dev` est
   active et contient toutes les migrations (0000 à 0026) mais seulement des données de test.
   Cause probable : l'offre gratuite de Supabase met en pause un projet sans activité pendant
   quelques jours, et limite à deux projets actifs (aujourd'hui `najarena` et `concierge-app-dev`).
   Décision attendue du Gérant (voir options plus bas). Ensuite : vérifier dans Vercel que
   `NEXT_PUBLIC_SUPABASE_URL` pointe vers la base retenue, et garder la tâche planifiée quotidienne
   qui touche la base, pour éviter une nouvelle mise en pause.
2. **Publier la branche `v2-assistant-gerant`** sur `master`, une fois la base de production prête
   (sinon les pages F&T tomberaient en erreur en ligne).
3. **Clé Anthropic** : à créer par le Gérant sur console.anthropic.com, à ajouter dans Vercel et
   dans `.env.local` (jamais dans le code ni dans le chat). Puis `npm run eval:securite`.
4. **Pages légales** : mentions légales (obligatoires), CGU, CGV. Informations nécessaires :
   raison sociale, forme juridique, SIRET, adresse, directeur de la publication, hébergeur (Vercel).
5. **Premium : paiement Stripe et e-mails (Resend)** : comptes à créer par le Gérant, puis branchement.
6. **Accès Vercel de l'assistant** : l'outil connecté n'a pas le droit de lire les réglages du projet
   (erreur 403). À ré-autoriser si l'on veut que l'assistant vérifie les variables lui-même.

### Options pour la base de données

| Option | Ce que ça fait | Coût | Limite |
|---|---|---|---|
| A. La base actuelle de dev devient la production | Aucune migration à rejouer ; le site pointe vers elle | Gratuit | Plus de base de test séparée ; retirer les comptes de test |
| B. Réactiver la production et y rejouer les migrations 0015–0026 | Garde deux bases distinctes | Gratuit, mais il faut mettre en pause un autre projet (limite de deux actifs) | Une base se remettra en pause si elle reste inactive |
| C. Passer Supabase en offre payante | Plus de mise en pause, plus de limite de deux projets | Abonnement mensuel | Coût fixe avant tout revenu |

## Fonctionnalités, par ordre de rentabilité

### F&T (façon GuestLucky, en mieux pour le Gérant)

1. **Acquisition de propriétaires** : page propriétaires, formulaire d'estimation (rappel sous 24 h),
   suivi des prospects dans l'admin. *Chaque propriétaire signé = commission récurrente.*
   Le chat de prospection existe déjà (désactivé).
2. **Réservation directe sur le site** : calendriers synchronisés (iCal Airbnb/Booking d'abord),
   pages logements, demande de réservation puis paiement en ligne. *Évite les commissions des plateformes.*
3. **Ventes additionnelles dans le guide voyageur** (départ tardif, ménage en cours de séjour,
   panier d'accueil, transferts). *Marge directe ; le guide `/guide/[id]` existe déjà.*
4. **Assistant de messagerie en service réel** (clé Anthropic, vraies fiches, mesure sur 50 brouillons).
   *Permet de gérer plus de logements sans embaucher.*
5. **Espace propriétaire avec réservations, revenus et relevé mensuel**. *Fidélise les propriétaires
   et sert d'argument de vente.* Dépend du point 2 (données de réservation).
6. **Avis** : demande d'avis après un séjour réussi, brouillon de réponse aux avis publiés.
   *Meilleur classement sur les plateformes, donc plus de réservations.*
7. **Ménages** : planning, attribution, checklist photo (rouvre la décision « photos hors périmètre »).
8. **Conformité** : taxe de séjour, factures, exports comptables.

### Premium

1. **Paiement des abonnements (Stripe)** — sans lui, aucune formule ne peut être encaissée.
2. **E-mails de notification (Resend)**.
3. **Contenus réels** : photographie de marque, premiers témoignages (jamais inventés).

## Ce qui reste à décider

- Option de base de données (A, B ou C).
- ~~Palette Premium~~ : **Noir & or** (Gérant, 2026-09-25).
- ~~Page d'accueil par défaut~~ : **page de choix** (Gérant, 2026-09-25).
- Thème des espaces connectés : garder le sombre actuel ou un thème clair commun (« à voir »).
