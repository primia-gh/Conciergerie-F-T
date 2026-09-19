# Cahier des charges — version 2 : l'assistant du Gérant

*2026-09-19 · complète et, en cas de conflit, remplace `cahier-des-charges.md` (version d'origine, conservée telle quelle).*

## Pourquoi une version 2

Le cahier d'origine décrit une plateforme complète en cinq phases (chat public, PMS, WhatsApp,
ménages, relevés…), écrite en supposant que le site n'existait pas encore et qu'il n'y avait
qu'une seule activité. Trois faits l'ont contredit :

- le site [conciergerie-f-t.vercel.app](https://conciergerie-f-t.vercel.app) est **déjà en ligne** et
  sert une autre activité, **Conciergerie Premium** (abonnement pour particuliers) ;
- le Gérant **gère déjà des logements** en location courte durée (**F&T**) : ce n'est pas un projet ;
- l'objectif immédiat est **un agent pour lui-même**, pas un produit à vendre.

Conseil retenu : viser le niveau le plus simple qui règle le problème (voir « Niveaux » plus bas).

## L'objectif

Un **assistant du Gérant**, commun à ses deux activités. Le Gérant colle un message reçu (voyageur,
propriétaire, client Premium…) ; l'assistant prépare un **brouillon de réponse** à partir des fiches
de l'activité concernée ; le Gérant relit, corrige, puis **envoie lui-même**. Tout est journalisé.

**Rien ne part automatiquement.** Toutes les tâches sont au niveau 1 (« Propose »). L'autonomie
(niveaux 2 et 3 du cahier d'origine) reste à mériter tâche par tâche, avec les seuils du cahier
(95 % de brouillons validés sans correction sur 50 cas), et n'est pas encore activée.

## Ce qui change par rapport au cahier d'origine

| Sujet | Cahier d'origine | Version 2 |
|---|---|---|
| Périmètre | Agent multi-interlocuteurs, cinq phases | Assistant du Gérant, brouillons validés à la main |
| Activités | Une seule (F&T) | Deux, sur un même site et un même compte Gérant, distinguées par une colonne `activite` (`ft`, `premium`, `commun`) |
| Premier canal | Chat public du site | Message collé par le Gérant dans une boîte de réception |
| Chat public de prospection | Livrable de la phase 1 | Construit mais **désactivé par défaut** (limite de débit inefficace sur Vercel, appel à un modèle payant) |
| Fiches | Lues par l'agent | Chargées **par le code**, jamais demandées par le modèle : il ne peut pas lire les fiches de l'autre activité ni d'un autre logement |
| Codes d'accès | Table chiffrée `secret_logement` | Jamais dans une fiche. Une ligne de fiche qui ressemble à un code est masquée avant le modèle ; un brouillon qui en contient est retiré |
| Données bancaires | « Ne transitent pas par l'agent » | Numéros de carte et IBAN masqués **avant** l'enregistrement et avant le modèle |
| Journal | « Jamais modifiable » | Imposé **en base** par un déclencheur (aucun update, delete ni truncate) |
| Hypothèse « le site ne reçoit pas de visiteurs » | Prise faute d'information | Fausse : le site est en ligne (voir CLAUDE.md) |

## Niveaux d'autonomie (inchangés)

1. **Propose** : l'assistant rédige, rien ne part sans le Gérant. *C'est le niveau de toutes les tâches aujourd'hui.*
2. **Agit après validation** : l'action est prête, elle attend un clic.
3. **Agit seul** : l'action part, elle est retrouvée dans le journal.

Deux tâches du chat de prospection (`reponse_offre_prospect`, `relance_prospect_48h`) sont réglées
sur « agit seul » dans la table `regle` (héritage du lot L1). Le chat est coupé ; la relance à 48 h
(tâche planifiée `/api/cron/relances`) n'a pas été coupée : elle ne concerne que les prospects
existants qui ont laissé un e-mail, et n'appelle pas le modèle.

## Architecture

- **Une activité = une étiquette, pas un autre projet.** Chaque règle, fiche, message, ligne de
  journal et demande porte son `activite`. Les tables de Premium ne sont jamais touchées.
- **Une mission = un cas d'usage** : son activité, ses outils, son prompt, ses textes de repli
  (`src/lib/agent/missions/`). Missions existantes : `prospect_ft` (chat public, désactivé) et
  `assistant_gerant_ft` / `assistant_gerant_premium`.
- **L'assistant n'a que deux outils** : `proposer_reponse` et `escalader`. Ni envoi, ni lecture de la
  base, ni écriture. Tout ce qu'il rend est validé par le code (langue parmi les six, catégorie
  connue, longueur bornée) ; hors protocole, le code escalade lui-même en « doute ».
- **Le message reçu est une donnée** : jamais dans le prompt système, balisé, balises piégées retirées.
- **Accès** : réservé au rôle admin (le Gérant), vérifié dans chaque action **et** par les règles
  d'accès de la base. L'agent écrit par la clé de service côté serveur, après ce contrôle.
- **Fiches** : versionnées (une nouvelle version à chaque modification, jamais de mise à jour en
  place), sections fixes par activité, un logement F&T n'est utilisable qu'une fois **activé**, ce
  qui exige les quatre sections obligatoires (accès, équipements, règles, dépannage).

Détail des tables : `DATABASE.md` §2 bis. Décisions et leurs raisons : `DECISIONS.md`. Sécurité :
`SECURITY.md` §11. Exploitation : `docs/exploitation-agent.md`.

## Ce qui est construit (branche `v2-assistant-gerant`)

| Étape | Contenu |
|---|---|
| 1 | Chat public de prospection désactivé par défaut |
| 2 | Migrations : `activite`, table `demande`, journal verrouillé (0022, 0023) |
| 3 | Agent par missions, activité explicite partout |
| 4 | Mission « assistant du Gérant » (deux outils, garde-fous) |
| 5 | Boîte de réception `/admin/boite` : brouillon, validation, escalade, journal |
| 6 | Fiches `/admin/fiches` : sections, versions, restauration, logements, activation, choix du logement dans la boîte, « ajouter cette information à la fiche » |
| 7 | Tests de sécurité : 15 manipulations, 9 lectures croisées, rôles, audits SQL ; trois failles corrigées |
| 8 | Cette documentation |

## Critères d'acceptation de la version 2

Comme dans le cahier d'origine, une phase n'est **acceptée** que sur des **cas réels**. État :

- [x] Un message collé produit un brouillon dans la langue reçue, à partir des seules fiches de l'activité choisie — *testé automatiquement ; à vérifier avec le vrai modèle*
- [x] Une question absente des fiches est escaladée, jamais inventée — *idem*
- [x] Rien n'est envoyé par l'application — *par construction (aucun outil d'envoi)*
- [x] Un code d'accès ou une donnée bancaire ne sort jamais dans un brouillon — *testé automatiquement, y compris contre un modèle simulé qui obéit à la manipulation*
- [x] Chaque étape est visible dans le journal avec l'activité et la règle appliquée — *testé*
- [x] Le journal est immuable — *vérifié en base (dev)*
- [x] Les règles d'accès de la base ne laissent passer que l'admin — *audit SQL, 16 tables sur 16 (dev)*
- [ ] Les 15 manipulations sont refusées **par le vrai modèle** — *`npm run eval:securite`, nécessite une clé Anthropic : non fait*
- [ ] 50 brouillons réels relus par le Gérant, part validée sans correction mesurée — *non fait ; conditionne toute autonomie*
- [ ] Les écrans ont été utilisés connecté par le Gérant — *non fait (les tests n'ont pas de session)*
- [ ] Migrations `0015`–`0026` appliquées sur la base de **production** — *non fait, voir « Questions ouvertes »*

## Questions ouvertes

- [ ] **Quelle base alimente le site en ligne ?** `concierge-app-prod` est en pause (`INACTIVE`) et ne répond pas (vérifié le 2026-09-19) ; les migrations de l'agent n'existent que sur `concierge-app-dev`, qui ne contient que des comptes et demandes de test. Deux cas possibles : le site est configuré sur la production en pause (ses fonctions avec connexion ne marchent alors plus), ou sur la base de dev (il n'a alors aucun vrai client). Non tranché : la lecture des variables Vercel est refusée à l'outil. À lire dans Vercel (Settings → Environment Variables → `NEXT_PUBLIC_SUPABASE_URL`) avant tout déploiement de la branche.
- [ ] **Sections de fiche Premium** (services et abonnement, questions fréquentes, ce que Premium ne fait pas) : proposition non validée par le Gérant, modifiable dans `src/lib/agent/fiches-modele.ts`.
- [ ] **Mot de passe wifi dans une fiche ?** Le cahier d'origine le classe parmi les secrets ; il est donc signalé, et l'assistant renvoie au Gérant. À confirmer.
- [ ] **Les tâches les plus chronophages du Gérant** et **les canaux** par lesquels arrivent ses messages (Airbnb, Booking, WhatsApp, e-mail) : jamais renseignés ; ils fixeront la suite.
- [ ] **PMS retenu** (ou réservations directes) : inchangé depuis le cahier d'origine, non nécessaire aujourd'hui.
- [ ] **Personne qui répond la nuit** quand une urgence est escaladée : inchangé.
- [ ] **Statut juridique, RGPD** : les durées de conservation restent des propositions à valider avec un conseil.

## Suite possible (non décidée)

À arbitrer avec le Gérant selon ses réponses ci-dessus, par ordre de valeur probable :

1. Faire tourner l'assistant sur ses vrais messages (clé Anthropic + fiches réelles) et mesurer la part de brouillons validés sans correction.
2. Recevoir les messages sans copier-coller (e-mail entrant, puis WhatsApp).
3. Proposition automatique d'ajout à la fiche (deuxième appel au modèle, aujourd'hui manuelle).
4. Autonomie sur les réponses factuelles, une fois les seuils atteints.
5. Rattacher les réservations (PMS), les ménages, les relevés propriétaires — lots L2 à L5 du cahier d'origine.

## Ce qui reste hors périmètre

Tarification dynamique, encaissement, toute décision engageant de l'argent, du droit ou la sécurité
des personnes, chiffrement des codes d'accès (table `secret_logement` non utilisée), photos,
traduction des fiches.
