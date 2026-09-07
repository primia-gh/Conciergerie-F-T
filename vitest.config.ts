import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` lève systématiquement en dehors du bundler Next.js (qui
      // le neutralise pour le graphe serveur) — no-op en tests, où l'on ne
      // teste que de la logique pure, jamais un import client réel.
      "server-only": path.resolve(__dirname, "./test/stubs/server-only.ts"),
    },
  },
});
