import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MessageFormulaire } from "@/components/site/champ-mot-de-passe";
import { TitreAuth } from "../_components/elements";
import { FormulaireNouveauMotDePasse } from "./formulaire";

export const metadata: Metadata = {
  title: { absolute: "Nouveau mot de passe — Espace membres" },
  robots: { index: false },
};

/**
 * Atteinte par le lien « mot de passe oublié » (via /auth/callback, qui a
 * ouvert la session). Sans session, le lien a expiré : on le dit clairement.
 */
export default async function NouveauMotDePassePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-8">
      <TitreAuth
        surtitre="Espace membres"
        titre="Nouveau mot de passe"
        texte={user ? "Choisissez votre nouveau mot de passe. Vous serez connecté juste après." : undefined}
      />
      {user ? (
        <FormulaireNouveauMotDePasse />
      ) : (
        <>
          <MessageFormulaire erreur="Ce lien n'est plus valide (déjà utilisé ou expiré)." />
          <Link
            href="/mot-de-passe-oublie"
            className="self-start border-b border-accent pb-1 text-fg transition-colors hover:text-accent-hover"
          >
            Recevoir un nouveau lien
          </Link>
        </>
      )}
    </div>
  );
}
