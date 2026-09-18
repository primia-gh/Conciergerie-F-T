"use client";

import { useActionState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { mettreAJourFicheOffre, type FormState } from "@/server/agent/ft-admin";

const initialState: FormState = { error: null };

export function FicheOffreForm({ contenu }: { contenu: string }) {
  const [state, formAction, pending] = useActionState(mettreAJourFicheOffre, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Textarea
        name="contenu"
        defaultValue={contenu}
        rows={20}
        className="font-mono text-sm"
        placeholder="Une information par ligne — c'est ce que l'agent lit pour répondre aux prospects."
      />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">Nouvelle version enregistrée.</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer une nouvelle version"}
        </Button>
      </div>
    </form>
  );
}
