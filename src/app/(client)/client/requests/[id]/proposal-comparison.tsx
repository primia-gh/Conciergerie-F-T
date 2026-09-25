"use client";

import { useActionState, useState } from "react";
import { Check, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { respondToProposal, type RespondToProposalState } from "@/server/proposals/actions";
import { euros } from "@/lib/dates";
import { cn } from "@/lib/utils";

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

const STATUT: Record<string, { libelle: string; variante: "accent" | "success" | "danger" | "neutral" }> = {
  sent: { libelle: "À choisir", variante: "accent" },
  accepted: { libelle: "Option choisie", variante: "success" },
  rejected: { libelle: "Refusée", variante: "danger" },
};

/**
 * Une proposition du concierge : ses options côte à côte. Choisir une option
 * crée la réservation, d'où une confirmation en deux temps.
 */
export function ProposalComparison({
  proposalId,
  requestId,
  status,
  options,
  envoyeeLe,
}: {
  proposalId: string;
  requestId: string;
  status: string;
  options: OptionForComparison[];
  envoyeeLe?: string;
}) {
  const [state, formAction, pending] = useActionState(respondToProposal, initialState);
  const [feedback, setFeedback] = useState("");
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const [refusOuvert, setRefusOuvert] = useState(false);
  const isPending = status === "sent";
  const statut = STATUT[status] ?? { libelle: status, variante: "neutral" as const };

  return (
    <article className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-display text-xl text-fg">
          {options.length} option{options.length > 1 ? "s" : ""}
          {envoyeeLe && <span className="text-fg-muted"> · envoyée{options.length > 1 ? "s" : ""} le {envoyeeLe}</span>}
        </h3>
        <Badge variant={statut.variante}>{statut.libelle}</Badge>
      </div>

      {state.error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => (
          <div
            key={option.id}
            className={cn(
              "flex flex-col rounded-lg border bg-surface",
              option.is_selected ? "border-accent ring-1 ring-accent" : "border-border",
              !isPending && !option.is_selected && "opacity-70",
            )}
          >
            <div className="flex flex-1 flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xl leading-snug text-fg">{option.name}</p>
                {option.is_selected && (
                  <Badge variant="success" className="shrink-0">
                    <Check aria-hidden="true" className="h-3 w-3" /> Votre choix
                  </Badge>
                )}
              </div>
              <p className="font-display text-3xl text-accent">{euros(option.price)}</p>
              {option.description && <p className="text-sm leading-relaxed whitespace-pre-line text-fg">{option.description}</p>}
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
                <p className="border-t border-border pt-3 text-xs leading-relaxed text-fg-muted">
                  Conditions : {option.conditions}
                </p>
              )}
            </div>

            {isPending && (
              <div className="border-t border-border p-4">
                {aConfirmer === option.id ? (
                  <form action={formAction} className="flex flex-col gap-3">
                    <input type="hidden" name="proposalId" value={proposalId} />
                    <input type="hidden" name="requestId" value={requestId} />
                    <input type="hidden" name="optionId" value={option.id} />
                    <input type="hidden" name="feedback" value={feedback} />
                    <p className="text-sm text-fg">
                      Confirmer « {option.name} » ? Votre concierge lance la réservation.
                    </p>
                    <div className="flex gap-2">
                      <Button type="submit" name="decision" value="accepted" disabled={pending} className="flex-1">
                        {pending ? "Envoi…" : "Confirmer mon choix"}
                      </Button>
                      <Button type="button" variant="ghost" disabled={pending} onClick={() => setAConfirmer(null)}>
                        Annuler
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button type="button" className="w-full" onClick={() => setAConfirmer(option.id)}>
                    Choisir cette option
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isPending &&
        (refusOuvert ? (
          <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border p-5">
            <input type="hidden" name="proposalId" value={proposalId} />
            <input type="hidden" name="requestId" value={requestId} />
            <label htmlFor={`retour-${proposalId}`} className="text-sm font-medium text-fg">
              Qu&apos;est-ce qui ne convient pas ?{" "}
              <span className="font-normal text-fg-muted">(facultatif, mais utile à votre concierge)</span>
            </label>
            <Textarea
              id={`retour-${proposalId}`}
              name="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Trop cher, trop loin, pas le bon style…"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" name="decision" value="rejected" variant="secondary" disabled={pending}>
                {pending ? "Envoi…" : "Demander d'autres options"}
              </Button>
              <Button type="button" variant="ghost" disabled={pending} onClick={() => setRefusOuvert(false)}>
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setRefusOuvert(true)}
            className="min-h-11 self-start text-sm text-fg-muted underline underline-offset-4 hover:text-fg"
          >
            Aucune option ne me convient
          </button>
        ))}
    </article>
  );
}
