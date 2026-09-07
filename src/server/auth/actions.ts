"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dashboardPathForRole } from "@/server/auth/guards";
import type { Profile } from "@/server/auth/session";

export type AuthActionState = { error: string | null };

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
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

  redirect(dashboardPathForRole(profile.role));
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

  const supabase = await createClient();
  // Note : le rôle n'est jamais transmis ici. Le trigger `handle_new_user`
  // côté base attribue toujours 'client' à l'inscription publique.
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, last_name: lastName } },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/signup/check-email");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
