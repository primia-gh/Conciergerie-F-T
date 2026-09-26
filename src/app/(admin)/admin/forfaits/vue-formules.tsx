import { ArrowRight, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnTetePage, PAGE, TitreSection } from "@/components/espace/en-tete";
import { EtatVide } from "@/components/espace/etat-vide";
import { forfait } from "@/lib/forfaits";
import { dateCourte, ilYa } from "@/lib/dates";
import { ActionsDemande, ChangerFormule } from "./actions-formule";

export type ClientFormule = {
  id: string;
  nom: string;
  email: string | null;
  formule: string;
  demande: { code: string; le: string } | null;
};

/** Formules des clients Premium (présentation seule : les données viennent de page.tsx). */
export function VueFormules({ clients }: { clients: ClientFormule[] }) {
  const enAttente = clients
    .filter((c) => c.demande && forfait(c.demande.code))
    .sort((a, b) => a.demande!.le.localeCompare(b.demande!.le));
  const parFormule = clients.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.formule]: (acc[c.formule] ?? 0) + 1 }), {});

  return (
    <div className={PAGE.moyenne}>
      <EnTetePage surtitre="Conciergerie Premium" titre="Formules">
        En attendant le paiement en ligne, vous activez les formules à la main et facturez hors du site. Chaque
        changement est écrit dans le journal.
      </EnTetePage>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["free", "premium", "vip", "private"].map((code) => (
          <div key={code} className="rounded-lg border border-border bg-surface p-4">
            <dt className="text-sm text-fg-muted">{forfait(code)?.nom}</dt>
            <dd className="mt-1 font-display text-3xl text-fg">{parFormule[code] ?? 0}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="titre-attente" className="mt-12">
        <TitreSection id="titre-attente" compte={enAttente.length}>
          Demandes en attente
        </TitreSection>
        {enAttente.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border px-5 py-6 text-sm text-fg-muted">
            Aucune demande de changement de formule pour le moment.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {enAttente.map((c) => (
              <li key={c.id} className="flex flex-col gap-4 rounded-lg border border-accent/60 bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-fg">{c.nom}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
                    {forfait(c.formule)?.nom}
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    <span className="sr-only">vers</span>
                    <Badge variant="accent">{forfait(c.demande!.code)?.nom}</Badge>
                    <span className="text-xs text-fg-faint">demandée {ilYa(c.demande!.le)}</span>
                  </p>
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="mt-1 inline-flex min-h-9 items-center gap-1.5 text-sm break-all text-accent hover:underline">
                      <Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> {c.email}
                    </a>
                  )}
                </div>
                <div className="shrink-0">
                  <ActionsDemande clientId={c.id} code={c.demande!.code} nomClient={c.nom} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titre-clients" className="mt-12">
        <TitreSection id="titre-clients" compte={clients.length}>
          Tous les clients
        </TitreSection>
        {clients.length === 0 ? (
          <EtatVide icone={Users} titre="Aucun client pour l'instant" className="mt-4">
            Les clients apparaîtront ici dès leur inscription sur le site Premium.
          </EtatVide>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
            {clients.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-fg">
                    {c.nom}
                    {c.demande && <Badge variant="accent">Demande : {forfait(c.demande.code)?.nom}</Badge>}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-fg-muted">
                    {[c.email, c.demande ? `depuis le ${dateCourte(c.demande.le)}` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="w-full sm:w-72">
                  <ChangerFormule clientId={c.id} actuelle={c.formule} nomClient={c.nom} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
