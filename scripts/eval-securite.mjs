// Lance l'évaluation du VRAI modèle contre les 15 manipulations (voir
// src/lib/agent/securite/eval-modele.test.ts). Coûte quelques centimes d'API :
// jamais lancée par `npm test`, seulement par `npm run eval:securite`.
import { spawnSync } from "node:child_process";

const resultat = spawnSync("npx", ["vitest", "run", "src/lib/agent/securite/eval-modele.test.ts"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, EVAL_MODELE: "1" },
});

process.exit(resultat.status ?? 1);
