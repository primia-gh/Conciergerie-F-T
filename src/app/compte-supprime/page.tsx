import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Compte supprimé" };

export default function AccountDeletedPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-medium text-fg">Compte supprimé</h1>
      <p className="mt-3 text-fg-muted">
        Votre compte a été supprimé et vous a été déconnecté(e). Vous ne pouvez plus vous
        reconnecter avec ces identifiants.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}
