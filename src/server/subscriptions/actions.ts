"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";
import { getClientQuota } from "@/server/subscriptions/quota";
import { ecrireAuJournal } from "@/lib/agent/journal";
import { alerterGerant } from "@/lib/agent/alert";
import { forfait } from "@/lib/forfaits";

/**
 * Changement de forfait Premium, en attendant le paiement en ligne (lot F) :
 * le client le demande, le Gérant l'active à la main et facture hors du site
 * (décision du 2026-09-26). La demande en cours est rangée dans
 * `client_profiles.preferences.demande_forfait` : le client peut modifier sa
 * propre ligne (RLS `client_profiles_update_own`), le Gérant toutes. Aucune
 * table nouvelle, donc aucune migration à appliquer en production.
 */

export type ForfaitState = { error: string | null; success?: boolean };

export type DemandeForfait = { code: string; le: string };

type Preferences = Record<string, unknown> & { demande_forfait?: DemandeForfait };

const idClient = z.string().uuid();

function sansDemande(preferences: Preferences | null): Preferences {
  const reste: Preferences = { ...(preferences ?? {}) };
  delete reste.demande_forfait;
  return reste;
}

/** Le client demande un autre forfait. */
export async function demanderForfait(code: string): Promise<ForfaitState> {
  const profile = await assertRole("client");
  const choisi = forfait(code);
  if (!choisi) return { error: "Ce forfait n'existe pas." };

  const supabase = await createClient();
  const quota = await getClientQuota(supabase, profile.id);
  if (quota.planCode === choisi.code) return { error: "C'est déjà votre forfait." };

  const { data: ligne } = await supabase
    .from("client_profiles")
    .select("preferences")
    .eq("profile_id", profile.id)
    .maybeSingle<{ preferences: Preferences | null }>();
  if (!ligne) return { error: "Votre profil est introuvable. Reconnectez-vous puis réessayez." };

  const demande: DemandeForfait = { code: choisi.code, le: new Date().toISOString() };
  const { error } = await supabase
    .from("client_profiles")
    .update({ preferences: { ...sansDemande(ligne.preferences), demande_forfait: demande } })
    .eq("profile_id", profile.id);
  if (error) return { error: "La demande n'a pas pu être envoyée. Réessayez dans un instant." };

  await ecrireAuJournal({
    activite: "premium",
    type: "demande_changement_forfait",
    entiteType: "profil",
    entiteId: profile.id,
    decision: `Forfait demandé : ${choisi.nom} (forfait actuel : ${quota.planName})`,
    auteur: "client",
  });

  // Signal en temps réel, au mieux : la demande est déjà enregistrée et visible dans /admin/forfaits.
  try {
    const nom = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Un client";
    await alerterGerant({
      sujet: `Demande de forfait ${choisi.nom}`,
      corps: `${nom} demande le forfait ${choisi.nom} (actuel : ${quota.planName}).\nÀ activer dans /admin/forfaits.`,
    });
  } catch {
    // Volontairement ignoré, voir plus haut.
  }

  revalidatePath("/client/forfait");
  revalidatePath("/client/dashboard");
  return { error: null, success: true };
}

/** Le client retire sa demande en cours. */
export async function annulerDemandeForfait(): Promise<ForfaitState> {
  const profile = await assertRole("client");
  const supabase = await createClient();

  const { data: ligne } = await supabase
    .from("client_profiles")
    .select("preferences")
    .eq("profile_id", profile.id)
    .maybeSingle<{ preferences: Preferences | null }>();
  const demande = ligne?.preferences?.demande_forfait;
  if (!ligne || !demande) return { error: null, success: true };

  const { error } = await supabase
    .from("client_profiles")
    .update({ preferences: sansDemande(ligne.preferences) })
    .eq("profile_id", profile.id);
  if (error) return { error: "L'annulation n'a pas abouti. Réessayez dans un instant." };

  await ecrireAuJournal({
    activite: "premium",
    type: "annulation_demande_forfait",
    entiteType: "profil",
    entiteId: profile.id,
    decision: `Demande de forfait ${forfait(demande.code)?.nom ?? demande.code} retirée par le client`,
    auteur: "client",
  });

  revalidatePath("/client/forfait");
  return { error: null, success: true };
}

