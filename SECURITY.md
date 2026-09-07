# SECURITY.md — Modèle de sécurité

Ce document décrit les mécanismes de sécurité réellement implémentés dans le MVP, et liste
honnêtement les limitations connues et acceptées (voir ROADMAP.md pour le contexte de chaque
phase). Rien ici n'est théorique : chaque protection listée a été vérifiée en conditions réelles
contre le projet Supabase `concierge-app-dev`.

## 1. Authentification et autorisation (double couche)

L'application applique le contrôle d'accès à **deux niveaux indépendants**, jamais un seul :

1. **Application** : `assertRole()` / `requireRole()` (`src/server/auth/guards.ts`) au début de
   chaque Server Action et de chaque page serveur protégée. `assertRole` lève une erreur (actions),
   `requireRole` redirige (pages).
2. **Base de données** : Row Level Security (RLS) activée sur les 18 tables métier
   (`src/server/db/migrations/0002_rls_policies.sql` et suivantes), politique *deny by default* —
   aucune table n'a de policy permissive par défaut.

Cette redondance est volontaire : un bug dans l'une des deux couches ne suffit pas, seul, à
exposer des données d'un autre utilisateur.

Le rôle applicatif (`client`/`concierge`/`admin`/`partner`) n'est **jamais** lu depuis une valeur
fournie par le client à l'inscription — le trigger `handle_new_user` (migration 0004) attribue
toujours `'client'`. Les autres rôles sont provisionnés hors self-service.

## 2. Row Level Security — fonctions SECURITY DEFINER

Deux fonctions `SECURITY DEFINER` existent, chacune avec une justification et un périmètre
d'exécution restreint :

| Fonction | Rôle exécutant | Pourquoi SECURITY DEFINER | Restriction d'accès |
|---|---|---|---|
| `current_app_role()` | `authenticated` (obligatoire) | Lit `profiles.role` sans provoquer de récursion RLS sur `profiles` | `EXECUTE` révoqué pour `anon`/`public` (migration 0003). Reste exécutable par `authenticated` car **toutes** les policies RLS en dépendent — le lui retirer casserait l'application. Accepté : la fonction ne retourne que le rôle de l'appelant lui-même, aucune donnée sensible. |
| `handle_new_user()` | Système (trigger `on_auth_user_created`) | Doit pouvoir écrire dans `public.profiles` au moment de l'insertion dans `auth.users`, avant que la session de l'utilisateur n'existe | `EXECUTE` révoqué pour `public`/`anon`/`authenticated` (migration 0012) — cette fonction n'est **jamais** censée être appelée directement via RPC, uniquement déclenchée par le trigger système (qui invoque la fonction sans passer par le contrôle d'ACL des appels RPC classiques). |
| `handle_profile_soft_delete()` | Système (trigger `on_profile_soft_delete`) | Doit pouvoir bannir un compte dans `auth.users` (table non accessible en écriture à `authenticated`) au moment de la suppression RGPD | `EXECUTE` révoqué pour tous les rôles applicatifs (migration 0013) — trigger uniquement. |

Vérifié via l'advisor sécurité Supabase (`get_advisors`, 2026-09-07) : plus aucun `WARN` sur
`handle_new_user`/`handle_profile_soft_delete` après durcissement. `current_app_role()` reste
signalé par l'advisor mais est un compromis assumé et documenté ci-dessus.

## 3. Secrets et configuration

- Aucun secret n'est commité : `.gitignore` exclut `.env*` (sauf `.env.example`, qui ne contient
  que des noms de variables vides).
- `SUPABASE_SERVICE_ROLE_KEY` n'est **utilisée nulle part** dans le code applicatif actuel — toutes
  les requêtes passent par le client Supabase standard (`@supabase/ssr`), qui respecte la RLS pour
  chaque utilisateur. C'est un choix délibéré : bypasser la RLS côté serveur aurait rendu chaque
  route responsable, à la main, de ne pas fuiter de données — la RLS le garantit structurellement.
- Aucune donnée bancaire n'est stockée : les paiements (M10, non branché faute de compte Stripe)
  utiliseraient exclusivement Stripe Checkout/Elements + webhooks signés.

## 4. Uploads de fichiers

