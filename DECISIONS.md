# DECISIONS.md — Journal des décisions d'architecture

Log des décisions non triviales prises pendant le développement, avec le contexte et le
raisonnement — pour qu'une décision qui semble étrange en lisant le code seul (« pourquoi ne pas
avoir fait X, plus simple ? ») ait sa réponse ici plutôt que d'être redécouverte par essai-erreur.

## Drizzle pour le schéma, Supabase JS pour les requêtes runtime

**Contexte** : Drizzle ORM est utilisé pour définir le schéma et générer les migrations
(`drizzle-kit generate`), mais aucune requête applicative ne passe par le client Drizzle (`db`).

**Décision** : toutes les lectures/écritures runtime utilisent `@supabase/ssr` (`createClient()`),
qui respecte la RLS Postgres par requête. Le client Drizzle nécessiterait `DATABASE_URL` (mot de
passe direct Postgres), qui bypasserait la RLS — un bug applicatif exposerait alors les données de
tous les utilisateurs, pas seulement de l'appelant.

**Conséquence** : Drizzle reste un outil d'auteur de schéma/migrations uniquement ; toute nouvelle
requête doit être écrite avec le client Supabase, jamais `db.select()...`.

## RBAC en double couche (application + RLS), jamais un seul

**Contexte** : le rôle applicatif pourrait être vérifié uniquement côté serveur (Server Actions),
en faisant confiance à la couche applicative pour ne jamais requêter les mauvaises lignes.

**Décision** : chaque table métier a des policies RLS *deny by default*, en plus des vérifications
`assertRole()`/`requireRole()`. Redondant par construction.

**Conséquence** : un oubli de `assertRole()` dans une nouvelle action ne suffit **pas**, seul, à
exposer des données d'un autre utilisateur — la RLS bloque quand même. Coût : chaque nouvelle table
doit systématiquement recevoir ses policies avant d'être considérée "faite" (jamais de table RLS
désactivée en production).

## Aucun usage de `SUPABASE_SERVICE_ROLE_KEY` dans le code applicatif

**Contexte** : la clé service role bypasserait la RLS, ce qui simplifierait certaines requêtes
(ex. lire l'email d'`auth.users` directement plutôt que le dupliquer sur `profiles`).

**Décision** : ne jamais l'utiliser côté application. Là où une opération privilégiée est
nécessaire (créer un profil au signup, bannir un compte à la suppression), on utilise un trigger
Postgres `SECURITY DEFINER` plutôt qu'un appel API avec la clé service role.

**Conséquence** : certaines opérations qu'une clé service role rendrait triviales (révocation
immédiate de session à la suppression de compte, voir SECURITY.md §8) restent des limitations
documentées plutôt que résolues par un raccourci qui aurait affaibli la garantie RLS partout
ailleurs.

## Machine à états explicite pour `requests.status`

**Contexte** : le statut d'une demande pourrait être un simple champ texte mis à jour librement.

**Décision** : `src/server/requests/state-machine.ts` centralise les transitions valides
(`TRANSITIONS`), et `assertValidTransition()` est appelé avant toute mutation de statut, y compris
depuis l'admin. `applyTransitionChain()` (`src/server/proposals/actions.ts`) permet à une seule
action utilisateur de valider plusieurs sauts (ex. `WAITING_CLIENT` → `ACCEPTED` → `BOOKING`), en
loggant chaque saut individuellement dans `request_status_history`.

**Conséquence** : impossible d'atteindre un statut incohérent (ex. `COMPLETED` sans être passé par
`CONFIRMED`) même par erreur de code futur — la fonction lève au lieu d'écrire silencieusement un
état invalide.

## Verrouillage optimiste plutôt que transactions explicites

**Contexte** : deux concierges pourraient cliquer "prendre en charge" sur la même demande
simultanément (`assignRequest`), ou deux clics rapides pourraient dupliquer une confirmation de
réservation.

**Décision** : les updates critiques incluent l'état attendu dans la clause `WHERE`
(`.eq("status", "NEW").is("concierge_id", null)`) et vérifient qu'une ligne a bien été retournée.
Si aucune ligne n'est retournée, un autre appel a gagné la course — l'action renvoie une erreur
utilisateur claire plutôt qu'un état corrompu.

