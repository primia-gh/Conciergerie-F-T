import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { trouverSection } from "@/lib/agent/fiches-modele";
import { EditeurSection } from "../../../../_components/editeur-section";

/** Section de la fiche d'un logement F&T (accès, équipements, règles, dépannage…). */
export default async function AdminFicheLogementSectionPage({
  params,
}: PageProps<"/admin/fiches/ft/logements/[id]/[section]">) {
  const { id, section: cle } = await params;

  if (!z.string().uuid().safeParse(id).success) notFound();
  const section = trouverSection("ft", "logement", cle);
  if (!section) notFound();

  const supabase = await createClient();
  const { data: logement } = await supabase.from("logement").select("id, nom").eq("id", id).maybeSingle();
  if (!logement) notFound();

  return (
    <EditeurSection
      activite="ft"
      logementId={id}
      section={section}
      retour={{ href: `/admin/fiches/ft/logements/${id}`, libelle: `Retour à ${logement.nom}` }}
      titre={`${logement.nom} — ${section.libelle}`}
    />
  );
}