/**
 * Le Gérant active un forfait pour un client : l'abonnement en cours prend fin,
 * un nouveau commence (sauf Free, qui n'a pas de ligne d'abonnement : voir
 * quota.ts), et la demande éventuelle est close.
 */
export async function activerForfait(clientId: string, code: string): Promise<ForfaitState> {
  await assertRole("admin");
  if (!idClient.safeParse(clientId).success) return { error: "Client introuvable." };
  const choisi = forfait(code);
  if (!choisi) return { error: "Ce forfait n'existe pas." };

  const supabase = await createClient();
  const { data: ligne } = await supabase
    .from("client_profiles")
    .select("preferences, subscription_id")
    .eq("profile_id", clientId)
    .maybeSingle<{ preferences: Preferences | null; subscription_id: string | null }>();
  if (!ligne) return { error: "Client introuvable." };

  let abonnement: string | null = null;
  if (choisi.code !== "free") {
    const { data: plan } = await supabase.from("plans").select("id").eq("code", choisi.code).maybeSingle<{ id: string }>();
    if (!plan) return { error: "Ce forfait n'existe pas dans la base." };
    const { data: cree, error } = await supabase
      .from("subscriptions")
      .insert({ client_id: clientId, plan_id: plan.id, status: "active" })
      .select("id")
      .single<{ id: string }>();
    if (error || !cree) return { error: "L'abonnement n'a pas pu être créé. Réessayez." };
    abonnement = cree.id;
  }

  const { error: erreurProfil } = await supabase
    .from("client_profiles")
    .update({ subscription_id: abonnement, preferences: sansDemande(ligne.preferences) })
    .eq("profile_id", clientId);
  if (erreurProfil) return { error: "Le forfait n'a pas pu être rattaché au client. Réessayez." };

  // L'ancien abonnement prend fin une fois le nouveau en place.
  if (ligne.subscription_id) {
    await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", ligne.subscription_id);
  }

  await ecrireAuJournal({
    activite: "premium",
    type: "activation_forfait",
    entiteType: "profil",
    entiteId: clientId,
    decision: `Forfait ${choisi.nom} activé à la main (facturation hors du site en attendant le paiement en ligne)`,
    auteur: "gerant",
  });

  revalidatePath("/admin/forfaits");
  revalidatePath("/admin/dashboard");
  return { error: null, success: true };
}

/** Le Gérant clôt une demande sans changer le forfait. */
export async function ignorerDemandeForfait(clientId: string): Promise<ForfaitState> {
  await assertRole("admin");
  if (!idClient.safeParse(clientId).success) return { error: "Client introuvable." };

  const supabase = await createClient();
  const { data: ligne } = await supabase
    .from("client_profiles")
    .select("preferences")
    .eq("profile_id", clientId)
    .maybeSingle<{ preferences: Preferences | null }>();
  const demande = ligne?.preferences?.demande_forfait;
  if (!ligne || !demande) return { error: null, success: true };

  const { error } = await supabase
    .from("client_profiles")
    .update({ preferences: sansDemande(ligne.preferences) })
    .eq("profile_id", clientId);
  if (error) return { error: "La demande n'a pas pu être close. Réessayez." };

  await ecrireAuJournal({
    activite: "premium",
    type: "refus_demande_forfait",
    entiteType: "profil",
    entiteId: clientId,
    decision: `Demande de forfait ${forfait(demande.code)?.nom ?? demande.code} close sans changement`,
    auteur: "gerant",
  });

  revalidatePath("/admin/forfaits");
  revalidatePath("/admin/dashboard");
  return { error: null, success: true };
}
