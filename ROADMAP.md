# ROADMAP.md — Séquence de développement du MVP

Le brief initial contient deux découpages en phases qui se recoupent (§4 « méthode de travail » en 15 phases, §38 « ordre de développement » en 20 étapes). Pour éviter toute ambiguïté, ce document fait autorité et fusionne les deux en une séquence unique. **Statut actuel : M0 à M4 terminés (2026-09-07). Prochaine étape : M5 (création de demande côté client).**

Règle de progression (rappel du brief §4 et §34) : une phase n'est marquée acquise que si elle est **implémentée, testée, corrigée et documentée** — jamais déclarée terminée sur la base d'un code non fonctionnel, d'un bouton factice ou d'un TODO caché.

## M0 — Infrastructure & fondations ✅
- Initialisation du dépôt Git, structure de dossiers (voir ARCHITECTURE.md §9).
- Squelette Next.js 16 + TypeScript + Tailwind CSS (v15 visé initialement ; v16 stable sortie entre-temps, voir ARCHITECTURE.md §11).
- Projet Supabase provisionné : `concierge-app-dev` (eu-west-3, palier gratuit).
- `.env.example` avec toutes les variables (voir §32 du brief) ; `.env.local` renseigné localement (non commité).
- CI de base (lint, typecheck, build) sur GitHub Actions.
- **Definition of Done :** `npm run dev` sert une page d'accueil neutre marquée NOT IMPLEMENTED, lint/typecheck/build passent localement. ✔️

## M1 — Base de données ✅
- Schéma Drizzle complet, 18 tables (voir DATABASE.md), migrations `0000`–`0003` appliquées sur `concierge-app-dev`.
- Seed des `categories` (10) et `plans` (4, prix placeholder à valider avant lancement réel).
- RLS activée et policies écrites sur les 18 tables métier (`src/server/db/migrations/0002_rls_policies.sql`).
- **DoD :** migrations rejouables de zéro (fichiers SQL versionnés) ✔️. Isolation vérifiée par un test manuel direct en base (deux profils client simulés via `request.jwt.claims` + `auth.uid()`) : client A voit sa propre demande (1 ligne), client B ne la voit pas (0 ligne) — fixtures nettoyées après test. Un test d'intégration automatisé (Vitest/pgTAP) reste **NOT IMPLEMENTED** et est prévu en Phase M15 avec le reste de la suite de tests.
- Point de vigilance documenté : la fonction `current_app_role()` (SECURITY DEFINER, nécessaire pour éviter la récursion RLS) reste exécutable par le rôle `authenticated` — c'est requis pour que les policies fonctionnent, l'accès anonyme a été révoqué (migration `0003`).

