"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { activerLogement, desactiverLogement, type FicheFormState } from "@/server/agent/fiches-admin";

const initialState: FicheFormState = { error: null };

export function ActivationBoutons({ logementId, actif }: { logementId: string; actif: boolean }) {
  const [state, formAction, pending] = useActionState(
    actif ? desactiverLogement.bind(null, logementId) : activerLogement.bind(null, logementId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div>
        <Button type="submit" variant={actif ? "secondary" : "primary"} disabled={pending}>
          {pending
            ? "Un instant…"
            : actif
              ? "Retirer de l'assistant"
              : "Activer pour l'assistant"}
        </Button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
