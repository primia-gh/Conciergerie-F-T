# ROADMAP.md — Séquence de développement du MVP

Le brief initial contient deux découpages en phases qui se recoupent (§4 « méthode de travail » en 15 phases, §38 « ordre de développement » en 20 étapes). Pour éviter toute ambiguïté, ce document fait autorité et fusionne les deux en une séquence unique. **Statut actuel : M0 à M9 et M11 à M15 terminés (2026-09-07) ; M10 (paiements Stripe) sauté temporairement
faute de compte Stripe — à reprendre dès que les clés API sont disponibles. Réserve de vérification
documentée sur le temps réel de M7. Le cycle complet NEW → COMPLETED a été bouclé de bout en bout.
Sécurité durcie (RLS, en-têtes, rate limiting) et RGPD fonctionnel de bout en bout (export +
suppression de compte) vérifiés en conditions réelles (M15). M16 en cours : performance
(pagination, garde-fous de requête, loading states) et PWA (manifeste + icônes) terminés et
vérifiés ; le déploiement production reste NOT IMPLEMENTED, en attente des informations d'accès
Vercel de l'utilisateur (action difficilement réversible sur un système externe).**

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

## M9 — Réservations (Booking) ✅
- Création automatique du `booking` (statut `pending`) au moment où le client accepte une
  proposition — étend `respondToProposal` (M8) plutôt que d'ajouter une étape manuelle séparée,
  fidèle au « automatique » du brief §13.
- **Décision RLS notable :** la policy `bookings_write_concierge_admin` de M1 ne permettait qu'au
  concierge/admin d'écrire dans `bookings`, pas au client qui accepte pourtant sa propre
  proposition. Un trigger DB aurait aussi résolu le problème, mais aurait introduit un ordre de
  dépendance fragile entre la mise à jour de `requests.status` et le déclenchement du trigger sur
  `proposals`. Choix retenu : une policy `bookings_insert_client` étroitement scopée (migration
  `0008`) — le client ne peut créer une réservation que pour sa propre demande, vers une option
  réellement marquée `is_selected = true`. Reste cohérent avec le reste du code (aucun trigger
  ailleurs dans le projet hormis `handle_new_user`).
- `ACCEPTED → BOOKING` chaîné dans la même transition que `WAITING_CLIENT → ACCEPTED`.
- Actions concierge (`src/server/bookings/actions.ts`) : `confirmBooking` (`BOOKING → CONFIRMED`)
  et `completeBooking` (`CONFIRMED → COMPLETED`), verrou optimiste sur le statut du booking comme
  pour `assignRequest` (M6).
- Composant partagé `BookingCard` affiché sur les deux pages de détail (client en lecture seule,
  concierge avec les actions de confirmation).
- **DoD vérifié en conditions réelles**, cycle complet NEW → COMPLETED bouclé pour la première fois
  sur une demande de test : acceptation d'une proposition → `bookings` créé (`pending`) et visible
  immédiatement côté client ET concierge → confirmation (`CONFIRMED`) → finalisation (`COMPLETED`).
  Historique des 7 transitions vérifié par requête SQL directe, cohérent de bout en bout. ✔️

## M10 — Paiements (Stripe) ⏸️ SAUTÉ (bloqué)
**Non implémenté.** Nécessite un compte Stripe réel (mode test suffit) et ses clés API
(`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`), que je ne
peux pas créer moi-même (identité, coordonnées bancaires du porteur du projet). Développement
repris sur M12 en attendant ces informations. Le contenu ci-dessous reste le plan prévu, inchangé.

- Paiement (acompte ou total) via Stripe Checkout/Payment Intents.
- Webhooks signés, mise à jour du statut de paiement et du booking.
- Remboursement, facture.
- **DoD :** un paiement de test Stripe (mode test) passe de `pending` à `succeeded`, le webhook met à jour la base, une facture est accessible.

## M11 — Notifications ✅ (canal email non vérifiable — clé manquante)
- Dispatcher central (`src/server/notifications/dispatcher.ts`) couvrant les 10 événements du
  brief §23. Canal in-app toujours écrit ; canal email best-effort via Resend, jamais simulé —
  sans `RESEND_API_KEY` (non configurée, même blocage que Stripe pour M10), le dispatcher logue
  clairement `NOT IMPLEMENTED` et n'insère aucune ligne "email" mensongère.
