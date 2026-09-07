# ROADMAP.md — Séquence de développement du MVP

Le brief initial contient deux découpages en phases qui se recoupent (§4 « méthode de travail » en 15 phases, §38 « ordre de développement » en 20 étapes). Pour éviter toute ambiguïté, ce document fait autorité et fusionne les deux en une séquence unique. **Statut actuel : M0 à M8 terminés, avec une réserve de vérification documentée sur le temps réel de M7 (2026-09-07). Prochaine étape : M9 (réservations).**

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

## M5 — Espace client : création de demande (cœur du produit) ✅
- Wizard de création de demande en 8 étapes exactement conformes au brief §10 (catégorie,
  titre+description, date/heure, lieu, budget, préférences, pièces jointes, confirmation) —
  `src/app/(client)/client/requests/new/`. Navigation par étapes en `useState` côté client,
  soumission finale via Server Action (`src/server/requests/actions.ts`), validation Zod serveur.
- Machine à états `Request` formalisée dans `src/server/requests/state-machine.ts` (table de
  transitions + `assertValidTransition`), réutilisable par les phases suivantes (M6+).
- Ajout du champ `requests.preferences` (texte, nullable) — l'étape 6 du wizard n'avait pas de
  colonne dédiée dans le schéma initial ; corrigé avant toute donnée réelle (migration `0005`).
- Stockage des pièces jointes : bucket Supabase Storage privé `request-attachments` + policies RLS
  sur `storage.objects` scopées par `request_id` (migration `0006`). Chaque demande créée écrit
  aussi une entrée `request_status_history` (`NEW`, acteur = client).
- Dashboard client (M2) mis à jour : affiche désormais la vraie liste des demandes du client
  (titre, catégorie, statut) au lieu du placeholder NOT IMPLEMENTED ; le CTA « Faire une demande »
  est maintenant fonctionnel.
- CRUD profil client / préférences de compte (distinct des préférences par demande) **reporté** :
  pas de cas d'usage réel avant que le concierge (M6) et les propositions (M8) existent pour
  exploiter ces préférences ; simple champ `client_profiles.preferences` déjà en base (M1).
- **DoD vérifié en conditions réelles** (navigateur + Supabase live, compte `dev-client`) : les 8
  étapes se remplissent et se naviguent correctement, l'écran de confirmation récapitule les
  bonnes valeurs, la soumission crée réellement la ligne `requests` (statut `NEW`), une entrée
  `request_status_history` associée, et redirige vers le dashboard qui affiche la demande créée.
  Confirmé aussi par requête SQL directe (`history_count: 1`, `last_status: NEW`). ✔️
