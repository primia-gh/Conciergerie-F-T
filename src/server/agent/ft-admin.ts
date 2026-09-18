"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";
import { ecrireAuJournal } from "@/lib/agent/journal";

export type FormState = { error: string | null; success?: boolean };

const ficheOffreSchema = z.object({
  contenu: z.string().trim().min(20, "Le contenu est trop court."),
});

/**
 * Nouvelle version de la fiche offre F&T — jamais un update en place : on
 * insère une nouvelle ligne avec le numéro de version suivant, l'ancienne
 * reste consultable ("chaque version est conservée", cahier des charges).
 */
export async function mettreAJourFicheOffre(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertRole("admin");

  const parsed = ficheOffreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();

  const { data: derniere } = await supabase
    .from("fiche_connaissance")
    .select("version")
    .is("logement_id", null)
    .eq("section", "offre_ft")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("fiche_connaissance").insert({
    logement_id: null,
    section: "offre_ft",
    contenu: parsed.data.contenu,
    version: (derniere?.version ?? 0) + 1,
    auteur: "gerant",
  });

  if (error) return { error: error.message };

  await ecrireAuJournal({
    type: "mise_a_jour_fiche_offre",
    entiteType: "fiche_connaissance",
    decision: "Fiche offre F&T modifiée par le gérant",
    auteur: "gerant",
  });

  revalidatePath("/admin/ft/offre");
  return { error: null, success: true };
}

const niveauxAutonomie = ["propose", "agit_apres_validation", "agit_seul"] as const;

export async function changerNiveauAutonomie(regleId: string, formData: FormData): Promise<void> {
  await assertRole("admin");

  const niveau = niveauxAutonomie.find((n) => n === formData.get("niveauAutonomie"));
  if (!niveau) return;

  const supabase = await createClient();
  const { data: avant } = await supabase
    .from("regle")
    .select("tache, niveau_autonomie, version")
    .eq("id", regleId)
    .maybeSingle();

  await supabase
    .from("regle")
    .update({ niveau_autonomie: niveau, version: (avant?.version ?? 1) + 1 })
    .eq("id", regleId);

  if (avant && avant.niveau_autonomie !== niveau) {
    await ecrireAuJournal({
      type: "changement_autonomie",
      entiteType: "regle",
      entiteId: regleId,
      decision: `Tâche "${avant.tache}" : ${avant.niveau_autonomie} → ${niveau}`,
      auteur: "gerant",
    });
  }

  revalidatePath("/admin/ft/regles");
}

const statutsProprietaire = ["prospect", "en_discussion", "client", "perdu"] as const;

export async function changerStatutProprietaire(
  proprietaireId: string,
  bienProspectId: string,
  formData: FormData,
): Promise<void> {
  await assertRole("admin");

  const statut = statutsProprietaire.find((s) => s === formData.get("statut"));
  if (!statut) return;

  const supabase = await createClient();
  await supabase.from("proprietaire").update({ statut }).eq("id", proprietaireId);

  await ecrireAuJournal({
    type: "changement_statut_proprietaire",
    entiteType: "proprietaire",
    entiteId: proprietaireId,
    decision: `Statut réglé sur "${statut}"`,
    auteur: "gerant",
  });

  revalidatePath(`/admin/ft/${bienProspectId}`);
  revalidatePath("/admin/ft");
}
