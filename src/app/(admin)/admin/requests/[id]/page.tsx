import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { HistoryRow, RequestDetailFields } from "@/components/features/request-detail-card";
import { VueDemandeGerant, type DonneesDemandeGerant } from "./vue-demande-gerant";

export const metadata: Metadata = { title: "Demande Premium" };

type RequestRow = RequestDetailFields & {
  id: string;
  title: string;
  status: string;
  created_at: string;
  client_id: string;
  concierge_id: string | null;
  categories: { name: string; icon: string | null } | null;
};

type ProfilRow = { id: string; first_name: string | null; last_name: string | null };

const nomDe = (p: ProfilRow | undefined) =>
  p ? { id: p.id, nom: [p.first_name, p.last_name].filter(Boolean).join(" ") } : null;

/** Détail d'une demande Premium pour le Gérant, en lecture seule (RLS : l'admin lit tout). */
export default async function AdminRequestDetailPage({ params }: PageProps<"/admin/requests/[id]">) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("requests")
    .select(
      "id, title, description, status, priority, location_text, requested_date, requested_time, budget_min, budget_max, preferences, created_at, client_id, concierge_id, categories(name, icon)",
    )
    .eq("id", id)
    .maybeSingle<RequestRow>();
  if (!request) notFound();

  const [{ data: history }, { data: attachments }, { data: messages }, { data: proposals }, { data: booking }, { data: profils }] =
    await Promise.all([
      supabase
        .from("request_status_history")
        .select("id, from_status, to_status, note, created_at")
        .eq("request_id", id)
        .order("created_at", { ascending: true })
        .returns<HistoryRow[]>(),
      supabase
        .from("request_attachments")
        .select("id, file_name, storage_path")
        .eq("request_id", id)
        .returns<{ id: string; file_name: string; storage_path: string }[]>(),
      supabase
        .from("messages")
        .select("id, body, sender_id, created_at, is_internal_note")
        .eq("request_id", id)
        .order("created_at", { ascending: true })
        .returns<DonneesDemandeGerant["messages"]>(),
      supabase
        .from("proposals")
        .select("id, status, created_at, proposal_options(id, name, price, is_selected)")
        .eq("request_id", id)
        .order("created_at", { ascending: false })
        .returns<
          {
            id: string;
            status: string;
            created_at: string;
            proposal_options: DonneesDemandeGerant["propositions"][number]["options"];
          }[]
        >(),
      supabase
        .from("bookings")
        .select("status, proposal_options(name, price)")
        .eq("request_id", id)
        .maybeSingle<{ status: string; proposal_options: { name: string; price: string } | null }>(),
      supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", [request.client_id, request.concierge_id].filter((v): v is string => !!v))
        .returns<ProfilRow[]>(),
    ]);

  const piecesJointes = await Promise.all(
    (attachments ?? []).map(async (a) => {
      const { data: signed } = await supabase.storage.from("request-attachments").createSignedUrl(a.storage_path, 60 * 10);
      return { id: a.id, file_name: a.file_name, url: signed?.signedUrl ?? null };
    }),
  );

  const profilParId = new Map((profils ?? []).map((p) => [p.id, p]));

  return (
    <VueDemandeGerant
      d={{
        demande: { ...request, categorie: request.categories?.name ?? null, icone: request.categories?.icon ?? null },
        client: nomDe(profilParId.get(request.client_id)),
        concierge: request.concierge_id ? nomDe(profilParId.get(request.concierge_id)) : null,
        historique: history ?? [],
        piecesJointes,
        propositions: (proposals ?? []).map((p) => ({
          id: p.id,
          status: p.status,
          created_at: p.created_at,
          options: p.proposal_options ?? [],
        })),
        reservation: booking
          ? {
              optionName: booking.proposal_options?.name ?? "—",
              optionPrice: booking.proposal_options?.price ?? "0",
              status: booking.status,
            }
          : null,
        messages: messages ?? [],
      }}
    />
  );
}
