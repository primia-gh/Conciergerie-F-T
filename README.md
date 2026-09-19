# Conciergerie Premium

Plateforme de conciergerie premium — SaaS mettant en relation clients, concierges, partenaires et administration autour d'un workflow de demande → prise en charge → proposition → validation → réservation → paiement → suivi → fidélisation.

**Statut :** infrastructure initiale (Phase M0). Voir [ROADMAP.md](ROADMAP.md) pour l'avancement réel — aucune fonctionnalité métier n'est encore implémentée.

## Documentation

- [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) — audit initial et risques
- [ARCHITECTURE.md](ARCHITECTURE.md) — stack, comparatifs, décisions techniques
- [DATABASE.md](DATABASE.md) — schéma de données complet
- [ROADMAP.md](ROADMAP.md) — séquence de développement du MVP (jalons M0 → M16)

**Agent IA F&T (assistant du Gérant)** — un second produit, sur le même site et le même compte admin :

- [CLAUDE.md](CLAUDE.md) — consignes de travail et **état d'avancement** de l'agent
- [docs/cahier-des-charges-v2.md](docs/cahier-des-charges-v2.md) — objectif, décisions, critères d'acceptation, questions ouvertes
- [docs/exploitation-agent.md](docs/exploitation-agent.md) — faire tourner, tester, migrer, mettre en service
- [DECISIONS.md](DECISIONS.md), [SECURITY.md](SECURITY.md) §11, [DATABASE.md](DATABASE.md) §2 bis — décisions, sécurité, tables de l'agent

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS · Supabase (Postgres, Auth, Storage, Realtime) · Drizzle ORM · Stripe · Resend · Vercel · GitHub Actions.

Détail et justification des choix dans [ARCHITECTURE.md](ARCHITECTURE.md).

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs (jamais commiter .env.local)
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Base de données locale (tests d'intégration)

Un Postgres local est disponible via Docker, isolé de toute instance Supabase partagée :

```bash
docker compose up -d
```

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | ESLint |
| `npm test` | Tests automatiques (Vitest) |
| `npm run eval:securite` | Évalue le vrai modèle contre 15 manipulations (Agent IA ; coûte quelques centimes, exige `ANTHROPIC_API_KEY`) |

## Comptes de test (dev uniquement)

`src/server/db/seed-dev-accounts.sql` crée 4 comptes pré-confirmés (un par rôle) pour tester le
parcours de connexion sans boîte mail. Mot de passe : `TestPassword123!`. À exécuter uniquement
sur le projet Supabase de dev, jamais sur staging/production.

| Email | Rôle |
|---|---|
| dev-client@example.invalid | client |
| dev-concierge@example.invalid | concierge |
| dev-admin@example.invalid | admin |
| dev-partner@example.invalid | partner |

## Contribution

Commits atomiques, préfixés (`feat:`, `fix:`, `test:`, `refactor:`, ...). Aucune fonctionnalité n'est déclarée terminée si elle n'est pas réellement fonctionnelle, testée et documentée — voir la règle §34 du cahier des charges produit.
