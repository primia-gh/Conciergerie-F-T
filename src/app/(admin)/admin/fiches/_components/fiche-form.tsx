"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { envoyerSansVider } from "@/hooks/envoyer-sans-vider";
import { enregistrerFiche, type FicheFormState } from "@/server/agent/fiches-admin";

const initialState: FicheFormState = { error: null };

export function AvertissementsCodes({ lignes }: { lignes?: string[] }) {
  if (!lignes || lignes.length === 0) return null;
  return (
    <div role="alert" className="rounded-lg border border-warning bg-warning/10 p-4 text-sm text-warning">
      <p className="font-medium">
        Cette fiche est enregistrée, mais ces lignes ressemblent à un code ou à un mot de passe :
      </p>
      <ul className="mt-1 list-disc pl-5">
        {lignes.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <p className="mt-1">
        Les codes ne doivent pas figurer dans une fiche : écrivez plutôt « transmis par le Gérant », puis
        enregistrez une nouvelle version.
      </p>
    </div>
  );
}

export function FicheForm({
  activite,
  logementId,
  section,
  contenu,
}: {
  activite: "ft" | "premium";
  logementId: string | null;
  section: string;
  contenu: string;
}) {
  const [state, formAction, pending] = useActionState(enregistrerFiche, initialState);

  return (
    // Erreur : le texte modifié reste dans la zone (voir envoyerSansVider).
    <form onSubmit={envoyerSansVider(formAction)} className="flex flex-col gap-3">
      <input type="hidden" name="activite" value={activite} />
      {logementId && <input type="hidden" name="logementId" value={logementId} />}
      <input type="hidden" name="section" value={section} />
      <label htmlFor={`contenu-${section}`} className="sr-only">
        Contenu de la fiche
      </label>
      <Textarea
        id={`contenu-${section}`}
        name="contenu"
        defaultValue={contenu}
        rows={20}
        className="font-mono text-sm leading-relaxed"
        placeholder="Une information par ligne."
        disabled={pending}
      />
      {state.error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-success">
          Nouvelle version enregistrée.
        </p>
      )}
      <AvertissementsCodes lignes={state.avertissements} />
      <div>
        <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
          {pending ? "Enregistrement…" : "Enregistrer une nouvelle version"}
        </Button>
      </div>
    </form>
  );
}
