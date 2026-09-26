"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendProposal } from "@/server/proposals/actions";

/** Envoi au client, en deux temps : une proposition envoyée ne se modifie plus. */
export function SendProposalButton({
  proposalId,
  requestId,
  disabled,
}: {
  proposalId: string;
  requestId: string;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmer, setConfirmer] = useState(false);
  const { toast } = useToast();

  function envoyer() {
    startTransition(async () => {
      const result = await sendProposal(proposalId, requestId);
      // sendProposal redirige en cas de succès ; un retour signifie une erreur.
      if (result?.error) {
        toast({ title: "Envoi impossible", description: result.error, variant: "danger" });
        setConfirmer(false);
      }
    });
  }

  if (!confirmer) {
    return (
      <Button size="lg" className="w-full" onClick={() => setConfirmer(true)} disabled={disabled}>
        <Send aria-hidden="true" className="h-4 w-4" />
        Envoyer au client
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-fg">Envoyer maintenant ? Vous ne pourrez plus modifier cette proposition.</p>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={envoyer} disabled={pending} aria-busy={pending}>
          {pending ? "Envoi…" : "Confirmer l'envoi"}
        </Button>
        <Button variant="ghost" onClick={() => setConfirmer(false)} disabled={pending}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
