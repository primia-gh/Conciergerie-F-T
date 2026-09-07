import type { Metadata } from "next";
import Link from "next/link";
import { requireRole, dashboardPathForRole } from "@/server/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { ExportDataButton } from "./export-data-button";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = { title: "Mon compte" };

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  concierge: "Concierge",
  admin: "Administrateur",
  partner: "Partenaire",
};

export default async function AccountPage() {
  const profile = await requireRole("client", "concierge", "admin", "partner");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href={dashboardPathForRole(profile.role)}
        className="text-sm text-fg-muted hover:underline"
      >
        ← Retour au tableau de bord
      </Link>

      <h1 className="mt-4 font-display text-2xl font-medium text-fg">Mon compte</h1>
      <p className="mt-1 text-fg-muted">
        {profile.first_name} {profile.last_name} — {ROLE_LABELS[profile.role]}
      </p>

      <Card className="mt-8">
        <CardContent className="flex flex-col gap-2 pt-6">
          <h2 className="font-medium text-fg">Mes données</h2>
          <p className="text-sm text-fg-muted">
            Téléchargez une copie de toutes les données personnelles associées à votre compte
            (profil, demandes, messages, réservations, notifications), au format JSON.
          </p>
          <div className="mt-2">
            <ExportDataButton />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 border-danger/30">
        <CardContent className="flex flex-col gap-2 pt-6">
          <h2 className="font-medium text-fg">Zone de danger</h2>
          <p className="text-sm text-fg-muted">
            La suppression de votre compte est définitive et immédiate : vous serez déconnecté et
            ne pourrez plus vous reconnecter. Voir notre{" "}
            <Link href="/confidentialite" className="underline">
              politique de confidentialité
            </Link>{" "}
            pour le détail de vos droits.
          </p>
          <div className="mt-2">
            <DeleteAccountForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
