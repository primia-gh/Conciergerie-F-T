import type { Metadata } from "next";
import Link from "next/link";
import { MessageFormulaire } from "@/components/site/champ-mot-de-passe";
import { TitreAuth } from "../_components/elements";
import { FormulaireConnexion } from "./formulaire";

export const metadata: Metadata = {
  title: { absolute: "Connexion — Espace membres" },
  robots: { index: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const suite = typeof params.next === "string" ? params.next : "";
  const lienExpire = params.lien === "expire";

  return (
    <div className="flex flex-col gap-8">
      <TitreAuth surtitre="Espace membres" titre="Connexion" />
      {lienExpire && (
        <MessageFormulaire erreur="Ce lien n'est plus valide (déjà utilisé ou expiré). Connectez-vous, ou demandez un nouveau lien." />
      )}
      <FormulaireConnexion suite={suite} />
      <p className="text-sm text-fg-muted">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-fg underline-offset-4 hover:text-accent-hover hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
