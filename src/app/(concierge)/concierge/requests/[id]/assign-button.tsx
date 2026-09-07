"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { assignRequest } from "@/server/requests/actions";

export function AssignButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleClick() {
    startTransition(async () => {
      const result = await assignRequest(requestId);
      if (result.error) {
        toast({ title: "Non pris en charge", description: result.error, variant: "danger" });
      } else {
        toast({ title: "Demande prise en charge", variant: "success" });
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      {pending ? "Prise en charge..." : "Prendre en charge"}
    </Button>
  );
}
