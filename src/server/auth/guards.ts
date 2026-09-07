import "server-only";

import { redirect } from "next/navigation";
import { getCurrentProfile, type Profile } from "@/server/auth/session";

/**
 * À utiliser dans un layout/page serveur : redirige vers /login si non connecté,
 * vers l'espace correspondant à son rôle réel si connecté mais rôle non autorisé.
 * Ne remplace pas la RLS — double vérification volontaire (voir ARCHITECTURE.md §4).
 */
export async function requireRole(...allowed: Profile["role"][]): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!allowed.includes(profile.role)) {
    redirect(dashboardPathForRole(profile.role));
  }

  return profile;
}

export function dashboardPathForRole(role: Profile["role"]): string {
  switch (role) {
    case "client":
      return "/client/dashboard";
    case "concierge":
      return "/concierge/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "partner":
      return "/partner/dashboard";
  }
}

/**
 * À utiliser au début d'une Server Action : lève une erreur explicite plutôt
 * que de rediriger (une action n'a pas de rendu à interrompre proprement).
 */
export async function assertRole(...allowed: Profile["role"][]): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Non authentifié.");
  }

  if (!allowed.includes(profile.role)) {
    throw new Error("Action non autorisée pour ce rôle.");
  }

  return profile;
}
