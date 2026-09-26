import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { EnTetePage, LienRetour, PAGE, TitreSection } from "@/components/espace/en-tete";
import { NIVEAU_AUTONOMIE, libelleTache } from "@/components/espace/libelles";
import { changerNiveauAutonomie } from "@/server/agent/ft-admin";
import { BoutonToutProposer } from "./bouton-tout-proposer";

export const metadata: Metadata = { title: "Réglages d'autonomie" };

type RegleRow = {
  id: string;
  domaine: string;
  tache: string;
  condition: string | null;
  action_autorisee: string | null;
  niveau_autonomie: string;
  actif: boolean;
};

const NIVEAUX = ["propose", "agit_apres_validation", "agit_seul"] as const;

export default async function AdminFtReglesPage() {
  const supabase = await createClient();

  const { data: regles } = await supabase
    .from("regle")
    .select("id, domaine, tache, condition, action_autorisee, niveau_autonomie, actif")
    .eq("activite", "ft")
    .eq("actif", true)
    .order("domaine")
    .order("tache")
    .returns<RegleRow[]>();

  const parDomaine = new Map<string, RegleRow[]>();
  for (const r of regles ?? []) {
    parDomaine.set(r.domaine, [...(parDomaine.get(r.domaine) ?? []), r]);
  }
  const autonomes = (regles ?? []).filter((r) => r.niveau_autonomie !== "propose").length;

  return (
    <div className={PAGE.etroite}>
      <LienRetour href="/admin/ft">Prospects F&amp;T</LienRetour>
      <EnTetePage surtitre="Assistant F&T" titre="Réglages d'autonomie">
        Chaque tâche de l&apos;assistant se règle séparément. Un changement s&apos;applique tout de suite et
        s&apos;écrit dans le journal.
      </EnTetePage>

      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        {NIVEAUX.map((n) => (
          <div key={n} className="rounded-lg border border-border bg-surface p-4">
            <dt>
              <Badge variant={NIVEAU_AUTONOMIE[n].variante}>{NIVEAU_AUTONOMIE[n].libelle}</Badge>
            </dt>
            <dd className="mt-2 text-sm text-fg-muted">{NIVEAU_AUTONOMIE[n].aide}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 rounded-lg border border-accent/60 bg-surface p-5">
        <BoutonToutProposer nombre={autonomes} />
      </div>

      <div className="mt-10 flex flex-col gap-10">
        {(regles ?? []).length === 0 && (
          <p className="text-sm text-fg-muted">Aucune tâche active pour l&apos;instant.</p>
        )}
        {[...parDomaine.entries()].map(([domaine, taches]) => (
          <section key={domaine} aria-labelledby={`domaine-${domaine}`}>
            <TitreSection id={`domaine-${domaine}`}>{domaine.replace(/_/g, " ")}</TitreSection>
            <ul className="mt-4 flex flex-col gap-3">
              {taches.map((r) => {
                const niveau = NIVEAU_AUTONOMIE[r.niveau_autonomie];
                return (
                  <li key={r.id} className="rounded-lg border border-border bg-surface p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-medium text-fg">{libelleTache(r.tache)}</p>
                      <Badge variant={niveau?.variante ?? "neutral"}>{niveau?.libelle ?? r.niveau_autonomie}</Badge>
                    </div>
                    {r.action_autorisee && <p className="mt-2 text-sm text-fg-muted">{r.action_autorisee}</p>}
                    {r.condition && <p className="mt-1 text-xs text-fg-faint">Condition : {r.condition}</p>}
                    {/* Clé liée au niveau : le formulaire repart de la valeur enregistrée après chaque changement. */}
                    <form
                      key={r.niveau_autonomie}
                      action={changerNiveauAutonomie.bind(null, r.id)}
                      className="mt-4 flex flex-col gap-2 sm:flex-row"
                    >
                      <label htmlFor={`niveau-${r.id}`} className="sr-only">
                        Niveau d&apos;autonomie : {libelleTache(r.tache)}
                      </label>
                      <NativeSelect
                        id={`niveau-${r.id}`}
                        name="niveauAutonomie"
                        defaultValue={r.niveau_autonomie}
                        className="flex-1"
                      >
                        {NIVEAUX.map((n) => (
                          <option key={n} value={n}>
                            {NIVEAU_AUTONOMIE[n].libelle} — {NIVEAU_AUTONOMIE[n].aide}
                          </option>
                        ))}
                      </NativeSelect>
                      <Button type="submit" variant="secondary">
                        Appliquer
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
