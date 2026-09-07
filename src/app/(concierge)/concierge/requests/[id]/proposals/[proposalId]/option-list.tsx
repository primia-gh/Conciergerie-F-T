"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { removeProposalOption } from "@/server/proposals/actions";

export type OptionRow = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  address: string | null;
};

export function OptionList({ options, requestId }: { options: OptionRow[]; requestId: string }) {
  const [pending, startTransition] = useTransition();

  if (options.length === 0) {
    return <p className="text-sm text-fg-muted">Aucune option pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {options.map((option) => (
        <li key={option.id}>
          <Card>
            <CardContent className="flex items-start justify-between pt-5">
              <div>
                <p className="font-medium text-fg">{option.name}</p>
                {option.description && <p className="text-sm text-fg-muted">{option.description}</p>}
                {option.address && <p className="text-xs text-fg-muted">{option.address}</p>}
                <p className="mt-1 text-sm font-medium text-accent">{option.price}€</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => removeProposalOption(option.id, requestId))}
                className="text-fg-muted transition-colors hover:text-danger"
                aria-label={`Retirer ${option.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