Le bucket Storage `request-attachments` est privé (jamais d'URL publique) et restreint au niveau
du bucket lui-même (migration 0014, pas seulement côté application) :
- Taille max : 10 Mo par fichier.
- Types autorisés : `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `application/pdf`.

L'accès (lecture/écriture/suppression) est gouverné par RLS sur `storage.objects`, avec la même
règle que pour la table `requests` : seuls le client, le concierge assigné et l'admin y accèdent.

## 5. En-têtes de sécurité et CSP

Posés globalement (`next.config.ts`), en production uniquement (voir §7) :

- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`,
  `Strict-Transport-Security` (HSTS, 2 ans, `includeSubDomains`).
- `Content-Security-Policy` : `default-src 'self'`, `connect-src` restreint à notre seule origine
  Supabase (REST + WebSocket Realtime), `frame-ancestors 'none'` (anti-clickjacking),
  `object-src 'none'`, `base-uri 'self'`.

**Compromis assumé et documenté** sur `script-src`/`style-src` (`'self' 'unsafe-inline'`) : testé en
conditions réelles (`next build && next start`), une CSP à nonce + `'strict-dynamic'` (la
recommandation Next.js officielle) bloque **tous** les scripts Next.js, y compris les chunks
same-origin légitimes — le mécanisme de propagation automatique du nonce vers les scripts injectés
par le framework (streaming RSC) n'a pas pu être mis en fonctionnement de façon fiable dans le
temps imparti à cette phase. `unsafe-inline` sur `script-src` laisse un vecteur XSS-via-injection
HTML théorique, mais le risque résiduel est faible : le code ne contient aucun
`dangerouslySetInnerHTML`, et React échappe tout rendu par défaut. **Item de durcissement identifié
pour un futur cycle** : implémenter la CSP à nonce une fois le mécanisme Next.js correctement
maîtrisé, ou après migration vers une version de Next.js documentant plus précisément ce point.

## 6. Rate limiting

`src/server/security/rate-limit.ts` limite les tentatives de connexion (10/min par IP) et
d'inscription (5/heure par IP) via un compteur en mémoire du processus Node.

**Limite connue et assumée** : ce compteur est **mono-instance**. Sur une plateforme serverless
multi-instance (Vercel), chaque invocation peut s'exécuter sur un process différent sans état
partagé — un attaquant distribué contournerait cette protection. Avant un vrai lancement
production, remplacer par un store partagé (Upstash Redis + `@upstash/ratelimit`, ou le Firewall
natif de Vercel). Fonctionnel et vérifié tel quel pour un déploiement mono-instance (dev,
`next start` sur une seule machine).

## 7. CSRF

Next.js (App Router, Server Actions) vérifie nativement l'origine de la requête pour toute
Server Action (comparaison `Origin`/`Host`) — aucune protection CSRF supplémentaire n'a été ajoutée
manuellement, ce n'était pas nécessaire.

## 8. RGPD

Voir la politique de confidentialité publiée (`/confidentialite`) pour le détail côté utilisateur.
Côté technique :
- **Portabilité** : export JSON complet à la demande (`src/server/account/actions.ts:exportMyData`),
  scope explicite sur l'id de l'utilisateur courant (pas seulement RLS — double filtrage).
- **Effacement** : soft-delete + anonymisation immédiate des champs personnels sur `profiles`, et
  bannissement définitif du compte Auth (`auth.users.banned_until = 'infinity'`) via trigger
  (migration 0013) — vérifié en conditions réelles : après suppression, une tentative de
  reconnexion avec les mêmes identifiants renvoie bien "Identifiants invalides."
- **Limite connue et documentée** : un access token JWT déjà émis avant la suppression reste
  cryptographiquement valide jusqu'à son expiration naturelle (défaut Supabase : 1h) — la
  révocation immédiate de session nécessite l'Auth Admin API (`auth.admin.signOut`), qui exige une
  `SUPABASE_SERVICE_ROLE_KEY` non disponible dans cet environnement de développement. Le blocage de
  toute **nouvelle** connexion, lui, est immédiat et vérifié.

## 9. Dépendances

`npm audit` (2026-09-07) signale 4 vulnérabilités "moderate", toutes dans la chaîne
`drizzle-kit → @esbuild-kit/esm-loader → esbuild` (CVE sur le serveur de dev d'esbuild,
exploitable uniquement si un site malveillant atteint le serveur de dev local pendant son
exécution). `drizzle-kit` est un outil de développement (génération de migrations), jamais exécuté
en production ni exposé publiquement — risque résiduel jugé faible, non corrigé pour éviter un
downgrade cassant (`drizzle-kit@0.18.1`). À réévaluer si `drizzle-kit` publie une version corrigée
compatible.

## 10. Éléments à traiter avant un vrai lancement production

Liste consolidée des compromis MVP explicitement documentés ci-dessus, à ne pas perdre de vue :

- [ ] Activer "Leaked Password Protection" dans le dashboard Supabase Auth (réglage de compte,
      non pilotable par migration SQL).
- [ ] Remplacer le rate limiter en mémoire par un store partagé (Upstash Redis) avant tout
      déploiement multi-instance.
- [ ] Implémenter une CSP à nonce correcte pour `script-src` (actuellement `unsafe-inline`).
- [ ] Configurer `SUPABASE_SERVICE_ROLE_KEY` pour permettre la révocation immédiate de session à
      la suppression de compte (`auth.admin.signOut`).
- [ ] Brancher Stripe (M10) et Resend (M11, canal email) une fois les comptes/clés disponibles.
