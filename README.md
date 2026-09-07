# Conciergerie Premium

Plateforme de conciergerie premium — SaaS mettant en relation clients, concierges, partenaires et administration autour d'un workflow de demande → prise en charge → proposition → validation → réservation → paiement → suivi → fidélisation.

**Statut :** infrastructure initiale (Phase M0). Voir [ROADMAP.md](ROADMAP.md) pour l'avancement réel — aucune fonctionnalité métier n'est encore implémentée.

## Documentation

- [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) — audit initial et risques
- [ARCHITECTURE.md](ARCHITECTURE.md) — stack, comparatifs, décisions techniques
- [DATABASE.md](DATABASE.md) — schéma de données complet
- [ROADMAP.md](ROADMAP.md) — séquence de développement du MVP (jalons M0 → M16)

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

## Contribution

Commits atomiques, préfixés (`feat:`, `fix:`, `test:`, `refactor:`, ...). Aucune fonctionnalité n'est déclarée terminée si elle n'est pas réellement fonctionnelle, testée et documentée — voir la règle §34 du cahier des charges produit.