## M2 — Authentification & RBAC ✅
- Signup/login/logout via Supabase Auth (email/password). Magic link non implémenté au MVP
  (email/password suffit pour le lancement ; réévaluer si la friction d'onboarding le justifie).
- Trigger DB `handle_new_user` : attribue toujours le rôle `client` à l'inscription publique
  (jamais lu depuis les métadonnées fournies par l'utilisateur — sinon élévation de privilège
  possible). Comptes concierge/admin/partner provisionnés hors self-service pour l'instant.
- Guards RBAC serveur : `requireRole()` (redirige, pour layouts) et `assertRole()` (lève une
  erreur, pour Server Actions) dans `src/server/auth/guards.ts`.
- Rafraîchissement de session via `src/proxy.ts` (convention Next.js 16, ex-`middleware.ts`).
- 4 espaces protégés créés (`/client`, `/concierge`, `/admin`, `/partner`), chacun avec un guard
  de layout ; seul `/client/dashboard` a un contenu réel (les 3 autres sont des placeholders
  NOT IMPLEMENTED en attendant leurs phases respectives M6/M12/M13).
- **DoD vérifié en conditions réelles** (navigateur + projet Supabase réel, pas de simulation) :
  les 4 comptes de test (`seed-dev-accounts.sql`) se connectent et atterrissent chacun sur leur
  propre espace ; un client qui tente `/admin/dashboard` est renvoyé vers `/client/dashboard` ;
  un utilisateur non connecté qui tente une route protégée est renvoyé vers `/login` ; la
  déconnexion invalide bien la session. ✔️
- Bug détecté et corrigé pendant la vérification : `getCurrentProfile()` typait les données
  Supabase (snake_case réel) avec le type Drizzle (camelCase), donnant un `profile.firstName`
  `undefined` silencieux. Le type `Profile` de `session.ts` reflète maintenant les vraies clés
  renvoyées par PostgREST.
- Point d'environnement documenté : les comptes de test insérés directement en base doivent avoir
  les colonnes `*_token`/`*_change` à `''` et non `NULL`, sinon GoTrue échoue au login avec
  « Database error querying schema » (cause réelle : erreur de scan Go sur NULL).

## M3 — Design system ✅
- Charte graphique originale définie dans `src/app/globals.css` : palette encre/papier chaude
  + accent pin (vert profond), aucune valeur copiée d'un tiers. Typographie Fraunces (titres) +
  Geist Sans (interface) via `next/font/google`.
- 16 composants de base dans `src/components/ui/` : Button, Input, Textarea, Select, Modal, Card,
  Badge, Avatar, Dropdown, Toast (+ Toaster/`useToast`), Tabs, Table, Pagination, DatePicker,
  FileUpload, Label. Les primitives comportementales complexes (Modal, Dropdown, Tabs, Toast,
  Select, Avatar) s'appuient sur Radix UI (non stylé, accessible) plutôt que d'être réinventées —
  aucune identité visuelle empruntée, uniquement du comportement/accessibilité.
- Composants métier (RequestCard, ProposalCard, BookingCard, ChatMessage) **volontairement non
  créés** : ils seront construits avec leurs modules respectifs (M5, M7, M8, M9) plutôt qu'en
  avance sans cas d'usage réel.
- **DoD :** page interne `/design-system` (protégée par l'auth, `noindex`) listant tous les
  composants avec leurs variantes ✔️. Vérifié en navigateur (couleurs, typographie, formulaires,
  table, pagination interactive) ; le composant Modal a été vérifié par inspection DOM/CSSOM
  directe (position, opacité, z-index) suite à un artefact de capture d'écran de l'outil de
  preview sans rapport avec le code (page défilée en dehors de la zone capturée).

## M4 — Landing page ✅
- Page déplacée dans `src/app/(marketing)/` conformément à ARCHITECTURE.md §9.
- Sections du brief §19 implémentées avec des textes 100% originaux (aucune reprise de tagline
  ou de copywriting d'un tiers) : Hero, Comment ça marche, Services, Membership, Témoignages,
  FAQ, CTA, Footer.
- **Écart assumé vis-à-vis du brief :** la section Témoignages ne contient aucun faux avis. Le
  service n'ayant pas encore de client réel, inventer des témoignages serait une donnée factice
  présentée comme réelle (interdit par le brief §34). Un message honnête explique l'absence de
  contenu ; à remplacer par de vrais retours après les premières missions.
- SEO de base : `metadata` (title template + `metadataBase`), `robots.ts`, `sitemap.ts`, image
  Open Graph générée dynamiquement (`next/og`, texte + couleurs de marque — aucune photo/asset
  externe utilisé).
- Le nom de marque reste un placeholder générique (« Conciergerie Premium ») dans toute la copie :
  le choix d'un nom définitif (dépôt de marque, domaine) est une décision business qui revient au
  porteur du projet, pas une décision technique à figer unilatéralement.
- Bug corrigé pendant l'implémentation : le proxy (`src/lib/supabase/middleware.ts`) bloquait
  `/robots.txt`, `/sitemap.xml` et l'image Open Graph derrière la connexion — ces routes SEO
  doivent rester publiques pour les robots d'indexation, sans quoi le référencement serait
  cassé silencieusement. Ajouté à la liste des chemins publics.
- **DoD :** build de production propre, `/robots.txt` et `/sitemap.xml` accessibles sans
  authentification (vérifié), FAQ accessible au clavier (`aria-expanded` bascule correctement).
  Audit Lighthouse formel **NOT IMPLEMENTED** — nécessite un déploiement accessible publiquement
  (Vercel), reporté à la Phase M16 (déploiement) où l'outillage de mesure de performance est déjà
  prévu.

## M5 — Espace client : profil & création de demande
- CRUD profil client, préférences.
- Wizard de création de demande en 8 étapes (brief §10).
- Machine à états `Request` côté serveur (ARCHITECTURE.md §5).
- **DoD :** un client crée une demande de bout en bout, elle apparaît en base avec statut `NEW`, historisée.

## M6 — Espace concierge : dashboard opérationnel
- Liste des demandes (nouvelles, urgentes, en cours, en attente client).
- Prise en charge d'une demande (`NEW` → `ASSIGNED`).
- Notes internes.
- **DoD :** un concierge prend en charge une demande créée en M5, le statut et l'historique se mettent à jour.

## M7 — Messagerie temps réel
- Messages client ↔ concierge sur une demande, via Supabase Realtime.
- Séparation messages visibles / notes internes.
- Indicateurs lu/non lu, horodatage.
- **DoD :** un message envoyé par le client apparaît en temps réel côté concierge sans rechargement de page (testé manuellement + test d'intégration sur l'API).

## M8 — Propositions
- Création de plusieurs options par le concierge (nom, description, photos, prix, adresse, conditions).
- Envoi au client, comparaison, acceptation/refus.
- **DoD :** un client compare 2 options et en accepte une, ce qui fait passer la demande en `ACCEPTED`.

## M9 — Réservations (Booking)
- Création automatique d'un `Booking` à l'acceptation d'une proposition.
- Statuts `pending`/`confirmed`/`cancelled`/`completed`.
- **DoD :** l'acceptation d'une option en M8 crée un booking visible côté client et concierge.

## M10 — Paiements (Stripe)
- Paiement (acompte ou total) via Stripe Checkout/Payment Intents.
- Webhooks signés, mise à jour du statut de paiement et du booking.
- Remboursement, facture.
- **DoD :** un paiement de test Stripe (mode test) passe de `pending` à `succeeded`, le webhook met à jour la base, une facture est accessible.

## M11 — Notifications
- Dispatcher d'événements (liste brief §23).
- Canaux email (Resend) et in-app (Realtime) au MVP ; SMS (Twilio) marqué `NOT IMPLEMENTED` tant que non branché.
- **DoD :** la création d'une demande déclenche un email de confirmation et une notification in-app.

## M12 — Administration
- Back-office : utilisateurs, concierges, demandes, propositions, réservations, catégories, paiements.
- KPIs et graphiques de base (brief §17).
- **DoD :** un admin voit la liste de toutes les demandes du système avec filtres par statut/catégorie/concierge.

## M13 — Partenaires (mini-CRM)
- CRUD partenaires (statuts `active`/`inactive`/`pending`).
- Association d'un partenaire à une option de proposition.
- **DoD :** un concierge sélectionne un partenaire existant lors de la création d'une option de proposition.

## M14 — Abonnements
- Plans FREE/PREMIUM/VIP/PRIVATE, gestion Stripe Billing/Customer Portal.
- Limitation du nombre de demandes selon le plan.
- **DoD :** un client sur le plan FREE atteint sa limite de demandes et voit un message clair l'invitant à passer au plan supérieur.

## M15 — Sécurité, RGPD, tests
- Audit de sécurité complet (checklist brief §26), rate limiting, validation serveur systématique.
- RGPD : export de données, suppression de compte (soft-delete), politique de confidentialité.
- Couverture de tests : unitaires (services), intégration (API/DB), e2e (parcours critiques listés brief §27).
- Rédaction de `SECURITY.md`, `API.md`, `DEPLOYMENT.md`, `DECISIONS.md`.
- **DoD :** suite de tests verte en CI, checklist sécurité passée en revue, RGPD fonctionnel de bout en bout.

## M16 — Performance, PWA, déploiement production
- Core Web Vitals, cache, pagination, lazy loading.
- Manifest PWA installable.
- Déploiement production Vercel + monitoring.
- **DoD :** l'app est installable en PWA, déployée en production, avec un pipeline CI/CD qui bloque le merge si les tests échouent.

## Post-MVP (explicitement hors scope initial)
- IA (classification automatique, résumés, assistant concierge) — ajoutée seulement après que le cœur métier (M0-M16) fonctionne réellement en production, jamais en remplacement d'une décision humaine.
- Intégration cartographique (Mapbox) pour la sélection de lieu.
- SMS (Twilio) si le besoin se confirme à l'usage.
- React Native (si la PWA montre ses limites côté usage mobile réel).
- Commission automatisée / Stripe Connect pour les paiements partenaires.

## Prochaine action immédiate

Si vous validez cette architecture, la prochaine étape concrète est **M0** : initialisation du dépôt Git, squelette Next.js, et provisionnement Supabase. Rien de plus tant que ce n'est pas confirmé — conformément à la consigne de ne pas lancer le développement des gros modules avant validation.
