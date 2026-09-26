"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toutRemettreEnPropose } from "@/server/agent/ft-admin";

function Confirmer() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Un instant…" : "Oui, tout remettre en « Propose »"}
    </Button>
  );
}

/** Le « bouton unique » du cahier des charges, avec une confirmation. */
export function BoutonToutProposer({ nombre }: { nombre: number }) {
  const [confirmer, setConfirmer] = useState(false);

  if (nombre === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-success">
        <ShieldCheck aria-hidden="true" className="h-4 w-4" />
        Toutes les tâches sont au niveau « Propose » : rien ne part sans vous.
      </p>
    );
  }

  if (!confirmer) {
    return (
      <Button variant="secondary" onClick={() => setConfirmer(true)}>
        <ShieldCheck aria-hidden="true" className="h-4 w-4" />
        Tout remettre en « Propose »
      </Button>
    );
  }

  return (
    <form action={toutRemettreEnPropose} className="flex flex-col gap-3">
      <p className="text-sm text-fg">
        {nombre === 1 ? "La tâche qui agit" : `Les ${nombre} tâches qui agissent`} sans votre clic
        repasseront au niveau « Propose ». Chaque changement est écrit dans le journal.
      </p>
      <div className="flex flex-wrap gap-2">
        <Confirmer />
        <Button type="button" variant="ghost" onClick={() => setConfirmer(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
