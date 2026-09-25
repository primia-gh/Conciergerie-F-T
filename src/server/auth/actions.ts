"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { dashboardPathForRole } from "@/server/auth/guards";
import type { Profile } from "@/server/auth/session";
import { checkRateLimit } from "@/server/security/rate-limit";
import { cheminInterneSur } from "@/lib/chemin-sur";

export type AuthActionState = { error: string | null; message?: string | null };

async function clientIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Adresse publique du site, pour les liens envoyés par e-mail. */
function adresseSite(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const ip = await clientIp();
  if (!checkRateLimit(`signin:${ip}`, 10, 60_000)) {
    return { error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Identifiants invalides." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single<Pick<Profile, "role">>();

  if (!profile) {
    return { error: "Profil introuvable. Contactez le support." };
  }

  // Retour vers la page demandée avant la connexion (ex. un lien vers une
  // demande précise), chemin interne uniquement ; sinon l'espace du rôle.
  redirect(cheminInterneSur(String(formData.get("next") ?? "")) ?? dashboardPathForRole(profile.role));
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const ip = await clientIp();
  if (!checkRateLimit(`signup:${ip}`, 5, 60 * 60_000)) {
    return { error: "Trop de tentatives d'inscription. Réessayez plus tard." };
  }

  const supabase = await createClient();
  // Note : le rôle n'est jamais transmis ici. Le trigger `handle_new_user`
  // côté base attribue toujours 'client' à l'inscription publique.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
      // Le lien de confirmation ouvre la session puis mène à l'espace client.
      emailRedirectTo: `${adresseSite()}/auth/callback?next=/client/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/signup/check-email");
}

/**
 * « Mot de passe oublié » : envoie un lien de réinitialisation. Réponse
 * identique qu'un compte existe ou non, pour ne pas révéler quelles adresses
 * sont inscrites.
 */
export async function demanderReinitialisation(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Indiquez l'adresse e-mail de votre compte." };
  }

  const ip = await clientIp();
  if (!checkRateLimit(`reinitialisation:${ip}`, 5, 60 * 60_000)) {
    return { error: "Trop de demandes. Réessayez dans une heure." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${adresseSite()}/auth/callback?next=/nouveau-mot-de-passe`,
  });

  return {
    error: null,
    message:
      "Si un compte existe pour cette adresse, un e-mail vient de partir avec un lien pour choisir un nouveau mot de passe. Pensez à regarder vos courriers indésirables.",
  };
}

/** Nouveau mot de passe, une fois la session ouverte par le lien reçu par e-mail. */
export async function changerMotDePasse(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== confirmation) {
    return { error: "Les deux mots de passe ne sont pas identiques." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Ce lien a expiré. Demandez-en un nouveau depuis « Mot de passe oublié »." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Le mot de passe n'a pas pu être changé. Choisissez-en un autre et réessayez." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>();

  redirect(profile ? dashboardPathForRole(profile.role) : "/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
