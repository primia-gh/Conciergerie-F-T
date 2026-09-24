# Instructions pour Claude Code — mise en production et double identité

*2026-09-24 · à lire avec `docs/feuille-de-route-2026-09.md`. Suivre les règles de `CLAUDE.md` :
une étape à la fois, plan proposé puis accord du Gérant avant d'écrire du code.*

## État des bases de données (fait le 2026-09-24, via l'outil Supabase)

- `concierge-app-prod` (`bavzdsuhlmmnomvnkslt`) : **réactivée**. Migrations de l'agent 0015 à 0026
  appliquées dans l'ordre (compte rendu en bas de ce fichier).
- `concierge-app-dev` (`kfszucjfoccqcgmmlvnc`) : **mise en pause** à la demande du Gérant (offre
  gratuite limitée à deux projets actifs : `najarena` + la production).
- **Conséquence pour le développement local** : `.env.local` pointe probablement vers la base de dev,
  désormais en pause. Ne **jamais** faire pointer le serveur local vers la production pour
  développer. Proposer au Gérant l'une de ces solutions, en expliquant simplement :
  1. une base locale avec la CLI Supabase (`supabase start`, nécessite Docker Desktop), gratuite ;
  2. réactiver la base de dev le temps d'une session de travail (en mettant un autre projet en pause).

## Étape 1 — Brancher le site en ligne sur la production

Le Gérant fait lui-même, dans Vercel (projet `conciergerie-f-t` → Settings → Environment Variables,
environnement Production), avec les valeurs de Supabase (projet `concierge-app-prod` → Project
Settings → API) :

- `NEXT_PUBLIC_SUPABASE_URL` = `https://bavzdsuhlmmnomvnkslt.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou le nom utilisé dans `.env.example`) = clé publique de la production
- `SUPABASE_SERVICE_ROLE_KEY` = clé de service de la production (secrète)
- `CRON_SECRET` = une longue valeur aléatoire
- Plus tard : `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `GERANT_ALERT_EMAIL`

Claude Code : guider le Gérant écran par écran, vérifier les noms exacts dans `.env.example`,
ne jamais lui demander de coller une clé dans le chat.

Anti-pause : la tâche planifiée quotidienne `/api/cron/relances` interroge la base chaque jour, ce
qui évite que l'offre gratuite de Supabase remette la production en pause. Elle n'existe qu'après la
fusion de l'étape 2.

## Étape 2 — Publier la branche `v2-assistant-gerant`

1. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` sur la branche : tout doit passer.
2. Rejouer les audits `test/securite/rls-audit.sql` et `test/securite/journal-immuable.sql` sur la
   **production** (éditeur SQL de Supabase ; le Gérant peut les coller, ou Claude Code les lance s'il
   a un accès).
3. Fusionner dans `master` **avec l'accord du Gérant**, puis vérifier le déploiement Vercel et la
   connexion du compte admin en ligne.

## Étape 3 — Un site, deux activités

Maquettes de référence : canevas « Conciergerie F&T — Accueil » (planches « Page de choix »,
« Sélecteur F&T / Premium », « Piste 1 — Lin & forêt », « Premium — trois palettes »).
Le Gérant peut exporter les planches ou en fournir des captures.

### Structure des adresses

- `/` : **page de choix** (deux moitiés, F&T à gauche, Premium à droite). Garder le comportement
  actuel : un utilisateur connecté est redirigé vers son espace, sauf `?from=app`.
- `/location` (et sous-pages) : site public F&T. `/proprietaires` y est rattaché.
- `/premium` : l'actuelle page d'accueil Conciergerie Premium (contenu de `(marketing)/page.tsx`).
- Espaces connectés (`/client`, `/concierge`, `/admin`, `/partner`, `/account`) : inchangés.
- Mettre à jour `sitemap.ts`, les métadonnées et les liens internes (`#tarifs` etc. → `/premium#tarifs`).

### Sélecteur

Barre fine en haut de toutes les pages publiques : deux liens « F&T · Location courte durée » et
« Premium · Conciergerie privée », `aria-current="page"` sur l'activité en cours, zone cliquable
d'au moins 44 px, utilisable au clavier. L'activité active prend la couleur de sa marque.

### Thèmes (un par activité, appliqué sur la mise en page de chaque partie)

**F&T** — polices Fraunces (titres, déjà chargée) et Karla (texte)

| Rôle | Valeur |
|---|---|
| Fond | `#F6F1E8` |
| Fond alterné | `#EDE5D6` |
| Texte | `#1F2A22` |
| Texte secondaire | `#5A5347` |
| Marque / propriétaires | `#2E3B32` (forêt profonde) |
| Secondaire | `#4A5D4F` (sauge) |
| Voyageurs / actions | `#A94F32` (terre cuite, texte crème dessus) |
| Accent sur fond foncé | `#E0A47F` |
| Logo | la clé en diagonale (`public/brand/`, fichiers fournis par le Gérant) |

**Premium — « Marine & or »** (palette « hôtellerie de luxe » du skill ui-ux-pro-max, en sombre) —
polices Bodoni Moda (titres) et Jost (texte)

| Rôle | Valeur |
|---|---|
| Fond | `#0E1A31` |
| Surface | `#15254A` |
| Texte | `#F4F1EA` |
| Texte secondaire | `#AEB6C8` |
| Accent / bouton | `#C9A24E` (texte `#0E1A31` dessus) |
| Filets | `rgba(201,162,78,.35)` |

Contrastes vérifiés (tous ≥ 4,5 pour le texte). Remplacer le thème sombre charbon + laiton actuel
de `globals.css` pour Premium ; ne plus en faire le thème global du site. Les écrans connectés
peuvent garder un thème neutre commun, à proposer au Gérant.

## Étape 4 — Pages légales

Créer `/mentions-legales` et `/cgu` (et `/cgv` si vente en ligne) avec des emplacements à compléter.
Informations à demander au Gérant : raison sociale, forme juridique, SIRET, adresse, directeur de la
publication, contact ; hébergeur : Vercel. Ne rien inventer.

## Étape 5 — Fonctionnalités

Suivre l'ordre de `docs/feuille-de-route-2026-09.md` (F&T : acquisition de propriétaires en premier ;
Premium : paiement Stripe en premier).

---

## Compte rendu des migrations en production

*État au 2026-09-24, 22 h 57 (heure de Paris), vérifié avec `list_migrations` sur la production.*

- **Migrations 0015 à 0026 : toutes appliquées** sur `concierge-app-prod`, dans l'ordre
  (0021 est passée avant 0020 ; elles sont indépendantes l'une de l'autre).
- **Audit des règles d'accès** (`test/securite/rls-audit.sql`) : 16 tables sur 16 « OK »,
  aucune table du schéma public sans RLS.
- **Audit du journal** (`test/securite/journal-immuable.sql`) : insertion acceptée ; modification,
  suppression, vidage et insertion sans activité refusés. Aucune ligne de test conservée.
- **Contrôle de sécurité Supabase** : deux avertissements déjà présents avant les migrations :
  `current_app_role()` exécutable par les utilisateurs connectés (voulu, utilisé par les règles
  d'accès) et protection contre les mots de passe compromis désactivée (à activer par le Gérant dans
  Authentication → Settings).

La base de production est prête pour la fusion de `v2-assistant-gerant` (étape 2), une fois les
variables Vercel renseignées (étape 1).
