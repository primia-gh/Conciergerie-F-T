"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cloturerDemande } from "@/server/agent/boite";
import type { FormState } from "@/server/agent/ft-admin";

const initialState: FormState = { error: null };

export function ClotureForm({
  demandeId,
  estEscalade,
  texteInitial,
}: {
  demandeId: string;
  estEscalade: boolean;
  texteInitial: string;
}) {
  const [state, formAction, pending] = useActionState(cloturerDemande.bind(null, demandeId), initialState);
  const zoneRef = useRef<HTMLTextAreaElement>(null);
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(zoneRef.current?.value ?? "");
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible : le texte reste sélectionnable à la main.
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Label htmlFor="reponse">
        {estEscalade
          ? "Votre réponse (facultatif — vous pouvez aussi simplement marquer le cas comme traité)"
          : "Brouillon — relisez, corrigez si besoin, puis copiez-le pour l'envoyer vous-même"}
      </Label>
      <Textarea
        id="reponse"
        name="reponse"
        ref={zoneRef}
        rows={12}
        defaultValue={texteInitial}
        disabled={pending}
      />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={copier}>
          {copie ? "Copié" : "Copier le texte"}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : estEscalade ? "Marquer comme traité" : "Valider"}
        </Button>
      </div>
      <p className="text-sm text-fg-muted">
        « Valider » enregistre ce texte et clôt la demande. L&apos;application n&apos;envoie rien : c&apos;est à vous
        de copier et d&apos;envoyer le message.
      </p>
    </form>
  );
}
