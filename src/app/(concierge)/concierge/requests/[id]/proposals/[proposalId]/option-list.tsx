"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeProposalOption } from "@/server/proposals/actions";
import { euros } from "@/lib/dates";

export type OptionRow = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  address: string | null;
  conditions: string | null;
  advantages: string | null;
};

/** Options d'une proposition, présentées comme le client les verra. */
export function OptionList({
  options,
  requestId,
  modifiable,
}: {
  options: OptionRow[];
  requestId: string;
  modifiable: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [aRetirer, setARetirer] = useState<string | null>(null);
  const router = useRouter();

  if (options.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-5 py-8 text-center text-sm text-fg-muted">
        Aucune option pour l&apos;instant. Ajoutez-en au moins une avant d&apos;envoyer la proposition.
      </p>
    );
  }

  function retirer(id: string) {
    startTransition(async () => {
      await removeProposalOption(id, requestId);
      setARetirer(null);
      // L'action rafraîchit la page de la demande ; on rafraîchit aussi celle-ci.
      router.refresh();
    });
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {options.map((option) => (
        <li key={option.id} className="flex flex-col rounded-lg border border-border bg-surface">
          <div className="flex flex-1 flex-col gap-3 p-5">
            <p className="font-display text-xl leading-snug text-fg">{option.name}</p>
            <p className="font-display text-3xl text-accent">{euros(option.price)}</p>
            {option.description && (
              <p className="text-sm leading-relaxed whitespace-pre-line text-fg">{option.description}</p>
            )}
            {option.address && (
              <p className="flex gap-2 text-sm text-fg-muted">
                <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
                {option.address}
              </p>
            )}
            {option.advantages && (
              <ul className="flex flex-col gap-1.5 text-sm text-fg">
                {option.advantages
                  .split(/\n+/)
                  .map((a) => a.trim())
                  .filter(Boolean)
                  .map((a) => (
                    <li key={a} className="flex gap-2">
                      <Plus aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {a}
                    </li>
                  ))}
              </ul>
            )}
            {option.conditions && (
              <p className="border-t border-border pt-3 text-xs text-fg-muted">Conditions : {option.conditions}</p>
            )}
          </div>
          {modifiable && (
            <div className="border-t border-border p-3">
              {aRetirer === option.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-fg">Retirer cette option ?</span>
                  <Button size="sm" variant="danger" disabled={pending} onClick={() => retirer(option.id)}>
                    {pending ? "Retrait…" : "Retirer"}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => setARetirer(null)}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setARetirer(option.id)}>
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Retirer<span className="sr-only"> {option.name}</span>
                </Button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
