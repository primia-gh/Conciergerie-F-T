import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VueBoite, type DemandeRow, type FiltreBoite } from "./vue-boite";

export const metadata: Metadata = { title: "Boîte de réception" };

// Préparer un brouillon appelle le modèle (plusieurs secondes) : la durée
// autorisée s'applique à l'action serveur du formulaire, placé sur cette page.
export const maxDuration = 60;

const FILTRES: FiltreBoite[] = ["a_traiter", "traitees"];

export default async function AdminBoitePage({ searchParams }: PageProps<"/admin/boite">) {
  const { vue } = await searchParams;
  const filtre = FILTRES.find((f) => f === vue) ?? "toutes";

  const supabase = await createClient();

  const [{ data: logements }, { data: demandes }] = await Promise.all([
    supabase
      .from("logement")
      .select("id, nom")
      .eq("statut", "actif")
      .order("nom")
      .returns<{ id: string; nom: string }[]>(),
    supabase
      .from("demande")
      .select(
        "id, activite, statut, expediteur, contenu_recu, categorie_escalade, escalade_urgente, traite_le, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<DemandeRow[]>(),
  ]);

  return <VueBoite demandes={demandes ?? []} logements={logements ?? []} filtre={filtre} />;
}
