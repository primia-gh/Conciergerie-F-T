import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, KeyRound, ShieldAlert, UserRound } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { ExportDataButton } from "./export-data-button";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = { title: "Mon compte" };

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  concierge: "Concierge",
  admin: "Gérant",
  partner: "Partenaire",
};

function Rubrique({
  icone: Icone,
  titre,
  children,
  danger,
}: {
  icone: typeof UserRound;
  titre: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Card className={danger ? "border-danger/40" : undefined}>
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:gap-6">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? "bg-danger/10" : "bg-accent/10"}`}
        >
          <Icone aria-hidden="true" className={`h-5 w-5 ${danger ? "text-danger" : "text-accent"}`} strokeWidth={1.5} />
        </span>
        <div className="flex flex-1 flex-col gap-2">
          <h2 className="font-display text-xl text-fg">{titre}</h2>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AccountPage() {
  const profile = await requireRole("client", "concierge", "admin", "partner");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const nomComplet = [profile.first_name, profile.last_name].filter(Boolean).join(" ");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">Mon compte</p>
      <h1 className="mt-3 font-display text-4xl text-fg">{nomComplet || "Mon compte"}</h1>
      <p className="mt-2 text-fg-muted">{ROLE_LABELS[profile.role]}</p>

      <div className="mt-10 flex flex-col gap-5">
        <Rubrique icone={UserRound} titre="Mes informations">
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-fg-muted">Prénom et nom</dt>
              <dd className="mt-0.5 text-fg">{nomComplet || "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">Adresse e-mail</dt>
              <dd className="mt-0.5 break-all text-fg">{user?.email ?? "—"}</dd>
            </div>
          </dl>
        </Rubrique>

        <Rubrique icone={KeyRound} titre="Mot de passe">
          <p className="text-sm text-fg-muted">
            Choisissez un nouveau mot de passe, sans passer par un e-mail : vous restez connecté.
          </p>
          <Link
            href="/nouveau-mot-de-passe"
            className="group inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-accent"
          >
            Changer mon mot de passe
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </Rubrique>

        <Rubrique icone={Download} titre="Mes données">
          <p className="text-sm text-fg-muted">
            Téléchargez une copie de toutes les données personnelles associées à votre compte
            (profil, demandes, messages, réservations, notifications), au format JSON.
          </p>
          <div className="mt-1">
            <ExportDataButton />
          </div>
        </Rubrique>

        <Rubrique icone={ShieldAlert} titre="Supprimer mon compte" danger>
          <p className="text-sm text-fg-muted">
            La suppression est définitive et immédiate : vous serez déconnecté et ne pourrez plus
            vous reconnecter. Voir notre{" "}
            <Link href="/confidentialite" className="text-fg underline underline-offset-2">
              politique de confidentialité
            </Link>{" "}
            pour le détail de vos droits.
          </p>
          <div className="mt-1">
            <DeleteAccountForm />
          </div>
        </Rubrique>
      </div>
    </div>
  );
}
