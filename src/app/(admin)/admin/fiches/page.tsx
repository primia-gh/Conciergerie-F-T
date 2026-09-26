import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { lireResumeFiches } from "@/server/agent/fiches-lecture";
import { VueFiches, type LogementRow } from "./vue-fiches";

export const metadata: Metadata = { title: "Fiches" };

export default async function AdminFichesPage() {
  const supabase = await createClient();

  const [resume, { data: logements }, { data: proprietaires }] = await Promise.all([
    lireResumeFiches(supabase),
    supabase
      .from("logement")
      .select("id, nom, adresse, statut, proprietaire:proprietaire_id(nom)")
      .order("created_at", { ascending: false })
      .returns<LogementRow[]>(),
    supabase.from("proprietaire").select("id, nom").order("nom").returns<{ id: string; nom: string }[]>(),
  ]);

  return <VueFiches resume={resume} logements={logements ?? []} proprietaires={proprietaires ?? []} />;
}
