"use client";

import { useActionState } from "react";
import { changerMotDePasse, type AuthActionState } from "@/server/auth/actions";
import { ChampMotDePasse, MessageFormulaire } from "@/components/site/champ-mot-de-passe";
import { BoutonEnvoi } from "../_components/elements";

const initialState: AuthActionState = { error: null };

export function FormulaireNouveauMotDePasse() {
  const [state, formAction, pending] = useActionState(changerMotDePasse, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <ChampMotDePasse
          id="password"
          name="password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          minLength={8}
          describedBy="aide-mot-de-passe"
        />
        <p id="aide-mot-de-passe" className="text-xs text-fg-muted">
          8 caractères minimum.
        </p>
      </div>
      <ChampMotDePasse
        id="confirmation"
        name="confirmation"
        label="Confirmer le mot de passe"
        autoComplete="new-password"
        minLength={8}
      />
      <MessageFormulaire erreur={state.error} />
      <BoutonEnvoi enCours={pending} texteEnCours="Enregistrement…">
        Enregistrer et me connecter
      </BoutonEnvoi>
    </form>
  );
}
