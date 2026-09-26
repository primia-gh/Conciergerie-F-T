import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { LienRetour, PAGE, TitreSection, surtitre } from "@/components/espace/en-tete";
import type { SectionModele } from "@/lib/agent/fiches-modele";
import { lireVersions, type VersionFiche } from "@/server/agent/fiches-lecture";
import { dateCourte, heure } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { FicheForm } from "./fiche-form";
import { RestaurerBouton } from "./restaurer-bouton";

type Props = {
  activite: "ft" | "premium";
  logementId: string | null;
  section: SectionModele;
  retour: { href: string; libelle: string };
  titre: string;
};

/**
 * Éditeur d'une section de fiche + historique de ses versions. Partagé par les
 * fiches globales (offre F&T, sections Premium) et les fiches de logement.
 */
export async function EditeurSection(props: Props) {
  const supabase = await createClient();
  const versions = await lireVersions(supabase, {
    activite: props.activite,
    logementId: props.logementId,
    section: props.section.cle,
  });
  return <VueEditeurSection {...props} versions={versions} />;
}

/** Présentation de l'éditeur (sans lecture en base). */
export function VueEditeurSection({
  activite,
  logementId,
  section,
  retour,
  titre,
  versions,
}: Props & { versions: VersionFiche[] }) {
  const actuelle = versions[0];

  return (
    <div className={PAGE.large}>
      <LienRetour href={retour.href}>{retour.libelle}</LienRetour>
      <header>
        <p className={cn(surtitre, "text-accent")}>
          {activite === "ft" ? "Conciergerie F&T" : "Conciergerie Premium"} · fiche
        </p>
        <h1 className="mt-3 font-display text-4xl break-words text-fg">{titre}</h1>
        <p className="mt-3 max-w-3xl leading-relaxed text-fg-muted">{section.aide}</p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="titre-contenu" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TitreSection id="titre-contenu">Contenu</TitreSection>
            {actuelle && (
              <p className="text-xs text-fg-faint">
                Version {actuelle.version} · {dateCourte(actuelle.created_at)} à {heure(actuelle.created_at)}
              </p>
            )}
          </div>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-fg-muted">
            <li>Une information par ligne, pas de paragraphes : c&apos;est ce que l&apos;assistant lit pour répondre.</li>
            <li>Chaque enregistrement crée une nouvelle version ; les anciennes restent dans l&apos;historique.</li>
            {logementId && <li>Ni code ni mot de passe : écrivez « transmis par le Gérant ».</li>}
          </ul>
          <div className="mt-5">
            <FicheForm activite={activite} logementId={logementId} section={section.cle} contenu={actuelle?.contenu ?? ""} />
          </div>
        </section>

        <aside aria-labelledby="titre-historique">
          <TitreSection id="titre-historique" compte={versions.length} className="gap-2">
            <History aria-hidden="true" className="h-3.5 w-3.5" />
            Historique
          </TitreSection>
          {versions.length === 0 ? (
            <p className="mt-4 text-sm text-fg-muted">Aucune version pour l&apos;instant.</p>
          ) : (
            <ol className="mt-4 flex flex-col gap-3">
              {versions.map((v, index) => (
                <li key={v.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-fg">Version {v.version}</span>
                    {index === 0 && <Badge variant="success">Actuelle</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-fg-faint">
                    {dateCourte(v.created_at)} à {heure(v.created_at)}
                    {v.auteur ? ` · ${v.auteur}` : ""}
                  </p>
                  <details className="mt-2">
                    <summary className="flex min-h-9 cursor-pointer items-center text-sm text-fg-muted hover:text-fg">
                      Voir le contenu
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-bg-subtle p-3 font-mono text-xs whitespace-pre-wrap text-fg">
                      {v.contenu}
                    </pre>
                  </details>
                  {index !== 0 && (
                    <div className="mt-3">
                      <RestaurerBouton ficheId={v.id} />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
