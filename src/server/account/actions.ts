"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";

export type ExportDataState = { error: string | null; data: string | null };

/**
 * Export RGPD (droit à la portabilité) : rassemble toutes les données
 * personnelles du compte courant dans un unique JSON. Chaque requête est
 * explicitement filtrée sur `profile.id` — la RLS s'applique en plus, mais
 * ne suffirait pas seule à empêcher une requête non filtrée de remonter les
 * lignes d'un autre client vu par le même concierge, par ex.
 */
export async function exportMyData(): Promise<ExportDataState> {
  const profile = await assertRole("client", "concierge", "admin", "partner");
  const supabase = await createClient();

  const [
    profileRow,
    requestsAsClient,
    requestsAsConcierge,
    messages,
    bookings,
    notifications,
    attachments,
    proposals,
    partnerRecord,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", profile.id).maybeSingle(),
    supabase.from("requests").select("*").eq("client_id", profile.id),
    supabase.from("requests").select("*").eq("concierge_id", profile.id),
    supabase.from("messages").select("*").eq("sender_id", profile.id),
    supabase.from("bookings").select("*").eq("client_id", profile.id),
    supabase.from("notifications").select("*").eq("user_id", profile.id),
    supabase.from("request_attachments").select("*").eq("uploaded_by", profile.id),
    supabase.from("proposals").select("*").eq("concierge_id", profile.id),
    supabase.from("partners").select("*").eq("profile_id", profile.id).maybeSingle(),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profileRow.data,
    requests_as_client: requestsAsClient.data ?? [],
    requests_as_concierge: requestsAsConcierge.data ?? [],
    messages_sent: messages.data ?? [],
    bookings: bookings.data ?? [],
    notifications: notifications.data ?? [],
    request_attachments_uploaded: attachments.data ?? [],
    proposals_authored: proposals.data ?? [],
    partner_record: partnerRecord.data ?? null,
  };

  return { error: null, data: JSON.stringify(payload, null, 2) };
}

export type DeleteAccountState = { error: string | null };

/**
 * Suppression de compte (RGPD, droit à l'effacement). Soft-delete sur
 * `profiles` : anonymise les champs personnels et pose `deleted_at`, ce qui
 * déclenche le trigger `handle_profile_soft_delete` (migration 0013) qui
 * bannit définitivement le compte Supabase Auth correspondant. Les données
 * métier liées (demandes, messages, réservations) sont conservées — elles
 * concernent aussi d'autres utilisateurs (client/concierge) et servent de
 * preuve de transaction ; seules les données directement personnelles sont
 * effacées ici, conformément à la note DATABASE.md §soft-delete.
 */
export async function deleteMyAccount(): Promise<DeleteAccountState> {
  const profile = await assertRole("client", "concierge", "admin", "partner");
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      deleted_at: new Date().toISOString(),
      first_name: null,
      last_name: null,
      phone: null,
      avatar_url: null,
      email: null,
    })
    .eq("id", profile.id);

  if (error) {
    return { error: "Impossible de supprimer le compte pour le moment. Réessayez." };
  }

  await supabase.auth.signOut();
  redirect("/compte-supprime");
}
