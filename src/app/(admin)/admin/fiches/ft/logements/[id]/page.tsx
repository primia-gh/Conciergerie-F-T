import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { completudeLogement, dernieresVersions } from "@/lib/agent/fiches-modele";
import { VueLogement } from "./vue-logement";

export const metadata: Metadata = { title: "Logement" };

type LogementRow = {
  id: string;
  nom: string;
  adresse: string;
  capacite: number | null;
  statut: string;
  proprietaire: { id: string; nom: string } | { id: string; nom: string }[] | null;
};

type FicheRow = { section: string; contenu: string; version: number; created_at: string };

export default async function AdminLogementPage({ params }: PageProps<"/admin/fiches/ft/logements/[id]">) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data: logement }, { data: fiches }] = await Promise.all([
    supabase
      .from("logement")
      .select("id, nom, adresse, capacite, statut, proprietaire:proprietaire_id(id, nom)")
      .eq("id", id)
      .maybeSingle<LogementRow>(),
    supabase
      .from("fiche_connaissance")
      .select("section, contenu, version, created_at")
      .eq("logement_id", id)
      .returns<FicheRow[]>(),
  ]);
  if (!logement) notFound();

  const dernieres = dernieresVersions(fiches ?? []);
  const parSection = new Map(dernieres.map((f) => [f.section, f]));
  const completude = completudeLogement(dernieres);
  const proprietaire = Array.isArray(logement.proprietaire) ? logement.proprietaire[0] : logement.proprietaire;

  return (
    <VueLogement
      d={{
        logement: {
          id: logement.id,
          nom: logement.nom,
          adresse: logement.adresse,
          capacite: logement.capacite,
          statut: logement.statut,
        },
        proprietaire: proprietaire ?? null,
        sections: Object.fromEntries(parSection),
        completude,
      }}
    />
  );
}
