"use client";

import { useActionState } from "react";
import { AvertissementsCodes } from "@/app/(admin)/admin/fiches/_components/fiche-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ajouterALaFiche, type FicheFormState } from "@/server/agent/fiches-admin";

const initialState: FicheFormState = { error: null };

/**
 * Proposition d'enrichir une fiche avec ce que le Gérant vient d'apprendre.
 * Repliée par défaut : l'ignorer, c'est ne pas l'ouvrir.
 */
export function AjoutFicheForm({
  demandeId,
  options,
  ligneInitiale,
}: {
  demandeId: string;
  options: { value: string; label: string }[];
  ligneInitiale: string;
}) {
  const [state, formAction, pending] = useActionState(ajouterALaFiche.bind(null, demandeId), initialState);

  return (
    <details className="mt-6 rounded-md border border-border bg-surface p-4">
      <summary className="cursor-pointer text-sm font-medium text-accent">
        Ajouter cette information à une fiche ?
      </summary>
      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <p className="text-sm text-fg-muted">
          Si vous avez dû corriger ou répondre vous-même, c&apos;est peut-être qu&apos;une fiche est incomplète.
          Écrivez l&apos;information en une ligne courte : elle sera ajoutée à la fin de la fiche, dans une
          nouvelle version.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cible">Fiche à enrichir</Label>
          <select
            id="cible"
            name="cible"
            required
            defaultValue=""
            disabled={pending}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
          >
            <option value="" disabled>
              Choisissez…
            </option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ligne">Information à ajouter</Label>
          <Textarea id="ligne" name="ligne" rows={4} defaultValue={ligneInitiale} disabled={pending} />
          <p className="text-sm text-fg-muted">
            Prérempli avec votre réponse : raccourcissez-le à l&apos;information utile, sans code ni mot de passe.
          </p>
        </div>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        {state.success && <p className="text-sm text-success">Information ajoutée : nouvelle version de la fiche.</p>}
        <AvertissementsCodes lignes={state.avertissements} />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Ajout…" : "Ajouter à la fiche"}
          </Button>
        </div>
      </form>
    </details>
  );
}
