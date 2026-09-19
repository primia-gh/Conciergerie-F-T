"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { creerDemande } from "@/server/agent/boite";
import type { FormState } from "@/server/agent/ft-admin";

const initialState: FormState = { error: null };

export function NouvelleDemandeForm() {
  const [state, formAction, pending] = useActionState(creerDemande, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2" disabled={pending}>
        <legend className="text-sm font-medium text-fg">Pour quelle activité ?</legend>
        <div className="flex gap-6 text-sm text-fg">
          {/* Aucune option cochée par défaut : l'activité se choisit à chaque fois, l'agent ne la devine pas. */}
          <label className="flex items-center gap-2">
            <input type="radio" name="activite" value="ft" required />
            F&amp;T (location courte durée)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="activite" value="premium" required />
            Premium (abonnement particuliers)
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expediteur">De la part de (facultatif)</Label>
        <Input
          id="expediteur"
          name="expediteur"
          maxLength={100}
          placeholder="Ex. voyageuse du logement Rivoli, cliente Premium…"
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contenu">Message reçu</Label>
        <Textarea
          id="contenu"
          name="contenu"
          rows={8}
          required
          placeholder="Collez ici le message tel que vous l'avez reçu."
          disabled={pending}
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Préparation en cours…" : "Préparer une réponse"}
        </Button>
        <p className="text-sm text-fg-muted">Rien n&apos;est envoyé : vous relisez avant de copier.</p>
      </div>
    </form>
  );
}