- Écart de test assumé : l'upload de pièce jointe n'a pas été vérifié interactivement dans le
  navigateur (limite de l'outillage de test automatisé pour simuler un vrai choix de fichier) —
  le bucket et les policies RLS ont été vérifiés par SQL direct, et le code d'upload suit l'API
  standard `supabase.storage.upload()`. À confirmer manuellement ou via test automatisé en M15.

## M6 — Espace concierge : dashboard opérationnel ✅
- Dashboard concierge (`src/app/(concierge)/concierge/dashboard/`) : section « Nouvelles demandes »
  (statut `NEW`, non assignées, visibles de tous les concierges) et « Mes demandes » (assignées à
  l'utilisateur courant).
- Page de détail d'une demande (`src/app/(concierge)/concierge/requests/[id]/`), conçue pour être
  étendue en M7 plutôt que reconstruite : détails, pièces jointes (URLs signées, 10 min), historique
  complet des transitions, notes internes.
- Prise en charge (`assignRequest` dans `src/server/requests/actions.ts`) : transition `NEW` →
  `ASSIGNED` via `assertValidTransition`, verrou optimiste (`WHERE status='NEW' AND concierge_id
  IS NULL`) pour éviter qu'un même NEW soit pris par deux concierges simultanément.
- Notes internes (`src/server/messages/actions.ts`, `addInternalNote`) : réutilise la table
  `messages` (`is_internal_note = true`) déjà modélisée en M1, pas de nouvelle table.
- Comportement RLS observé et assumé : un concierge ne voit ni le nom du client, ni l'historique
  d'une demande `NEW` tant qu'il ne l'a pas prise en charge (policies M1 déjà strictes) — cohérent
  avec le principe de moindre exposition, les deux redeviennent visibles après assignation.
- **DoD vérifié en conditions réelles** (navigateur + Supabase live, compte `dev-concierge`) : la
  demande créée en M5 apparaît dans « Nouvelles demandes », la prise en charge fait passer le
  statut à `ASSIGNED`, révèle le nom du client, ajoute une entrée d'historique visible immédiatement
  à l'écran ; une note interne ajoutée est persistée et affichée avec horodatage. Confirmé par
  requête SQL directe (`is_internal_note: true`). ✔️

## M7 — Messagerie temps réel ⚠️ (implémenté, réserve de vérification documentée)
- Composant partagé `MessageThread` (`src/components/features/message-thread.tsx`), utilisé à la
  fois par la page de détail client (nouvellement créée, `src/app/(client)/client/requests/[id]/`)
  et concierge — pas deux implémentations séparées.
- Souscription Supabase Realtime (`postgres_changes` sur `messages`, filtrée par `request_id`) ;
  activation de la table dans la publication `supabase_realtime` (migration `0007`, absente par
  défaut sur un nouveau projet Supabase — corrigé avant tout test).
- Séparation stricte messages visibles (`is_internal_note=false`) / notes internes déjà garantie
  par les policies RLS de M1, réutilisées telles quelles.
- Indicateurs lu/non lu : `markThreadRead` marque comme lus les messages reçus (pas envoyés par
  soi-même) à l'ouverture du fil — vérifié en base (`read_at` correctement posé côté destinataire
  uniquement, pas côté expéditeur).
- **Ce qui est vérifié en conditions réelles :** l'envoi d'un message via le vrai formulaire
  fonctionne (Server Action `sendMessage`), la lecture respecte la séparation client/concierge
  visible vs notes internes, le marquage lu/non lu est correct en base.
- **Ce qui n'a PAS pu être vérifié, et pourquoi (ne pas ignorer cette limite en poursuivant) :**
  le push en temps réel sans rechargement n'a pas pu être observé dans cet environnement — le
  navigateur de prévisualisation utilisé pour les tests bloque les connexions WebSocket sortantes
  (confirmé par un test direct : une connexion `wss://` brute vers le projet Supabase échoue
  immédiatement, de la même façon que le WebSocket HMR de Next.js échoue dans ce même bac à sable).
  Un message inséré directement en base pendant qu'un onglet concierge était ouvert sur la demande
  n'est apparu qu'après rechargement manuel, jamais spontanément. Le code suit fidèlement l'API
  documentée de Supabase Realtime et la donnée est correcte une fois rechargée — mais le
  comportement "sans rechargement", qui est la substance même du DoD de cette phase, reste à
  confirmer dans un environnement avec accès réseau WebSocket réel (poste local du porteur de
  projet, ou déploiement Vercel en M16). Ne pas considérer cette phase comme définitivement actée
  tant que ce point précis n'a pas été observé par un humain ou un test automatisé hors de ce
  bac à sable.

## M8 — Propositions ✅
- Création de plusieurs options par le concierge (nom, description, prix, adresse, conditions,
  avantages, photos en URLs — pas d'upload dédié, cohérent avec le choix de ne pas construire de
  pipeline média supplémentaire pour un champ non bloquant du DoD).
  `src/server/proposals/actions.ts`, éditeur dédié
  `src/app/(concierge)/concierge/requests/[id]/proposals/[proposalId]/`.
- Un seul geste utilisateur (« Créer une proposition ») traverse plusieurs statuts intermédiaires
  du brief (`ASSIGNED → IN_PROGRESS → RESEARCHING → PROPOSAL_DRAFT`, ou `REJECTED → RESEARCHING →
  PROPOSAL_DRAFT` en cas de relance) via `applyTransitionChain`, qui journalise chaque saut
  individuellement dans `request_status_history` — fidèle à la machine à états sans multiplier les
  clics côté concierge.
- Envoi au client (`sendProposal`, `PROPOSAL_DRAFT → PROPOSAL_SENT → WAITING_CLIENT`), bloqué tant
  qu'aucune option n'existe.
- Comparaison client (`src/app/(client)/client/requests/[id]/proposal-comparison.tsx`) : options
  affichées côte à côte, choix d'une option (`WAITING_CLIENT → ACCEPTED`) ou refus global
  (`→ REJECTED`, avec le commentaire de refus renvoyé comme message plutôt que perdu — réutilise
  M7 au lieu d'ajouter un champ dédié).
- **DoD vérifié en conditions réelles** (navigateur + Supabase live, comptes `dev-concierge` /
  `dev-client`, sur la demande créée en M5) : le concierge crée une proposition avec deux options
  réelles (« Le Jardin Secret » 85€, « Bistrot des Amis » 55€), l'envoie ; le client voit les deux
  options côte à côte et en choisit une. Confirmé par requête SQL directe : `requests.status =
  'ACCEPTED'`, `proposals.status = 'accepted'`, l'option choisie a `is_selected = true`, l'autre
  `false`. Historique complet des 8 transitions vérifié à l'écran. ✔️

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
