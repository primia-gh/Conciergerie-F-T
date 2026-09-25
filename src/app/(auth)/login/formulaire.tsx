"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/server/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChampMotDePasse, MessageFormulaire } from "@/components/site/champ-mot-de-passe";
import { BoutonEnvoi } from "../_components/elements";

const initialState: AuthActionState = { error: null };

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={suite} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" inputMode="email" required autoComplete="email" className="h-11" />
      </div>
      <ChampMotDePasse id="password" name="password" label="Mot de passe" autoComplete="current-password" />
      <Link
        href="/mot-de-passe-oublie"
        className="-mt-2 self-end text-sm text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
      >
        Mot de passe oublié ?
      </Link>
      <MessageFormulaire erreur={state.error} />
      <BoutonEnvoi enCours={pending} texteEnCours="Connexion…">
        Se connecter
      </BoutonEnvoi>
    </form>
  );
}
