import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FicheOffreForm } from "./fiche-offre-form";

export default async function AdminFtOffrePage() {
  const supabase = await createClient();

  const { data: fiche } = await supabase
    .from("fiche_connaissance")
    .select("contenu, version, updated_at")
    .is("logement_id", null)
    .eq("section", "offre_ft")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/ft" className="text-sm text-fg-muted hover:text-fg">
        ← Retour aux prospects
      </Link>
      <h1 className="mt-4 font-display text-2xl font-medium text-fg">Fiche offre F&amp;T</h1>
      <p className="mt-2 text-sm text-fg-muted">
        C&apos;est la seule source à partir de laquelle l&apos;agent répond aux prospects — une
        information par ligne, pas de paragraphes. Chaque enregistrement crée une nouvelle
        version, l&apos;ancienne reste consultable dans l&apos;historique de la base.
      </p>
      {fiche && (
        <p className="mt-2 text-xs text-fg-faint">
          Version actuelle : {fiche.version} · modifiée le{" "}
          {new Date(fiche.updated_at).toLocaleString("fr-FR")}
        </p>
      )}
      <div className="mt-6">
        <FicheOffreForm contenu={fiche?.contenu ?? ""} />
      </div>
    </div>
  );
}
