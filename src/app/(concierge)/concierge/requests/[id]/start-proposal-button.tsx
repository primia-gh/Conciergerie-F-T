"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { startProposal } from "@/server/proposals/actions";

export function StartProposalButton({ requestId, label }: { requestId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await startProposal(requestId);
      if (result.error || !result.proposalId) {
        toast({ title: "Impossible de continuer", description: result.error ?? "", variant: "danger" });
        return;
      }
      router.push(`/concierge/requests/${requestId}/proposals/${result.proposalId}`);
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      {pending ? "..." : label}
    </Button>
  );
}
