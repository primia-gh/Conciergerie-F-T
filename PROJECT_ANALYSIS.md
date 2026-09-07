# PROJECT_ANALYSIS.md — Audit initial

**Date de l'audit :** 2026-09-07
**Auditeur :** Claude (Lead Software Architect)

## 1. État actuel du repository

Le répertoire de travail (`C:\Users\33646\Nouveau dossier`) est **vide** :

- Aucun fichier, aucun dossier.
- Pas de dépôt Git initialisé.
- Aucun `package.json`, aucune configuration de framework, aucune dépendance.
- Aucune base de données, aucune variable d'environnement, aucun script.

**Conclusion : il n'y a rien à auditer sur le plan technique.** Ce n'est pas une migration ou une reprise de projet existant, c'est une création ex nihilo. Les sections « problèmes détectés » et « dette technique » de la méthode habituelle sont donc sans objet ici — je les remplace par une analyse des **risques projet** (section 4).

## 2. Ce qui manque (tout)

Concrètement, il faut créer, dans l'ordre :

1. Dépôt Git (le projet n'est pas versionné — premier prérequis avant toute écriture de code).
2. Squelette d'application (Next.js + TypeScript).
3. Connexion base de données (Postgres via Supabase).
4. Système d'authentification et RBAC.
5. Modèle de données (voir [DATABASE.md](DATABASE.md)).
6. Design system / composants de base.
7. Modules métier (Request, Proposal, Booking, Payment, Messaging, Notifications).
8. Tests, CI/CD, sécurité, déploiement.

Le détail séquencé est dans [ROADMAP.md](ROADMAP.md).

## 3. Architecture et stack proposées (résumé)

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour le détail et les comparatifs. Décision retenue en une phrase :

> **Next.js 15 (App Router, TypeScript) monolithique**, backend par Route Handlers + Server Actions, **Supabase** comme plateforme de données (Postgres + Auth + Storage + Realtime), **Drizzle ORM**, **Stripe** pour les paiements, **Resend** pour l'email, hébergement **Vercel**, CI/CD **GitHub Actions**.

Rationale principale : c'est une startup qui doit livrer un MVP crédible vite, avec une équipe probablement réduite. Chaque service géré (Supabase, Vercel, Stripe, Resend) en moins à opérer soi-même est un risque opérationnel en moins. L'architecture reste modulaire en interne (couche `/services` isolée) pour permettre d'extraire un backend NestJS séparé plus tard si la charge ou l'équipe grossit — ce n'est pas un choix qui enferme le projet.

## 4. Risques identifiés

| Risque | Type | Impact | Mitigation |
|---|---|---|---|
| Confusion fonctionnelle avec Drunken Monkey Conciergerie | Légal / IP | Élevé si copie de textes, visuels ou UX identique | Design system et copywriting 100% originaux dès la Phase 4 ; ne jamais réutiliser un contenu observé publiquement, seulement s'en inspirer pour la logique de parcours (voir contrainte explicite du brief) |
| RLS Postgres mal configurée + clé Supabase anon exposée côté client | Sécurité | Critique — fuite de données inter-clients | RBAC appliqué en **double couche** : vérification serveur (Route Handlers/Server Actions) **et** policies RLS Postgres restrictives par défaut (`deny by default`) |
| Paiement Stripe mal isolé (stockage de données bancaires) | Sécurité / Conformité PCI | Critique | Jamais de données carte en base ; uniquement Stripe Elements/Checkout + webhooks signés |
| Sur-ingénierie dès le MVP (microservices, mobile natif, IA autonome) | Produit / Delivery | Retard de mise sur le marché | Scope MVP strict (voir ROADMAP.md) ; PWA avant React Native ; IA en assistance humaine uniquement, ajoutée après le cœur métier |
| Absence de tests dès le départ | Qualité | Régressions silencieuses en prod | Tests écrits au fil de l'eau, phase par phase, pas en bloc final |
| RGPD non anticipé (export/suppression de données) | Conformité | Sanction légale, perte de confiance client | Modélisé dès le schéma DB (soft-delete, `deleted_at`, endpoints d'export) — voir DATABASE.md et SECURITY.md (à créer en Phase 14) |
| Statuts de `Request` gérés uniquement côté UI | Fonctionnel | Incohérence des données, statuts invalides | Machine à états côté serveur avec table de transitions autorisées (voir ARCHITECTURE.md §7) |

## 5. Décisions techniques actées à ce stade

- **Un seul dépôt** (pas de monorepo Turborepo) pour le MVP — inutile tant qu'il n'y a qu'une app web/PWA. Réévaluer si React Native est lancé.
- **Supabase comme plateforme de données** plutôt que Postgres auto-hébergé + Socket.io — évite d'opérer un serveur WebSocket dédié (Realtime Supabase le remplace), ce qui permet de rester 100% déployable sur Vercel (serverless).
- **Drizzle plutôt que Prisma** — proche du SQL, compatible edge runtime, migrations lisibles et auditables (important pour la revue de sécurité).
- **Auth via Supabase Auth** plutôt que Auth.js autonome — évite de dupliquer un système d'identité alors que RLS a justement besoin de `auth.uid()` nativement.
- **IA en option, jamais décisionnaire** — aucune automatisation IA ne change un statut, n'envoie une proposition ou ne déclenche un paiement sans validation humaine.

## 6. Prochaines étapes

1. Valider ce diagnostic et les choix de stack avec vous (voir résumé de fin de message).
2. Initialiser le dépôt Git + squelette Next.js (Phase 1 infra).
3. Provisionner le projet Supabase et appliquer le schéma initial (Phase 2/3).
4. Construire l'authentification + RBAC (Phase 5) avant tout écran métier.

Aucun code applicatif n'a été écrit à ce stade, conformément à la consigne : audit et architecture d'abord.
