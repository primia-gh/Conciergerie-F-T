import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { changerNiveauAutonomie } from "@/server/agent/ft-admin";

type RegleRow = {
  id: string;
  domaine: string;
  tache: string;
  condition: string | null;
  action_autorisee: string | null;
  niveau_autonomie: string;
  actif: boolean;
};

const NIVEAUX = [
  { value: "propose", label: "Propose — rien ne part sans vous" },
  { value: "agit_apres_validation", label: "Agit après validation — attend un clic" },
  { value: "agit_seul", label: "Agit seul — part directement, journalisé" },
] as const;

const NIVEAU_VARIANT: Record<string, "neutral" | "warning" | "success"> = {
  propose: "neutral",
  agit_apres_validation: "warning",
  agit_seul: "success",
};

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

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/ft" className="text-sm text-fg-muted hover:text-fg">
        ← Retour aux prospects
      </Link>
      <h1 className="mt-4 font-display text-2xl font-medium text-fg">Réglages d&apos;autonomie</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Chaque tâche de l&apos;agent est réglable indépendamment. Un changement s&apos;applique
        immédiatement et est journalisé.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {[...parDomaine.entries()].map(([domaine, taches]) => (
          <div key={domaine}>
            <h2 className="font-display text-lg font-medium text-fg capitalize">{domaine}</h2>
            <div className="mt-3 flex flex-col gap-3">
              {taches.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex flex-col gap-2 pt-5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-fg">{r.tache.replace(/_/g, " ")}</p>
                      <Badge variant={NIVEAU_VARIANT[r.niveau_autonomie]}>{r.niveau_autonomie}</Badge>
                    </div>
                    {r.action_autorisee && <p className="text-sm text-fg-muted">{r.action_autorisee}</p>}
                    {r.condition && (
                      <p className="text-xs text-fg-faint">Condition : {r.condition}</p>
                    )}
                    <form action={changerNiveauAutonomie.bind(null, r.id)} className="mt-1 flex gap-2">
                      <select
                        name="niveauAutonomie"
                        defaultValue={r.niveau_autonomie}
                        className="h-9 flex-1 rounded-sm border border-border bg-bg px-2 text-sm text-fg"
                      >
                        {NIVEAUX.map((n) => (
                          <option key={n.value} value={n.value}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="h-9 rounded-sm border border-border bg-surface px-3 text-sm text-fg hover:bg-bg-subtle"
                      >
                        Appliquer
                      </button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
