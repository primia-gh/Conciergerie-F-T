import { redirect } from "next/navigation";

// La fiche offre F&T se modifie désormais dans l'éditeur commun des fiches.
export default function AdminFtOffrePage() {
  redirect("/admin/fiches/ft/offre_ft");
}
