"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { restaurerVersion, type FicheFormState } from "@/server/agent/fiches-admin";
import { AvertissementsCodes } from "./fiche-form";

const initialState: FicheFormState = { error: null };

export function RestaurerBouton({ ficheId }: { ficheId: string }) {
  const [state, formAction, pending] = useActionState(restaurerVersion.bind(null, ficheId), initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div>
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Restauration…" : "Restaurer cette version"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">Restaurée : elle devient la nouvelle version actuelle.</p>}
      <AvertissementsCodes lignes={state.avertissements} />
    </form>
  );
}