**Conséquence** : pas besoin de transactions Postgres explicites ni de verrous distribués pour ces
cas ; le pattern est simple et déjà éprouvé (RLS + `UPDATE ... WHERE ... RETURNING`).

## RLS additionnelle pour l'insertion de `bookings` par le client, plutôt qu'un trigger

**Contexte** : à l'acceptation d'une proposition (M9), le client doit pouvoir créer une ligne
`bookings` — les policies initiales (M1) ne l'autorisaient que pour concierge/admin.

**Décision retenue** : ajouter une policy RLS INSERT dédiée (migration 0008) plutôt qu'un trigger
sur `proposals` qui créerait la réservation automatiquement.

**Pourquoi pas le trigger** : le trigger aurait dû s'exécuter après la mise à jour de
`requests.status` vers `ACCEPTED`, créant une dépendance d'ordonnancement fragile entre deux
statements (update de `proposals` puis de `requests`) — la policy RLS, elle, s'évalue au moment de
l'insertion explicite côté application, sans dépendance d'ordre.

## `notify()` : dégradation honnête plutôt que simulation

**Contexte** : sans `RESEND_API_KEY` configurée, l'envoi d'email transactionnel est impossible dans
cet environnement.

**Décision** : le canal `in_app` est toujours écrit (source de vérité de la cloche de
notifications) ; le canal `email` est *best-effort* — sans clé API, la fonction logue un
`console.warn` explicite et **ne crée aucune ligne `notifications` de type email**, plutôt que de
simuler un envoi réussi.

**Conséquence** : le suivi de l'état réel des notifications (`notifications` table) reste fiable —
une ligne `channel='email'` signifie toujours qu'un envoi a réellement été tenté et confirmé par
Resend, jamais une fiction.

## Quota d'abonnement : pas de ligne `subscriptions` factice pour le plan FREE

**Contexte** : M14 doit limiter le nombre de demandes par mois selon le plan. Le plus simple aurait
été de créer une ligne `subscriptions` FREE à chaque signup.

**Décision** : un client sans ligne `subscriptions` est implicitement sur FREE
(`src/server/subscriptions/quota.ts`) ; aucune ligne n'est créée tant qu'aucun paiement Stripe réel
n'a eu lieu (M10, non branché).

**Conséquence** : la table `subscriptions` ne contient que des abonnements réels, jamais un mélange
d'abonnements réels et de lignes de convenance — important le jour où M10 sera branché et où cette
table deviendra la source de vérité de la facturation.

## RGPD : soft-delete + trigger de bannissement, pas de purge complète

**Contexte** : le droit à l'effacement (M15) pourrait être implémenté par une suppression physique
complète de toutes les données liées à l'utilisateur.

**Décision** : `deleteMyAccount()` anonymise les champs personnels de `profiles`
(nom/téléphone/email) et pose `deleted_at`, ce qui déclenche un trigger `SECURITY DEFINER`
(migration 0013) bannissant le compte Auth (`banned_until = 'infinity'`). Les données métier liées
(`requests`, `messages`, `bookings`) sont **conservées**, dépersonnalisées.

**Pourquoi pas une purge complète** : ces données concernent aussi d'autres utilisateurs (le
concierge assigné, les échanges avec lui) et servent de preuve de transaction — les supprimer
romprait l'historique d'un tiers non consentant à cette suppression, en plus de contredire les
obligations de conservation comptable pour les réservations facturées.

## CSP : `unsafe-inline` sur `script-src`/`style-src` plutôt qu'un nonce

**Contexte** : la recommandation officielle Next.js pour l'App Router (streaming RSC) est une CSP à
nonce par requête + `'strict-dynamic'`.

**Décision** : testée en conditions réelles (`next build && next start`), cette approche bloque
**tous** les scripts Next.js (y compris les chunks same-origin légitimes) — le mécanisme de
propagation automatique du nonce vers les scripts injectés par le framework n'a pas pu être établi
de façon fiable dans le temps imparti. Repli sur `'unsafe-inline'`, documenté comme compromis
explicite (voir SECURITY.md §5) plutôt que shippé silencieusement comme une CSP "stricte" qui ne
l'est pas vraiment.

**Conséquence** : item de durcissement identifié pour un futur cycle, pas fermé définitivement.
