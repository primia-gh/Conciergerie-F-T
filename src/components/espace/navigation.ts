import type { Profile } from "@/server/auth/session";

export type RoleEspace = Profile["role"];

export type LienEspace = {
  href: string;
  libelle: string;
  /** Autres débuts d'adresse qui rendent ce lien actif (pages de détail). */
  aussi?: string[];
  /** Adresses qui ne le rendent jamais actif, même si elles commencent pareil. */
  sauf?: string[];
};

export type Espace = {
  /** Nom affiché à côté de la marque (« Espace client »). */
  nom: string;
  accueil: string;
  liens: LienEspace[];
  /** Page publique ouverte par « Voir le site ». */
  voirLeSite: string;
  /** Cloche de notifications : seuls les clients et concierges en reçoivent. */
  notifications: boolean;
};

/**
 * Menu de chaque espace connecté. Seules les pages qui existent y figurent ;
 * « Mon compte » et « Se déconnecter » sont communs (menu du compte).
 */
export const ESPACES: Record<RoleEspace, Espace> = {
  client: {
    nom: "Espace client",
    accueil: "/client/dashboard",
    liens: [
      {
        href: "/client/dashboard",
        libelle: "Mes demandes",
        aussi: ["/client/requests/"],
        sauf: ["/client/requests/new"],
      },
      { href: "/client/requests/new", libelle: "Nouvelle demande" },
    ],
    voirLeSite: "/premium",
    notifications: true,
  },
  concierge: {
    nom: "Espace concierge",
    accueil: "/concierge/dashboard",
    liens: [{ href: "/concierge/dashboard", libelle: "Demandes", aussi: ["/concierge/requests/"] }],
    voirLeSite: "/premium",
    notifications: true,
  },
  partner: {
    nom: "Espace partenaire",
    accueil: "/partner/dashboard",
    liens: [{ href: "/partner/dashboard", libelle: "Tableau de bord" }],
    voirLeSite: "/premium",
    notifications: false,
  },
  admin: {
    nom: "Espace du Gérant",
    accueil: "/admin/dashboard",
    liens: [
      { href: "/admin/dashboard", libelle: "Tableau de bord" },
      { href: "/admin/requests", libelle: "Demandes" },
      { href: "/admin/partners", libelle: "Partenaires" },
      { href: "/admin/boite", libelle: "Boîte de réception" },
      { href: "/admin/fiches", libelle: "Fiches" },
      { href: "/admin/ft", libelle: "Agent F&T" },
    ],
    // Le Gérant pilote les deux activités : la page de choix (voir (accueil)/page.tsx).
    voirLeSite: "/?from=app",
    notifications: false,
  },
};

function sousChemin(chemin: string, base: string): boolean {
  return chemin === base || chemin.startsWith(base.endsWith("/") ? base : `${base}/`);
}

/** Le lien correspond-il à la page affichée ? (menu : `aria-current="page"`) */
export function lienActif(lien: LienEspace, chemin: string): boolean {
  if (lien.sauf?.some((s) => sousChemin(chemin, s))) return false;
  if (sousChemin(chemin, lien.href)) return true;
  return lien.aussi?.some((a) => sousChemin(chemin, a)) ?? false;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Page à ouvrir depuis une notification, d'après la demande qu'elle concerne. */
export function lienNotification(role: RoleEspace, payload: unknown): string | null {
  const requestId =
    payload && typeof payload === "object" && "requestId" in payload ? (payload as { requestId: unknown }).requestId : null;
  if (typeof requestId !== "string" || !UUID.test(requestId)) return null;
  if (role === "client") return `/client/requests/${requestId}`;
  if (role === "concierge") return `/concierge/requests/${requestId}`;
  return null;
}
