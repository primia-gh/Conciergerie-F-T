import { notFound } from "next/navigation";
import { trouverSection } from "@/lib/agent/fiches-modele";
import { EditeurSection } from "../../_components/editeur-section";

const ACTIVITES = ["ft", "premium"] as const;

/** Fiches globales d'une activité : offre F&T, sections Premium. */
export default async function AdminFicheGlobalePage({ params }: PageProps<"/admin/fiches/[activite]/[section]">) {
  const { activite, section: cle } = await params;

  const activiteValide = ACTIVITES.find((a) => a === activite);
  if (!activiteValide) notFound();
  const section = trouverSection(activiteValide, "globale", cle);
  if (!section) notFound();

  return (
    <EditeurSection
      activite={activiteValide}
      logementId={null}
      section={section}
      retour={{ href: "/admin/fiches", libelle: "Retour aux fiches" }}
      titre={`${activiteValide === "ft" ? "F&T" : "Premium"} — ${section.libelle}`}
    />
  );
}
