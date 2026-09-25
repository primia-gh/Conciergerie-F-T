"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/server/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChampMotDePasse, MessageFormulaire } from "@/components/site/champ-mot-de-passe";
import { BoutonEnvoi, TitreAuth } from "../_components/elements";

const initialState: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <div className="flex flex-col gap-8">
      <TitreAuth
        surtitre="Conciergerie privée"
        titre="Créer un compte"
        texte="Une minute suffit. Vous pourrez ensuite confier votre première demande — sans engagement."
      />
      <form action={formAction} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" name="firstName" type="text" autoComplete="given-name" className="h-11" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" name="lastName" type="text" autoComplete="family-name" className="h-11" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" inputMode="email" required autoComplete="email" className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <ChampMotDePasse
            id="password"
            name="password"
            label="Mot de passe"
            autoComplete="new-password"
            minLength={8}
            describedBy="aide-mot-de-passe"
          />
          <p id="aide-mot-de-passe" className="text-xs text-fg-muted">
            8 caractères minimum.
          </p>
        </div>
        <MessageFormulaire erreur={state.error} />
        <BoutonEnvoi enCours={pending} texteEnCours="Création…">
          Créer mon compte
        </BoutonEnvoi>
        <p className="text-xs leading-relaxed text-fg-muted">
          Vos informations ne servent qu&apos;à traiter vos demandes (voir{" "}
          <Link href="/confidentialite" className="underline underline-offset-2 hover:text-fg">
            confidentialité
          </Link>
          ).
        </p>
      </form>
      <p className="text-sm text-fg-muted">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-fg underline-offset-4 hover:text-accent-hover hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
