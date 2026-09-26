import Link from "next/link";
import { ChevronRight, Inbox, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnTetePage, PAGE, TitreSection, carteLien } from "@/components/espace/en-tete";
import { EtatVide } from "@/components/espace/etat-vide";
import { IconeCategorie } from "@/components/espace/icones-categories";
import { SuiviCompact } from "@/components/espace/suivi-demande";
import { dateLongue, ilYa } from "@/lib/dates";
import {
  PRIORITE_LABELS,
  demandePrioritaire,
  TERMINAL_STATUSES,
  attenteReponseClient,
  requestStatusBadgeVariant,
  requestStatusLabel,
} from "@/server/requests/status-labels";
import { cn } from "@/lib/utils";

export type RequestRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  categories: { name: string; icon: string | null } | null;
};

function CarteDemande({ r, aPrendre, discrete }: { r: RequestRow; aPrendre?: boolean; discrete?: boolean }) {
  const prioritaire = demandePrioritaire(r.priority);
  return (
    <li>
      <Link href={`/concierge/requests/${r.id}`} className={cn(carteLien, discrete && "bg-transparent")}>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            discrete ? "bg-surface text-fg-muted" : "bg-accent/10 text-accent",
          )}
        >
          <IconeCategorie nom={r.categories?.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className={cn("truncate font-medium", discrete ? "text-fg-muted" : "text-fg")}>{r.title}</p>
            {prioritaire && (
              <Badge variant={r.priority === "urgent" ? "warning" : "accent"}>
                {PRIORITE_LABELS[r.priority]}
              </Badge>
            )}
            {!aPrendre && (
              <Badge variant={requestStatusBadgeVariant(r.status)}>{requestStatusLabel(r.status, true)}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            {[r.categories?.name, `reçue ${ilYa(r.created_at)}`].filter(Boolean).join(" · ")}
          </p>
          {!aPrendre && !discrete && <SuiviCompact status={r.status} className="mt-3 max-w-md" />}
        </div>
        <ChevronRight
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
        />
      </Link>
    </li>
  );
}

/** Tableau de bord du concierge (présentation seule : les données viennent de page.tsx). */
export function VueConcierge({
  prenom,
  newRequests,
  myRequests,
}: {
  prenom: string | null;
  newRequests: RequestRow[];
  myRequests: RequestRow[];
}) {
  const aPrendre = newRequests;
  const miennes = myRequests;
  const enCours = miennes.filter((r) => !TERMINAL_STATUSES.includes(r.status as never));
  const terminees = miennes.filter((r) => TERMINAL_STATUSES.includes(r.status as never));
  const attenteClient = enCours.filter((r) => attenteReponseClient(r.status)).length;

  return (
    <div className={PAGE.large}>
      <EnTetePage surtitre={dateLongue(new Date())} titre={`Bonjour ${prenom ?? ""}`}>
        {aPrendre.length > 0
          ? `${aPrendre.length} nouvelle${aPrendre.length > 1 ? "s" : ""} demande${aPrendre.length > 1 ? "s" : ""} à prendre en charge.`
          : "Aucune nouvelle demande à prendre en charge pour le moment."}
      </EnTetePage>

      <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { libelle: "À prendre en charge", valeur: aPrendre.length },
          { libelle: "Mes demandes en cours", valeur: enCours.length },
          { libelle: "En attente du client", valeur: attenteClient, large: true },
        ].map((c) => (
          <div
            key={c.libelle}
            className={cn("rounded-lg border border-border bg-surface p-5", c.large && "col-span-2 sm:col-span-1")}
          >
            <dt className="text-sm text-fg-muted">{c.libelle}</dt>
            <dd className="mt-2 font-display text-4xl leading-none text-fg">{c.valeur}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-10">
        <section aria-labelledby="a-prendre">
          <TitreSection id="a-prendre" compte={aPrendre.length}>
            À prendre en charge
          </TitreSection>
          <p className="mt-2 text-sm text-fg-muted">
            Les formules prioritaires d&apos;abord, puis les plus anciennes.
          </p>
          {aPrendre.length === 0 ? (
            <EtatVide icone={Inbox} titre="Rien à prendre" className="mt-4">
              Les nouvelles demandes des clients apparaîtront ici.
            </EtatVide>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {aPrendre.map((r) => (
                <CarteDemande key={r.id} r={r} aPrendre />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="mes-demandes">
          <TitreSection id="mes-demandes" compte={enCours.length}>
            Mes demandes en cours
          </TitreSection>
          <p className="mt-2 text-sm text-fg-muted">Les plus récentes d&apos;abord.</p>
          {enCours.length === 0 ? (
            <EtatVide icone={Sparkles} titre="Aucune demande en cours" className="mt-4">
              Prenez en charge une nouvelle demande : elle s&apos;affichera ici jusqu&apos;à sa clôture.
            </EtatVide>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {enCours.map((r) => (
                <CarteDemande key={r.id} r={r} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {terminees.length > 0 && (
        <section aria-labelledby="terminees" className="mt-12">
          <TitreSection id="terminees" compte={terminees.length}>
            Terminées et annulées
          </TitreSection>
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {terminees.map((r) => (
              <CarteDemande key={r.id} r={r} discrete />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
