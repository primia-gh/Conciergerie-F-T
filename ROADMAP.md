# ROADMAP.md — Séquence de développement du MVP

Le brief initial contient deux découpages en phases qui se recoupent (§4 « méthode de travail » en 15 phases, §38 « ordre de développement » en 20 étapes). Pour éviter toute ambiguïté, ce document fait autorité et fusionne les deux en une séquence unique. **Statut actuel : aucune phase démarrée — le repository est vide.**

Règle de progression (rappel du brief §4 et §34) : une phase n'est marquée acquise que si elle est **implémentée, testée, corrigée et documentée** — jamais déclarée terminée sur la base d'un code non fonctionnel, d'un bouton factice ou d'un TODO caché.

## M0 — Infrastructure & fondations
- Initialisation du dépôt Git, structure de dossiers (voir ARCHITECTURE.md §9).
- Squelette Next.js 15 + TypeScript + Tailwind CSS.
- Provisionnement du projet Supabase (dev + staging).
- `.env.example` avec toutes les variables (voir §32 du brief).
- CI de base (lint, typecheck) sur GitHub Actions.
- **Definition of Done :** `npm run dev` sert une page d'accueil vide, CI verte sur un commit trivial.

## M1 — Base de données
- Schéma Drizzle complet (voir DATABASE.md).
- Migrations initiales + seed des `categories` et `plans`.
- Policies RLS sur toutes les tables métier.
- **DoD :** migrations rejouables de zéro, policies vérifiées par un test d'intégration qui confirme qu'un client A ne peut pas lire les données d'un client B.

## M2 — Authentification & RBAC
- Signup/login/logout via Supabase Auth (email/password, magic link).
- Table `profiles` + attribution de rôle à l'inscription.
- Guards RBAC serveur (`assertRole`) + middleware de session.
- **DoD :** les 4 rôles peuvent se connecter et sont redirigés vers leur espace respectif ; un client ne peut pas accéder à une route admin (test e2e).

## M3 — Design system
- Composants de base : Button, Input, Textarea, Select, Modal, Card, Badge, Avatar, Dropdown, Toast, Tabs, Table, Pagination, DatePicker, FileUpload.
- Charte graphique originale (couleurs, typographie, spacing).
- **DoD :** Storybook ou page `/design-system` interne listant tous les composants avec leurs variantes.

## M4 — Landing page
- Sections définies au brief §19, textes 100% originaux.
- SEO de base (metadata, sitemap, robots, Open Graph).
- **DoD :** Lighthouse SEO/Performance > 90 sur la home.

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
