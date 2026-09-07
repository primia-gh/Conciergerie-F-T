import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Un package-lock.json existe dans un dossier parent non lié à ce projet ;
  // fixe explicitement la racine pour éviter toute ambiguïté de workspace.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
