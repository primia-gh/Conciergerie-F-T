"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/server/auth/guards";
import { ecrireAuJournal } from "@/lib/agent/journal";

export type FormState = { error: string | null; success?: boolean };

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
      activite: "ft",
      type: "changement_autonomie",
      entiteType: "regle",
      entiteId: regleId,
      decision: `Tâche "${avant.tache}" : ${avant.niveau_autonomie} → ${niveau}`,
      auteur: "gerant",
    });
  }

  revalidatePath("/admin/ft/regles");
}

/**
 * « Un bouton unique ramène toutes les tâches au niveau 1 » (cahier des charges,
 * niveaux d'autonomie) : chaque tâche F&T active qui n'est pas à « Propose » y
 * revient, avec une nouvelle version de la règle et une ligne de journal chacune.
 */
export async function toutRemettreEnPropose(): Promise<void> {
  await assertRole("admin");

  const supabase = await createClient();
  const { data: regles } = await supabase
    .from("regle")
    .select("id, tache, niveau_autonomie, version")
    .eq("activite", "ft")
    .eq("actif", true)
    .in("niveau_autonomie", ["agit_apres_validation", "agit_seul"])
    .returns<{ id: string; tache: string; niveau_autonomie: string; version: number }[]>();

  for (const r of regles ?? []) {
    const { error } = await supabase
      .from("regle")
      .update({ niveau_autonomie: "propose", version: (r.version ?? 1) + 1 })
      .eq("id", r.id);
    if (error) continue;
    await ecrireAuJournal({
      activite: "ft",
      type: "changement_autonomie",
      entiteType: "regle",
      entiteId: r.id,
      decision: `Tâche "${r.tache}" : ${r.niveau_autonomie} → propose (tout remis en « Propose »)`,
      auteur: "gerant",
    });
  }

  revalidatePath("/admin/ft/regles");
  revalidatePath("/admin/dashboard");
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
    activite: "ft",
    type: "changement_statut_proprietaire",
    entiteType: "proprietaire",
    entiteId: proprietaireId,
    decision: `Statut réglé sur "${statut}"`,
    auteur: "gerant",
  });

  revalidatePath(`/admin/ft/${bienProspectId}`);
  revalidatePath("/admin/ft");
}
