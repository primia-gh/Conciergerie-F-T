import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FILTRES, VueProspects, type ProspectRow } from "./vue-prospects";

export const metadata: Metadata = { title: "Prospects F&T" };

export default async function AdminFtProspectsPage({ searchParams }: PageProps<"/admin/ft">) {
  const { statut: brut } = await searchParams;
  const statut = FILTRES.find((f) => f === brut) ?? null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("bien_prospect")
    .select(
      "id, type, adresse, capacite, created_at, proprietaire:proprietaire_id(id, nom, telephone, statut, source)",
    )
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<ProspectRow[]>();

  return <VueProspects data={data ?? []} statut={statut} />;
}
