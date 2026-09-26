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

---

# Agent IA — assistant du Gérant (version 2, 2026-09-19)

Décisions prises en construisant l'agent. Contexte : `docs/cahier-des-charges-v2.md`.

## Exception à « aucun usage de la clé service role » : l'agent

**Contexte** : la décision plus haut interdit la clé service role dans le code applicatif. L'agent
agit sans session utilisateur (tâche planifiée) et doit écrire un journal que personne ne peut
altérer.

**Décision** : `createServiceClient()` (`src/lib/supabase/service.ts`) est utilisée par l'agent
(`src/lib/agent/`, `src/server/agent/boite.ts`) et par `/api/cron/relances`, **uniquement après
`assertRole("admin")`** dans chaque action. Les actions du Gérant sur les fiches et les logements
(`fiches-admin.ts`, `ft-admin.ts`) restent sur la session du Gérant, donc sous RLS.

**Conséquence** : pour l'agent, la RLS n'est plus la seule barrière. Compensations : un test échoue
si une action serveur est ajoutée sans exiger le rôle admin (`securite-roles.test.ts`), le journal
est verrouillé en base, et l'audit `test/securite/rls-audit.sql` reste rejouable. La décision
d'origine vaut toujours pour Conciergerie Premium.

## Deuxième exception à « aucun usage de la clé service role » : le guide voyageur

