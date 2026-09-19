import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SectionModele } from "@/lib/agent/fiches-modele";
import { lireVersions } from "@/server/agent/fiches-lecture";
import { FicheForm } from "./fiche-form";
import { RestaurerBouton } from "./restaurer-bouton";

/**
 * Éditeur d'une section de fiche + historique de ses versions. Partagé par les
 * fiches globales (offre F&T, sections Premium) et les fiches de logement.
 */
export async function EditeurSection({
  activite,
  logementId,
  section,
  retour,
  titre,
}: {
  activite: "ft" | "premium";
  logementId: string | null;
  section: SectionModele;
  retour: { href: string; libelle: string };
  titre: string;
}) {
  const supabase = await createClient();
  const versions = await lireVersions(supabase, { activite, logementId, section: section.cle });
  const actuelle = versions[0];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href={retour.href} className="text-sm text-fg-muted hover:text-fg">
        ← {retour.libelle}
      </Link>
      <h1 className="mt-4 font-display text-2xl font-medium text-fg">{titre}</h1>
      <p className="mt-2 text-sm text-fg-muted">{section.aide}</p>
      <p className="mt-2 text-sm text-fg-muted">
        Une information par ligne, pas de paragraphes : c&apos;est ce que l&apos;assistant lit pour répondre.
        Chaque enregistrement crée une nouvelle version, les anciennes restent consultables ci-dessous.
        {logementId && " N'écrivez ni code ni mot de passe : notez « transmis par le Gérant »."}
      </p>
      {actuelle && (
        <p className="mt-2 text-xs text-fg-faint">
          Version actuelle : {actuelle.version} · enregistrée le {new Date(actuelle.created_at).toLocaleString("fr-FR")}
        </p>
      )}

      <div className="mt-6">
        <FicheForm activite={activite} logementId={logementId} section={section.cle} contenu={actuelle?.contenu ?? ""} />
      </div>

      <h2 className="mt-12 font-display text-lg font-medium text-fg">Historique</h2>
      {versions.length === 0 ? (
        <p className="mt-4 text-sm text-fg-muted">Aucune version pour l&apos;instant.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {versions.map((v, index) => (
            <li key={v.id}>
              <Card>
                <CardHeader className="flex-row items-center gap-3">
                  <CardTitle className="text-base">Version {v.version}</CardTitle>
                  {index === 0 && <Badge variant="success">Actuelle</Badge>}
                  <span className="text-sm text-fg-muted">
                    {new Date(v.created_at).toLocaleString("fr-FR")}
                    {v.auteur ? ` · ${v.auteur}` : ""}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <details>
                    <summary className="cursor-pointer text-sm text-fg-muted hover:text-fg">Voir le contenu</summary>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-sm text-fg">{v.contenu}</pre>
                  </details>
                  {index !== 0 && <RestaurerBouton ficheId={v.id} />}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
