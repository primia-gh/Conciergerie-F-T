"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendProposal } from "@/server/proposals/actions";

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
  const { toast } = useToast();

  function handleClick() {
    startTransition(async () => {
      const result = await sendProposal(proposalId, requestId);
      // sendProposal redirige en cas de succès ; un retour signifie une erreur.
      if (result?.error) {
        toast({ title: "Envoi impossible", description: result.error, variant: "danger" });
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={disabled || pending}>
      {pending ? "Envoi..." : "Envoyer au client"}
    </Button>
  );
}
