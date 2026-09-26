import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VueProspect, type DonneesProspect } from "./vue-prospect";

export const metadata: Metadata = { title: "Prospect F&T" };

type BienRow = DonneesProspect["bien"] & {
  proprietaire: DonneesProspect["proprietaire"] | DonneesProspect["proprietaire"][] | null;
};

export default async function AdminFtProspectDetailPage({ params }: PageProps<"/admin/ft/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: bienProspect } = await supabase
    .from("bien_prospect")
    .select(
      "id, type, adresse, residence_principale, capacite, equipements, disponibilite_souhaitee, created_at, proprietaire:proprietaire_id(id, nom, email, telephone, statut, source, notes)",
    )
    .eq("id", id)
    .maybeSingle<BienRow>();

  if (!bienProspect || !bienProspect.proprietaire) {
    notFound();
  }
  const proprietaire = Array.isArray(bienProspect.proprietaire)
    ? bienProspect.proprietaire[0]
    : bienProspect.proprietaire;
  if (!proprietaire) notFound();

  const [{ data: messages }, { data: rendezVous }] = await Promise.all([
    supabase
      .from("message_agent")
      .select("id, canal, contenu, auteur, statut, created_at")
      .eq("bien_prospect_id", id)
      .order("created_at", { ascending: true })
      .returns<DonneesProspect["messages"]>(),
    supabase
      .from("rendez_vous")
      .select("id, creneau, canal, statut")
      .eq("bien_prospect_id", id)
      .order("creneau", { ascending: true })
      .returns<DonneesProspect["rendezVous"]>(),
  ]);

  return (
    <VueProspect
      d={{
        bien: {
          id: bienProspect.id,
          type: bienProspect.type,
          adresse: bienProspect.adresse,
          residence_principale: bienProspect.residence_principale,
          capacite: bienProspect.capacite,
          equipements: bienProspect.equipements,
          disponibilite_souhaitee: bienProspect.disponibilite_souhaitee,
          created_at: bienProspect.created_at,
        },
        proprietaire,
        messages: messages ?? [],
        rendezVous: rendezVous ?? [],
      }}
    />
  );
}
