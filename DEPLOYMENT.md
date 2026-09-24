# DEPLOYMENT.md — Déploiement production

**Statut actuel : ✅ Déployé.** Application en production sur
`https://conciergerie-f-t.vercel.app`, connectée au projet Supabase dédié `concierge-app-prod`.
Voir ROADMAP.md (section M16) pour le détail de ce qui a été vérifié en conditions réelles sur le
domaine de production. Ce document reste le runbook de référence pour tout futur redéploiement,
rollback, ou reproduction de l'infrastructure (ex. un environnement de staging).

## 1. Prérequis

- **Un dépôt distant (GitHub/GitLab/Bitbucket).** ✅ Fait — poussé sur
  [github.com/primia-gh/Conciergerie-F-T](https://github.com/primia-gh/Conciergerie-F-T)
  (branche `master`).
- Un compte Vercel (ou toute plateforme supportant Next.js 16 App Router + Server Actions +
  Turbopack).
- Un **second** projet Supabase dédié à la production (`concierge-app-prod`), distinct du projet de
  développement `concierge-app-dev` utilisé jusqu'ici — ne jamais pointer la production sur le
  projet de dev.
- Comptes Stripe et Resend en mode production (clés live), si M10/M11 sont activés avant le
  lancement.
- Un nom de domaine (pour `NEXT_PUBLIC_APP_URL` et la config Auth Supabase).

## 2. Provisionner le projet Supabase de production

1. Créer le projet dans la même organisation Supabase (`ikdtytcgcgxvuyjfcgri`) ou une organisation
   dédiée à la production, selon la politique de séparation souhaitée.
2. Rejouer **toutes** les migrations dans l'ordre (`src/server/db/migrations/0000` à la dernière),
   via `apply_migration` ou `supabase db push` — jamais copier les données du projet dev.
3. Réappliquer le seed de catalogue (`categories`, `plans`) — **jamais** le script
   `seed-dev-accounts.sql` (comptes de test avec mot de passe connu, strictement dev).
4. Dans Authentication → URL Configuration : renseigner l'URL de production comme Site URL et
   Redirect URL.
5. Dans Authentication → Sign In / Providers → Email : activer "Leaked Password Protection" si le
   projet est sur un palier Supabase Pro (indisponible sur le palier gratuit — voir SECURITY.md §10,
   non bloquant).
6. Vérifier `get_advisors` (sécurité + performance) sur le projet de production avant mise en ligne.

## 3. Variables d'environnement (Vercel)

Toutes les variables de `.env.example` doivent être renseignées dans les paramètres du projet
Vercel (Production + Preview séparément si les valeurs diffèrent) :

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL de production réelle |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Projet Supabase **production** |
| `SUPABASE_SERVICE_ROLE_KEY` | Projet Supabase production — **requise par l'Agent IA** (journal, lecture des fiches, tâche planifiée) ; sert aussi à la révocation de session si elle est implémentée (voir SECURITY.md §10 et §11) |
| `DATABASE_URL` | Connexion Postgres directe, pour Drizzle (migrations uniquement, jamais le runtime applicatif) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Compte Stripe, clés **live** |
| `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` | Compte Resend, domaine d'envoi vérifié |
| `ANTHROPIC_API_KEY` | Agent IA : clé du modèle, côté serveur uniquement. Sans elle, mode démonstration (aucun brouillon simulé) |
| `GERANT_ALERT_EMAIL` | Agent IA : adresse qui reçoit les alertes du chat de prospection (facultative) |
| `CRON_SECRET` | Agent IA : protège `/api/cron/relances`. À créer soi-même (longue valeur aléatoire) : Vercel ne la génère pas, il se contente de l'envoyer à chaque déclenchement |
| `CHAT_PROSPECTION_ACTIF` | Agent IA : laisser **vide** (chat public désactivé) tant que la limite de débit n'est pas partagée — voir SECURITY.md §6 |

### Déployer l'Agent IA (branche `v2-assistant-gerant`)

À faire **dans cet ordre**, la branche n'étant pas encore fusionnée :

1. Décider quelle base alimente le site en ligne (`concierge-app-prod` est en pause à ce jour).
2. Appliquer à cette base les migrations `0015` à `0026`, dans l'ordre, puis rejouer
   `test/securite/rls-audit.sql` et `test/securite/journal-immuable.sql`. **Déployer le code avant
   les migrations ferait planter le site** sur les colonnes manquantes.
3. Renseigner les variables ci-dessus dans Vercel.
4. Fusionner la branche. À noter : `vercel.json` déclare une tâche planifiée
   (`/api/cron/relances`) qui démarre dès le déploiement, même chat coupé. Elle ne concerne que les
   prospects existants ayant laissé un e-mail et n'appelle pas le modèle.
   **Elle est quotidienne (8 h UTC) parce que l'offre Hobby de Vercel refuse tout déploiement
   contenant une tâche plus fréquente** (vérifié le 2026-09-19 : un déclenchement horaire,
   `0 * * * *`, a fait échouer le déploiement de la prévisualisation). Sur l'offre Pro, remettre un
   déclenchement horaire redeviendrait possible.
5. Ne pas oublier : aucune vraie fiche n'existe encore, l'assistant escaladera tout tant qu'elles
   ne sont pas saisies (`/admin/fiches`).

Guide complet : `docs/exploitation-agent.md`.

**Ne jamais** committer ces valeurs — les saisir uniquement dans l'interface Vercel (ou son
équivalent).

## 4. Déploiement

1. `git push` sur la branche de production (`main`) déclenche le build Vercel automatiquement si le
   projet est connecté au dépôt Git.
2. Vercel exécute `npm run build` — vérifier que le build passe sans variables d'environnement
   placeholder (contrairement à la CI GitHub Actions, qui en utilise volontairement pour ne pas
   dépendre de vraies ressources).
3. Après déploiement, vérifier manuellement :
   - Les en-têtes de sécurité sont bien présents (`curl -I https://votre-domaine`) — CSP,
     X-Frame-Options, HSTS (voir SECURITY.md §5).
   - Le parcours critique complet fonctionne : signup → login → création de demande → prise en
     charge concierge → proposition → réservation → complétion (voir ROADMAP.md pour le détail de
     chaque phase déjà vérifiée en dev).
   - `/confidentialite` et `/compte-supprime` sont bien accessibles sans authentification.

## 5. CI/CD

Le pipeline `.github/workflows/ci.yml` bloque déjà le merge sur `main` si lint, typecheck, tests
unitaires ou build échouent. Il ne déploie pas lui-même (pas de step `vercel deploy`) — le
déploiement continu est délégué à l'intégration Git native de Vercel. Ajouter un gate de
déploiement manuel (approbation requise) est recommandé pour les premiers déploiements de
production.

## 6. Rollback

Vercel conserve chaque déploiement — un rollback consiste à repromouvoir un déploiement précédent
depuis le dashboard Vercel (aucune commande destructive côté code). Un rollback de **migration**
base de données est plus délicat (voir DATABASE.md) : privilégier des migrations additives et
réversibles, jamais de `DROP COLUMN`/`DROP TABLE` sans une étape de dépréciation préalable.

## 7. Ce qui reste explicitement hors scope MVP

Performance (Core Web Vitals, cache, pagination — voir ROADMAP.md M16) et PWA (manifest
installable) ne sont pas traités par ce document ; ils font partie de la même Phase M16 et seront
abordés au moment de l'exécution réelle du déploiement, avec l'utilisateur.