**Contexte** : le guide numérique par logement (`/guide/[id]`) est une page publique, pensée pour
être envoyée par lien à un voyageur — donc sans session utilisateur du tout, ni admin ni autre. La
RLS (réservée à l'admin) bloquerait toute lecture.

**Décision** : `createServiceClient()` y est utilisée aussi, mais avec un contrôle différent de
celui de l'agent (`assertRole("admin")` est impossible ici, faute de session) : la requête ne lit
jamais `secret_logement`, se limite au logement demandé (identifiant UUID, non devinable), n'affiche
que les logements au statut `actif`, et applique `masquerCodes` à chaque section avant affichage.

**Conséquence** : deux usages distincts de la clé de service coexistent, chacun avec son propre
contrôle applicatif documenté ici — pas de troisième sans une raison et un contrôle tout aussi
explicites.

## Troisième exception : le portail propriétaire

**Contexte** : même besoin que le guide voyageur — une page publique (`/proprietaire/[id]`), sans
session, pour qu'un propriétaire consulte ses logements par un lien privé.

**Décision** : `createServiceClient()` de nouveau, avec son propre contrôle : la requête ne
sélectionne jamais `proprietaire.notes` (usage interne), ne montre aucune donnée de réservation
(la table `reservation` est vide, aucun PMS ni iCal connecté à ce jour — mieux vaut ne rien afficher
qu'inventer), et se limite au propriétaire demandé par son identifiant.

**Conséquence** : trois usages documentés de la clé de service (agent, guide voyageur, portail
propriétaire), chacun listé ici avec son contrôle. Le prochain suivra la même règle.

## Assistant d'abord, agent autonome plus tard

**Décision** : l'assistant prépare un brouillon, le Gérant l'envoie lui-même ; toutes les tâches
sont au niveau « Propose ». **Pourquoi** : un assistant qui se trompe donne une mauvaise réponse,
un agent qui se trompe peut envoyer le mauvais message. L'autonomie se mérite tâche par tâche
(seuils du cahier d'origine) et n'est pas activée.

## Une colonne `activite` plutôt que deux schémas

**Contexte** : F&T et Premium doivent coexister avec un seul compte Gérant et un seul cœur d'agent.

**Décision** : une colonne `activite` sur `regle`, `fiche_connaissance`, `message_agent`, `action`,
`demande`, **sans valeur par défaut** (migration `0024`). Les tables de Premium ne sont pas touchées.

**Pourquoi pas de défaut** : un défaut `ft` aurait étiqueté « F&T » toute ligne Premium écrite par
oubli. Sans défaut, l'oubli devient une erreur immédiate.

## Les fiches sont chargées par le code, pas lues par le modèle

**Contexte** : le plan initial prévoyait un outil « lire les fiches ».

**Décision** : le code charge les fiches de l'activité (et du logement) choisies et les place dans
le prompt ; le modèle n'a que `proposer_reponse` et `escalader`. **Pourquoi** : le modèle ne peut
alors pas être amené à lire les fiches de l'autre activité ou d'un autre logement, et il y a un
appel de moins par message. Un second contrôle côté code écarte de toute façon une fiche hors
périmètre si la base en renvoyait une.

## Codes d'accès : hors des fiches, masqués avant le modèle, filtrés en sortie

**Contexte** : le cahier d'origine réserve les codes à une table chiffrée, « jamais injectée telle
quelle dans un message du modèle ». Une simple consigne du prompt ne suffit pas face à une
manipulation.

**Décision** : trois couches. (1) L'éditeur de fiches avertit quand une ligne ressemble à un code.
(2) Une telle ligne est masquée avant d'être donnée au modèle. (3) Un brouillon qui contient un code
est retiré et remplacé par une escalade. **Limite assumée** : l'heuristique peut masquer à tort une
ligne légitime ; l'assistant escalade alors, ce qui est sans danger. Le mot de passe wifi est traité
comme un code (cahier d'origine) : question ouverte dans la version 2.

## Données bancaires : masquées à l'entrée, avec clé de contrôle

**Contexte** : « aucune donnée bancaire ne transite par l'agent », et la page `/confidentialite`
affirme qu'aucune n'est stockée. Un message collé peut pourtant en contenir.

**Décision** : cartes (13 à 19 chiffres, clé de Luhn) et IBAN (modulo 97) sont remplacés par un
repère **avant l'enregistrement** dans `demande` et avant le modèle. La clé de contrôle évite de
masquer les numéros de téléphone ou de réservation ordinaires. Un numéro long qui passerait la clé
par hasard est masqué à tort : préférable à laisser fuir une vraie carte.

## Journal en écriture seule imposé par la base

**Décision** : un déclencheur (`0023`) refuse `update`, `delete` et `truncate` sur `action`, même
pour la clé de service. **Pourquoi** : « jamais modifiable » n'était qu'une convention (absence de
policy), que la clé de service contourne. **Conséquence** : un effacement RGPD à la demande d'une
personne devra désactiver ce déclencheur le temps de l'opération, puis le remettre.

## Fiches : une ligne par version, jamais de mise à jour en place

**Décision** : chaque modification, restauration ou ajout crée une nouvelle version ; l'unicité par
section et version (`0026`) fait échouer un enregistrement simultané au lieu de le dupliquer.
Restaurer une ancienne version crée une nouvelle version. « Chaque version est conservée »
(cahier d'origine).

## Chat public de prospection désactivé par défaut

**Contexte** : chaque message appelle un modèle payant, et la limite de débit est en mémoire donc
contournable sur Vercel (`SECURITY.md` §6).

**Décision** : `CHAT_PROSPECTION_ACTIF` doit valoir exactement `true`. Le garde est dans l'action
serveur (appelable directement, sans passer par l'écran), pas seulement sur la page. **Conséquence** :
la page est prérendue, changer la variable exige un nouveau déploiement.

## Un site, deux activités : page de choix et un thème par activité (2026-09-25)

*Couleurs revues le même jour : voir « Refonte visuelle » ci-dessous (F&T « Nuit en forêt », Premium « Marine & or »).*

**Contexte** : F&T (location courte durée) et Premium (conciergerie privée) partagent le même site
(décision du 2026-09-17). Maquettes : canevas « Conciergerie F&T — Accueil ».

**Décision du Gérant** : `/` est une page de choix (une moitié par activité) ; Premium passe à
`/premium`, F&T vit sous `/location`. Premium adopte la palette « Noir & or » (Cormorant +
Montserrat) et non « Marine & or », proposée dans les consignes du 2026-09-24. Aucun prix n'est
affiché sur la page de choix tant que les tarifs Premium restent provisoires. Le thème sombre
charbon + laiton n'est plus celui des pages publiques : il reste, pour l'instant, celui des espaces
connectés et de la connexion (choix d'un thème commun « à voir »).

**Mise en œuvre** : une seule liste de jetons de couleur, redéfinie par les classes `.theme-ft` et
`.theme-premium` posées par les layouts `(ft)` et `(premium)` (`globals.css`). Le vert forêt, jadis
réservé au bandeau final de Premium, devient la couleur de marque de F&T ; ce bandeau passe sur
le fond encre de « Noir & or ». Contenu : uniquement des textes de la maquette ou déjà validés ; le
parcours voyageur (« Je cherche un séjour ») reste caché tant que la réservation n'existe pas.

## Refonte visuelle : F&T « Nuit en forêt », Premium « Marine & or » (2026-09-25)

**Décision du Gérant** : F&T passe à la piste « Nuit en forêt » du canevas (vert nuit #1B241E,
crème #F3EDE2, terre cuite claire #E3A07A, Fraunces + Karla, logo clair). Premium passe à « Marine &
or » (bleu nuit #0E1A31, or #C9A24E, Bodoni Moda + Jost), affinée après une analyse ui-ux-pro-max :
bleu plus profond pour alterner les sections, or clair pour survols et mots en italique, sections
ivoire (`.theme-premium-clair`, or foncé #7A5812 pour rester lisible). Planches de référence :
rangée « Premium — refonte Marine & or » du canevas. Contrastes du texte ≥ 4,5 partout.

**Visuels** : sept photos d'ambiance libres de droits (licence Unsplash, crédits dans
`src/components/premium/photos.ts`), téléchargées avec l'accord du Gérant et servies depuis
`public/premium/` : aucun domaine d'images extérieur à autoriser dans la CSP. Elles illustrent des
univers, jamais un bien ou un partenaire réel. Aucune photo de banque d'images pour F&T : ses
visuels seront de vraies photos des logements. Icônes Lucide en trait fin doré, soleil Art déco,
filets, grain léger, apparition douce au défilement (coupée si le visiteur demande moins
d'animations, et sans effet sans JavaScript).

**Contenu** : la section témoignages vide devient « Nos engagements » (uniquement des faits de la
FAQ). La FAQ ne dit plus que le paiement passe par Stripe : il n'est pas encore branché.

## Espaces connectés en « Marine & or », dans un cadre commun (lot C1, 2026-09-25)

**Décision du Gérant** : tous les espaces connectés passent en « Marine & or », comme Premium et la
connexion. Le thème charbon + laiton disparaît : `:root` porte désormais « Marine & or », ce qui
habille aussi les menus déroulants et fenêtres affichés hors de l'enveloppe de la page. Jost
remplace Geist comme texte par défaut.

**Mise en œuvre** : un cadre commun (`src/components/espace/`) posé par chaque layout de rôle et
par « Mon compte » : barre du haut, menu selon le rôle (`navigation.ts`, testé), notifications,
menu du compte, menu mobile. Les notifications sont lues dans le cadre, donc présentes sur chaque
page ; une notification ouvre la demande qu'elle concerne (identifiant vérifié). Le formulaire de
demande passe de 8 à 4 étapes, les précisions facultatives étant regroupées. Choisir une option
d'une proposition crée la réservation : une confirmation est demandée avant.

**Polices** : un fichier par activité (`fonts.ts`, `fonts-ft.ts`, `fonts-erreurs.ts` sans
préchargement) et `experimental.cssChunking: "graph"` dans `next.config.ts`. Avec le réglage par
défaut, Turbopack rangeait les polices des deux activités dans un fichier CSS commun et chaque page
les préchargeait toutes. Vérifié dans `next-font-manifest.json` : F&T 4 fichiers de police,
Premium et espaces connectés 3, page de choix 6. Réglage expérimental : à revoir si une mise à jour
de Next le retire, et à surveiller (ordre du CSS) après chaque mise à jour.

## Espaces de l'équipe : concierge et Gérant (lot C2, 2026-09-26)

**Tableau de bord du Gérant** : il couvre les deux activités et commence par « À traiter »
(escalades et brouillons de la boîte de réception, nouveaux propriétaires F&T, demandes Premium
sans concierge). Il signale toute tâche de l'assistant qui n'est pas au niveau « Propose ».

**« Tout remettre en « Propose » »** : le « bouton unique » du cahier des charges (niveaux
d'autonomie). Il ne touche que les tâches F&T actives au-dessus de « Propose », crée une nouvelle
version de chaque règle et écrit une ligne de journal par tâche. Il demande une confirmation.

**Détail d'une demande Premium pour le Gérant** (`/admin/requests/[id]`) : en lecture seule. Le
suivi, les messages et les propositions restent l'affaire du concierge ; le Gérant voit tout
(la RLS l'y autorise déjà), notes internes comprises.

**Formulaires** : ceux de l'équipe s'envoient par `envoyerSansVider` plutôt que par l'attribut
`action`, que React vide même quand l'action renvoie une erreur (un message collé ou un brouillon
corrigé était perdu). Les statuts s'affichent en français (`components/espace/libelles.ts`, testé
contre les énumérations de la base) ; côté équipe, « En attente de votre réponse » devient « En
attente du client ».

## Formules Premium : comparaison, conseil et activation à la main (lot D, 2026-09-26)

**Décisions du Gérant** : les tarifs restant provisoires, les formules payantes affichent « Sur
demande » (Free : « Gratuit ») ; aucun délai de réponse chiffré (« sous 48 h », « sous 4 h » retirés,
« réponse prioritaire » gardée) ; le questionnaire « Quelle formule pour moi ? » conseille sans
rien enregistrer ; en attendant le paiement en ligne (lot F), le client demande une formule et le
Gérant l'active à la main, en facturant hors du site.

**Mise en œuvre** : `src/lib/forfaits.ts` est la seule description des formules (page publique,
comparaison, questionnaire, espaces client et Gérant). Un test vérifie qu'elle reprend les limites
et le concierge dédié de la table `plans` (`seed.sql`) et qu'aucun prix ni délai chiffré n'y
figure. « Historique complet » (Premium) et « Réponse dans l'ordre d'arrivée » ne sont pas repris :
rien ne les distingue réellement entre formules.

**Demande de formule sans migration** : la demande en cours est rangée dans
`client_profiles.preferences.demande_forfait` (colonne jsonb inutilisée jusque-là). Le client ne
modifie que sa ligne (RLS `client_profiles_update_own`) et ne peut rien activer : l'abonnement
(`subscriptions`) reste écrit par l'admin seul. Activer une formule crée un abonnement, clôt le
précédent (`cancelled`) et retire la demande ; repasser en Free supprime simplement le
rattachement (même règle que `quota.ts`). Chaque geste (demande, annulation, activation, clôture)
écrit une ligne de journal `activite = premium`. Une table dédiée pourra remplacer ce rangement
quand le paiement en ligne arrivera.

**À trancher plus tard** : la « réponse prioritaire » des formules payantes est affichée (FAQ,
accueil, comparaison) mais aucun code ne l'applique aux demandes.
