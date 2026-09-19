"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { creerLogement, type FicheFormState } from "@/server/agent/fiches-admin";

const initialState: FicheFormState = { error: null };

export function NouveauLogementForm({ proprietaires }: { proprietaires: { id: string; nom: string }[] }) {
  const [state, formAction, pending] = useActionState(creerLogement, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nom">Nom du logement</Label>
        <Input id="nom" name="nom" required maxLength={100} placeholder="Ex. Studio Petite France" disabled={pending} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="adresse">Adresse</Label>
        <Input id="adresse" name="adresse" required maxLength={200} disabled={pending} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="capacite">Capacité, en personnes (facultatif)</Label>
        <Input id="capacite" name="capacite" type="number" min={1} max={50} disabled={pending} className="max-w-32" />
      </div>

      <fieldset className="flex flex-col gap-3" disabled={pending}>
        <legend className="text-sm font-medium text-fg">Propriétaire</legend>
        {proprietaires.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proprietaireId">Un propriétaire existant</Label>
            <select
              id="proprietaireId"
              name="proprietaireId"
              defaultValue=""
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
            >
              <option value="">—</option>
              {proprietaires.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nouveauProprietaire">
            {proprietaires.length > 0 ? "…ou un nouveau propriétaire (son nom)" : "Nom du propriétaire"}
          </Label>
          <Input id="nouveauProprietaire" name="nouveauProprietaire" maxLength={100} />
        </div>
      </fieldset>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer le logement"}
        </Button>
        <p className="text-sm text-fg-muted">Il reste inactif tant que sa fiche n&apos;est pas complète.</p>
      </div>
    </form>
  );
}
