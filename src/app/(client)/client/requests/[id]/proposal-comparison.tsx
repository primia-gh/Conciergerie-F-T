"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { respondToProposal, type RespondToProposalState } from "@/server/proposals/actions";

export type OptionForComparison = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  address: string | null;
  conditions: string | null;
  advantages: string | null;
  is_selected: boolean;
};

const initialState: RespondToProposalState = { error: null };

export function ProposalComparison({
  proposalId,
  requestId,
  status,
  options,
}: {
  proposalId: string;
  requestId: string;
  status: string;
  options: OptionForComparison[];
}) {
  const [state, formAction, pending] = useActionState(respondToProposal, initialState);
  const [feedback, setFeedback] = useState("");
  const isPending = status === "sent";

  return (
    <div className="flex flex-col gap-4">
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => (
          <Card key={option.id} className={option.is_selected ? "border-accent ring-1 ring-accent" : ""}>
            <CardHeader>
              <CardTitle>{option.name}</CardTitle>
              <p className="text-lg font-medium text-fg">{option.price}€</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {option.description && <p className="text-fg">{option.description}</p>}
              {option.address && <p className="text-fg-muted">{option.address}</p>}
              {option.advantages && <p className="text-success">✓ {option.advantages}</p>}
              {option.conditions && <p className="text-fg-muted">Conditions : {option.conditions}</p>}
            </CardContent>
            {isPending ? (
              <CardFooter>
                <form action={formAction} className="w-full">
                  <input type="hidden" name="proposalId" value={proposalId} />
                  <input type="hidden" name="requestId" value={requestId} />
                  <input type="hidden" name="optionId" value={option.id} />
                  <input type="hidden" name="feedback" value={feedback} />
                  <div className="flex w-full gap-2">
                    <Button
                      type="submit"
                      name="decision"
                      value="accepted"
                      disabled={pending}
                      className="flex-1"
                    >
                      Choisir cette option
                    </Button>
                  </div>
                </form>
              </CardFooter>
            ) : (
              option.is_selected && (
                <CardFooter>
                  <Badge variant="accent">
                    <Check className="h-3 w-3" /> Sélectionnée
                  </Badge>
                </CardFooter>
              )
            )}
          </Card>
        ))}
      </div>

      {isPending && (
        <div className="flex flex-col gap-3">
          <Textarea
            placeholder="Un commentaire pour votre concierge (optionnel)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
          />
          <form action={formAction} className="self-start">
            <input type="hidden" name="proposalId" value={proposalId} />
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="feedback" value={feedback} />
            <Button type="submit" name="decision" value="rejected" variant="secondary" disabled={pending}>
              Aucune ne convient
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
