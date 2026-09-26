"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { annulerDemandeForfait, demanderForfait } from "@/server/subscriptions/actions";

/** « Demander cette formule » : la demande part au Gérant, qui l'active à la main. */
export function BoutonDemanderFormule({ code, nom, principal }: { code: string; nom: string; principal?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <Button
        // Colonne étroite du tableau comparatif : le libellé peut passer sur deux lignes.
        className="h-auto min-h-11 w-full py-2 text-center whitespace-normal"
        variant={principal ? "primary" : "secondary"}
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await demanderForfait(code);
            setErreur(r.error);
          })
        }
      >
        {pending ? "Envoi…" : "Demander cette formule"}
        <span className="sr-only"> : {nom}</span>
      </Button>
      {erreur && (
        <p role="alert" className="text-xs text-danger">
          {erreur}
        </p>
      )}
    </div>
  );
}

export function BadgeFormule({ texte }: { texte: string }) {
  return (
    <p className="flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-accent">
      <Check aria-hidden="true" className="h-4 w-4" /> {texte}
    </p>
  );
}

/** Retire la demande en cours. */
export function BoutonAnnulerDemande() {
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await annulerDemandeForfait();
            setErreur(r.error);
          })
        }
        className="self-start"
      >
        {pending ? "Annulation…" : "Annuler ma demande"}
      </Button>
      {erreur && (
        <p role="alert" className="text-xs text-danger">
          {erreur}
        </p>
      )}
    </div>
  );
}
