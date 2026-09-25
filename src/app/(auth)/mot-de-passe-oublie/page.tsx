"use client";

import { useActionState } from "react";
import Link from "next/link";
import { demanderReinitialisation, type AuthActionState } from "@/server/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageFormulaire } from "@/components/site/champ-mot-de-passe";
import { BoutonEnvoi, TitreAuth } from "../_components/elements";

const initialState: AuthActionState = { error: null };

export default function MotDePasseOubliePage() {
  const [state, formAction, pending] = useActionState(demanderReinitialisation, initialState);

  return (
    <div className="flex flex-col gap-8">
      <TitreAuth
        surtitre="Espace membres"
        titre="Mot de passe oublié"
        texte="Indiquez l'adresse e-mail de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe."
      />
      {state.message ? (
        <MessageFormulaire message={state.message} />
      ) : (
        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" inputMode="email" required autoComplete="email" className="h-11" />
          </div>
          <MessageFormulaire erreur={state.error} />
          <BoutonEnvoi enCours={pending} texteEnCours="Envoi…">
            Recevoir le lien
          </BoutonEnvoi>
        </form>
      )}
      <Link href="/login" className="text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
        Retour à la connexion
      </Link>
    </div>
  );
}