- Ajout de `profiles.email` (migrations `0009`/`0010`), synchronisé par le trigger
  `handle_new_user` — nécessaire pour cibler un envoi email sans clé service role (absente ici).
- Migration `0011` : policy RLS `notifications_insert_authenticated` — la policy M1 ne permettait
  l'écriture que via service role (absente). Simplification assumée et documentée dans la
  migration : tout utilisateur connecté peut créer une notification pour n'importe quel
  destinataire (pas de fuite de données, juste un risque de spam par un compte compromis — à
  revoir en M14 si besoin d'un contrôle plus strict).
- Câblé dans les actions existantes : `createRequest` (M5) → `REQUEST_CREATED`, `assignRequest`
  (M6) → `REQUEST_ASSIGNED`, `sendMessage` (M7) → `MESSAGE_RECEIVED` au bon destinataire (résolu
  dynamiquement, pas toujours le client), `sendProposal`/`respondToProposal` (M8) →
  `PROPOSAL_CREATED`/`ACCEPTED`/`REJECTED`, `confirmBooking`/`completeBooking` (M9) →
  `BOOKING_CONFIRMED`/`REQUEST_COMPLETED`. `PAYMENT_SUCCESS` et `BOOKING_CANCELLED` restent
  **NOT IMPLEMENTED** (M10 non fait, pas de flux d'annulation construit).
- Cloche de notifications (`NotificationsBell`) sur les dashboards client et concierge : compteur
  non lus, liste, marquage lu au clic. Rendu au chargement de page (pas de Realtime ici, pour ne
  pas ajouter une seconde fonctionnalité non vérifiable dans cet environnement en plus de M7).
- **DoD vérifié en conditions réelles** pour le canal in-app : création d'une demande → badge « 1 »
  sur la cloche du client, libellé correct, marquage lu persistant en base. Notification
  cross-rôle également vérifiée (le concierge prend en charge → le CLIENT reçoit la notification,
  pas l'acteur). Le volet email du DoD (« déclenche un email ») reste non vérifiable sans clé
  Resend — comportement honnête confirmé par le log `NOT IMPLEMENTED`, pas par un envoi simulé.

## M12 — Administration ✅ (scope volontairement resserré)
- Nav admin minimale (`src/app/(admin)/layout.tsx`) : seulement Dashboard et Demandes — les autres
  entrées du brief §22 (Clients, Concierges, Propositions, Réservations, Partenaires, Services,
  Abonnements, Paiements, Factures, Analytics, Settings, Logs) n'ont pas de page réelle derrière
  elles à ce stade ; les ajouter aurait créé des liens morts (interdit par le brief §34).
- Dashboard (`src/app/(admin)/admin/dashboard/`) : 9 stat tiles (demandes totales/ouvertes/
  terminées, clients + actifs, concierges, réservations, temps moyen de prise en charge calculé
  depuis `request_status_history`) + 2 graphiques en barres horizontales (demandes par catégorie,
  demandes par jour sur 14 jours). CA et satisfaction affichés `—` avec la raison exacte (Stripe
  non fait, pas d'avis clients) plutôt que masqués ou inventés.
- Graphiques construits en HTML/CSS simple (`HorizontalBarChart`) après consultation du skill
  `dataviz` : une seule teinte (accent) pour une comparaison de grandeur entre catégories/jours —
  pas une couleur par barre, pour éviter l'anti-pattern « rainbow chart » identifié par le skill.
  Pas de librairie de graphiques ajoutée, inutile pour 2 graphiques à barres simples.
- Page `/admin/requests` : liste de toutes les demandes (RLS admin déjà permissive depuis M1),
  filtres statut/catégorie/concierge par formulaire GET natif (fonctionne sans JS).
- **DoD vérifié en conditions réelles** avec les vraies données accumulées depuis M5-M11 (aucune
  donnée fictive) : les KPIs correspondent exactement à l'état réel de la base (3 demandes, 2
  ouvertes, 1 terminée, etc., vérifié manuellement), le filtre `status=COMPLETED` réduit
  correctement la liste de 3 à 1 résultat. ✔️

## M13 — Partenaires (mini-CRM) ✅
- CRUD partenaires admin (`src/app/(admin)/admin/partners/`) : liste, création, édition. Statuts
  `active`/`inactive`/`pending`, catégorie, contact, commission, notes — champs du brief §16.
- Le formulaire d'édition et de création partagent le même composant (`PartnerForm`) ; l'édition
  lie l'action serveur via `updatePartner.bind(null, id)` plutôt que dupliquer le formulaire.
- Étape M8 étendue : `addProposalOption` accepte désormais un `partnerId` optionnel ; le formulaire
  concierge propose un menu déroulant des partenaires **actifs uniquement** (RLS déjà permissive
  depuis M1, aucune migration nécessaire).
- **DoD vérifié en conditions réelles** : un partenaire (« Spa Zenitude ») créé via le vrai
  formulaire admin apparaît immédiatement dans le menu déroulant du concierge lors de la création
  d'une option de proposition ; sélectionné, confirmé par requête SQL directe
  (`proposal_options.partner_id` correctement lié à « Spa Zenitude »). ✔️

## M14 — Abonnements ✅ (facturation Stripe hors scope, cf. M10)
- Plans FREE/PREMIUM/VIP/PRIVATE déjà seedés depuis M1 (`plans`). La gestion Stripe
  Billing/Customer Portal reste liée au blocage M10 (pas de compte Stripe) — un client sans
  ligne `subscriptions` est donc implicitement rattaché au plan FREE, **sans ligne factice créée**
  pour éviter de simuler un abonnement qui n'a jamais transité par un paiement réel.
- Nouveau module `src/server/subscriptions/quota.ts` (`getClientQuota()`) : résout le plan actif
  du client (via `client_profiles.subscription_id` → `subscriptions.plans`, ou FREE par défaut),
  compte les `requests` créées depuis le 1ᵉʳ du mois calendaire (UTC), et calcule
  `canCreateRequest` (`request_limit` à `null` = illimité).
- Double point d'application, cohérent avec le reste du code (jamais uniquement côté UI) :
  - `createRequest` (`src/server/requests/actions.ts`) revérifie le quota côté serveur avant
    l'insertion, et renvoie une erreur explicite nommant le plan et la limite si dépassé —
    impossible de contourner le blocage en soumettant directement le formulaire.
  - La page d'entrée de l'assistant (`src/app/(client)/client/requests/new/page.tsx`) affiche un
    écran « Limite atteinte » à la place du wizard quand le quota est dépassé, avec liens vers le
    dashboard et `/#tarifs`.
  - Le dashboard client (`src/app/(client)/client/dashboard/page.tsx`) affiche en permanence
    l'usage réel (`X/Y demande(s) ce mois-ci` ou « demandes illimitées »), avec un lien
    « passer à un forfait supérieur » quand le quota est atteint ; le bouton « Faire une demande »
    passe en variante secondaire (non désactivé au sens HTML — un `<Link>` habillé en bouton ne
    peut pas porter `disabled`, l'application réelle du blocage reste côté serveur).
- **DoD vérifié en conditions réelles** : `dev-client@example.invalid` (plan FREE, limite seedée à
  2 demandes/mois) avait déjà 3 demandes créées ce mois-ci en base. Connecté dans le navigateur :
  le dashboard affiche bien « Forfait Free — 3/2 demande(s) ce mois-ci — passer à un forfait
  supérieur » ; en cliquant sur « Faire une demande », l'écran « LIMITE ATTEINTE » s'affiche
  (« Votre forfait Free autorise 2 demandes par mois... ») avec les deux liens fonctionnels
  (dashboard, `/#tarifs`) au lieu du wizard. `next typegen`, `tsc --noEmit`, `lint` et `build`
  passent sans erreur. ✔️

## M15 — Sécurité, RGPD, tests ✅ (scope détaillé ci-dessous, compromis assumés et documentés)

### Sécurité
- Audit via l'advisor sécurité Supabase (`get_advisors`) : durci `handle_new_user()` (migration
  0012, `EXECUTE` retiré à tous les rôles — fonction déclenchée uniquement par trigger, jamais
  censée être appelable en RPC), plus `WARN` résiduel que `current_app_role()` (nécessaire aux
  policies RLS, déjà accepté depuis M1) et "Leaked Password Protection" (réglage dashboard Supabase,
  hors SQL, listé en action manuelle dans SECURITY.md §10).
- Bucket `request-attachments` restreint côté Storage (migration 0014) : 10 Mo max, types
  image/PDF uniquement — pas seulement une vérification applicative contournable.
- Rate limiting sur signIn/signUp (`src/server/security/rate-limit.ts`), en mémoire — limite
  mono-instance explicitement documentée (SECURITY.md §6), remplacement par Redis identifié avant
  prod multi-instance.
- En-têtes de sécurité globaux (`next.config.ts`) : CSP, X-Frame-Options, nosniff, Referrer-Policy,
  Permissions-Policy, HSTS — actifs en production uniquement (Turbopack/HMR dev cassé sinon,
  constaté en conditions réelles). Compromis assumé sur `script-src`/`style-src`
  (`unsafe-inline` plutôt qu'un nonce — voir DECISIONS.md, tentative de CSP stricte à nonce
  documentée puis abandonnée après avoir cassé l'hydratation React même en build de production réel).
- Trigger `handle_profile_soft_delete` (migration 0013, SECURITY DEFINER) : bannit
  `auth.users.banned_until` à la suppression de compte.

### RGPD
- Export de données (`exportMyData`, `/account`) : JSON complet, scope explicite sur l'utilisateur
  courant (profil, demandes, messages, réservations, notifications, pièces jointes, propositions,
  fiche partenaire).
- Suppression de compte (`deleteMyAccount`, `/account`, modal de confirmation "tapez SUPPRIMER") :
  anonymise les champs personnels de `profiles`, bannit le compte Auth, déconnecte, redirige vers
  `/compte-supprime`.
- Politique de confidentialité publiée (`/confidentialite`), liée depuis le footer et depuis
  `/account` — identité du responsable de traitement marquée `[À COMPLÉTER]` (pas d'entité légale
  réelle inventée) plutôt que des informations fictives.
- Page `/account` accessible aux 4 rôles, lien "Mon compte" ajouté sur chacun des 4 dashboards.

### Tests
- Vitest installé (`vitest.config.ts`), script `npm run test`, intégré à la CI GitHub Actions.
- 16 tests unitaires sur la logique pure : `state-machine.test.ts` (transitions valides/invalides,
  statuts terminaux), `quota.test.ts` (résolution de plan, calcul d'usage, cas illimité),
  `rate-limit.test.ts` (fenêtre glissante, isolation par clé, expiration).
- **Scope volontairement limité** : pas de tests d'intégration DB automatisés (pgTAP) ni de suite
  e2e (Playwright) — chaque phase M0-M14 a été vérifiée manuellement en conditions réelles contre
  le vrai projet Supabase (détaillé dans chaque section ci-dessus), ce qui constitue la couverture
  réelle du MVP, mais ne remplace pas une suite automatisée rejouable en CI. Identifié comme item
  de suite pour un futur cycle plutôt que simulé par des tests superficiels.

### Documentation
- `SECURITY.md`, `API.md`, `DEPLOYMENT.md`, `DECISIONS.md` rédigés (racine du dépôt).

- **DoD vérifié en conditions réelles** : `npm run test` (16/16 verts), `tsc --noEmit`, `lint` et
  `build` propres ; un vrai build de production (`next build && next start`) testé au navigateur
  confirme que les en-têtes de sécurité (CSP incluse) n'empêchent pas l'hydratation React ni les
  Server Actions (login testé avec succès sous CSP stricte). Parcours RGPD complet testé de bout en
  bout avec un compte réel : export de données exécuté sans erreur, suppression de compte
  effectuée, `deleted_at`/`banned_until` vérifiés en base, tentative de reconnexion post-suppression
  correctement rejetée ("Identifiants invalides."). Bug réel découvert et corrigé pendant ce test :
  `/compte-supprime` et `/confidentialite` étaient absents de l'allowlist du middleware
  (`PUBLIC_PATHS`), ce qui redirigeait un visiteur déconnecté vers `/login` au lieu de la page
  attendue — corrigé dans `src/lib/supabase/middleware.ts`. ✔️

## M16 — Performance, PWA, déploiement production 🚧 (performance + PWA faits, déploiement en attente)

### Performance
- Pagination réelle sur `/admin/requests` (seule vue listant potentiellement l'intégralité de
  l'historique de la plateforme) : `PAGE_SIZE=20`, `.range()` + `count: "exact"`, liens
  Précédent/Suivant préservant les filtres actifs — testé en conditions réelles avec 28 lignes
  injectées temporairement (page 1/2 → 20 résultats, page 2/2 → 8, bouton "Suivant" un vrai
  `<button disabled>` en fin de liste, jamais un lien désactivé factice) puis nettoyées.
- Garde-fous `.limit()` ajoutés aux listes qui n'en avaient pas (dashboard client, dashboard
  concierge ×2, liste partenaires admin) — ce sont des vues "aperçu récent", pas des vues de
  parcours exhaustif, un plafond suffit sans UI de pagination dédiée.
- `loading.tsx` ajouté aux 4 espaces de rôle (`client`, `concierge`, `admin`, `partner`) : Next.js
  peut désormais streamer un état de chargement pendant que le Server Component récupère ses
  données, au lieu de bloquer tout le rendu.
- Polices déjà auto-hébergées via `next/font/google` depuis M0 (pas d'appel runtime vers
  `fonts.googleapis.com`, zéro CLS lié aux polices).
- Pas d'optimisation d'image nécessaire à ce stade : l'application ne rend actuellement aucune
  image (`<img>`/`next/image`) nulle part — les photos de proposition (`proposal_options.photos`,
  JSONB) existent en base mais leur affichage n'est pas encore implémenté (hors scope M1-M15).

### PWA
- `src/app/manifest.ts` : manifeste Web App (nom, icônes, `theme_color`, `display: standalone`).
  `start_url: "/"` fonctionne pour les 4 rôles car `/` redirige désormais un utilisateur déjà
  connecté vers son propre dashboard (`src/app/(marketing)/page.tsx`) plutôt que d'afficher la
  page marketing dans tous les cas.
- Icônes générées dynamiquement (`next/og`, identité visuelle originale — même palette que
  `opengraph-image.tsx`, jamais empruntée à un tiers) : `icon.tsx` (favicon 32×32),
  `apple-icon.tsx` (180×180), et une route paramétrée `icons/[size]/route.tsx` pour les tailles du
  manifeste (192, 512, 512 maskable avec zone de sécurité réduite).
- **Bug réel trouvé et corrigé pendant la vérification** : `/manifest.webmanifest` était absent de
  l'allowlist du middleware et redirigeait vers `/login` — un navigateur/OS ne peut pas détecter
  une PWA installable si son manifeste n'est pas accessible sans authentification. Corrigé dans
  `src/lib/supabase/middleware.ts`.
- **DoD vérifié en conditions réelles** : `/manifest.webmanifest` renvoie un JSON valide et
  accessible sans session ; `/icons/512` et `/icons/512?maskable=1` rendus et vérifiés visuellement
  au navigateur (logo correctement centré, marge de sécurité respectée en mode maskable). Test
  d'installation PWA complet (bannière "Ajouter à l'écran d'accueil", Lighthouse PWA audit) non
  effectué dans cet environnement sandboxé (pas de vrai appareil mobile/Chrome complet
  disponible) — à vérifier manuellement par l'utilisateur avant le lancement réel, ou lors du
  déploiement (M16 suite).

### Déploiement production — **NOT IMPLEMENTED, en attente d'informations**
Nécessite un compte Vercel (et éventuellement un second projet Supabase de production), voir
DEPLOYMENT.md pour le runbook complet. Action difficilement réversible affectant un système
externe : ne sera exécutée qu'avec la participation directe de l'utilisateur (connexion à son
compte Vercel, choix du domaine) — je ne peux ni créer de compte en son nom, ni me connecter à sa
place à un service OAuth tiers.

- **DoD (performance + PWA) :** ✔️ — voir ci-dessus.
- **DoD (déploiement) :** en attente.

## Post-MVP (explicitement hors scope initial)
- IA (classification automatique, résumés, assistant concierge) — ajoutée seulement après que le cœur métier (M0-M16) fonctionne réellement en production, jamais en remplacement d'une décision humaine.
- Intégration cartographique (Mapbox) pour la sélection de lieu.
- SMS (Twilio) si le besoin se confirme à l'usage.
- React Native (si la PWA montre ses limites côté usage mobile réel).
- Commission automatisée / Stripe Connect pour les paiements partenaires.

## Prochaine action immédiate

Si vous validez cette architecture, la prochaine étape concrète est **M0** : initialisation du dépôt Git, squelette Next.js, et provisionnement Supabase. Rien de plus tant que ce n'est pas confirmé — conformément à la consigne de ne pas lancer le développement des gros modules avant validation.
