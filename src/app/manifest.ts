import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Conciergerie Premium",
    short_name: "Conciergerie",
    description: "Service de conciergerie privée haut de gamme, sur demande.",
    // "/" redirige déjà vers le bon dashboard pour un utilisateur connecté
    // (voir src/app/(marketing)/page.tsx) — un seul point d'entrée pour les 4 rôles.
    start_url: "/",
    display: "standalone",
    background_color: "#14120e",
    theme_color: "#14120e",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
