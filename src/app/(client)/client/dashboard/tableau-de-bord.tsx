import Link from "next/link";
import { ArrowRight, ChevronRight, Clock, Inbox, Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EtatVide } from "@/components/espace/etat-vide";
import { IconeCategorie } from "@/components/espace/icones-categories";
import { SuiviCompact } from "@/components/espace/suivi-demande";
import { dateCourte, dateLongue, heure, ilYa } from "@/lib/dates";
import {
  attenteReponseClient,
  requestStatusBadgeVariant,
  requestStatusLabel,
  TERMINAL_STATUSES,
} from "@/server/requests/status-labels";
import { cn } from "@/lib/utils";

export type DemandeResume = {
  id: string;
  titre: string;
  status: string;
  creeLe: string;
  categorie: string | null;
  icone: string | null;
  concierge: string | null;
};

export type Activite = { id: string; texte: string; le: string; demandeId: string | null };

export type Forfait = { nom: string; limite: number | null; utilisees: number; peutCreer: boolean };

export type CategorieSuggeree = { slug: string; nom: string; icone: string | null };

export type DonneesTableauDeBord = {
  prenom: string | null;
  demandes: DemandeResume[];
  prochaineReservation: string | null;
  activite: Activite[];
  forfait: Forfait | null;
  categories: CategorieSuggeree[];
};

const surtitre = "text-xs font-medium tracking-[0.2em] uppercase";

/** Tableau de bord du client (présentation seule : les données viennent de page.tsx). */
export function TableauDeBord({ d }: { d: DonneesTableauDeBord }) {
  const enCours = d.demandes.filter((r) => !TERMINAL_STATUSES.includes(r.status as never));
  const terminees = d.demandes.filter((r) => TERMINAL_STATUSES.includes(r.status as never));
  const aTraiter = enCours.filter((r) => attenteReponseClient(r.status));
  const limiteAtteinte = d.forfait ? !d.forfait.peutCreer : false;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={cn(surtitre, "text-accent")}>{dateLongue(new Date())}</p>
          <h1 className="mt-3 font-display text-4xl text-fg sm:text-5xl">
            Bonjour{d.prenom ? ` ${d.prenom}` : ""}
          </h1>
          <p className="mt-3 text-fg-muted">
            {enCours.length === 0
              ? "Aucune demande en cours pour le moment."
              : `${enCours.length} demande${enCours.length > 1 ? "s" : ""} en cours${
                  aTraiter.length > 0 ? `, dont ${aTraiter.length} qui attend${aTraiter.length > 1 ? "ent" : ""} votre réponse` : ""
                }.`}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Link
            href="/client/requests/new"
            className={cn(
              "group inline-flex min-h-12 items-center gap-3 px-6 text-base font-medium tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg",
              limiteAtteinte
                ? "border border-border text-fg hover:bg-surface"
                : "bg-accent text-accent-fg hover:bg-accent-hover",
            )}
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
            Nouvelle demande
          </Link>
          {limiteAtteinte && d.forfait && (
            <p className="text-sm text-fg-muted">
              Limite de la formule {d.forfait.nom} atteinte ce mois-ci.{" "}
              <Link href="/client/forfait" className="font-medium text-accent hover:underline">
                Changer de formule
              </Link>
            </p>
          )}
        </div>
      </header>

      {aTraiter.length > 0 && (
        <section
          aria-labelledby="a-traiter"
          className="mt-10 rounded-lg border border-accent/60 bg-surface p-5 sm:p-6"
        >
          <h2 id="a-traiter" className="flex items-center gap-3 font-display text-2xl text-fg">
            <Sparkles aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={1.5} />
            {aTraiter.length === 1 ? "Une proposition vous attend" : `${aTraiter.length} propositions vous attendent`}
          </h2>
          <ul className="mt-4 flex flex-col divide-y divide-accent/20">
            {aTraiter.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
                <span className="text-fg">{r.titre}</span>
                <Link
                  href={`/client/requests/${r.id}#propositions`}
                  className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent"
                >
                  Voir et choisir
                  <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Chiffre libelle="En cours" valeur={String(enCours.length)} />
        <Chiffre libelle="Terminées" valeur={String(terminees.filter((r) => r.status === "COMPLETED").length)} />
        <Chiffre
          className="col-span-2 sm:col-span-1"
          libelle="Prochaine réservation"
          valeur={d.prochaineReservation ? dateCourte(d.prochaineReservation) : "—"}
          note={d.prochaineReservation ? `à ${heure(d.prochaineReservation)}` : "Aucune pour le moment"}
        />
      </dl>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-10">
        <div className="flex flex-col gap-12 lg:col-span-2">
          <section aria-labelledby="titre-en-cours">
            <h2 id="titre-en-cours" className={cn(surtitre, "text-fg-muted")}>
              En cours
            </h2>
            {enCours.length === 0 ? (
              <EtatVide
                icone={Inbox}
                titre={d.demandes.length === 0 ? "Votre première demande" : "Rien en cours"}
                className="mt-4"
                action={
                  d.categories.length > 0 && !limiteAtteinte ? (
                    <ul className="flex flex-wrap justify-center gap-2" aria-label="Commencer par une catégorie">
                      {d.categories.map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={`/client/requests/new?categorie=${encodeURIComponent(c.slug)}`}
                              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm text-fg transition-colors hover:border-accent hover:text-accent"
                            >
                              <IconeCategorie nom={c.icone} className="h-4 w-4" />
                              {c.nom}
                            </Link>
                          </li>
                      ))}
                    </ul>
                  ) : undefined
                }
              >
                Décrivez ce qu&apos;il vous faut : un concierge s&apos;en occupe et vous propose des solutions
                prêtes à valider. Choisissez une catégorie pour commencer.
              </EtatVide>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {enCours.map((r) => (
                  <CarteDemande key={r.id} demande={r} />
                ))}
              </ul>
            )}
          </section>

          {terminees.length > 0 && (
            <section aria-labelledby="titre-terminees">
              <h2 id="titre-terminees" className={cn(surtitre, "text-fg-muted")}>
                Terminées et annulées
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {terminees.map((r) => (
                  <CarteDemande key={r.id} demande={r} discrete />
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-6" aria-label="Votre compte en bref">
          {d.forfait && <CarteForfait forfait={d.forfait} />}

          <section aria-labelledby="titre-activite" className="rounded-lg border border-border bg-surface p-6">
            <h2 id="titre-activite" className={cn(surtitre, "text-fg-muted")}>
              Activité récente
            </h2>
            {d.activite.length === 0 ? (
              <p className="mt-4 text-sm text-fg-muted">
                Les étapes de vos demandes s&apos;afficheront ici.
              </p>
            ) : (
              <ol className="mt-5 flex flex-col">
                {d.activite.map((a, i) => (
                  <li key={a.id} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < d.activite.length - 1 && (
                      <span aria-hidden="true" className="absolute top-3 left-[3px] h-full w-px bg-border" />
                    )}
                    <span aria-hidden="true" className="relative mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />
                    <div className="min-w-0">
                      {a.demandeId ? (
                        <Link href={`/client/requests/${a.demandeId}`} className="text-sm text-fg hover:text-accent">
                          {a.texte}
                        </Link>
                      ) : (
                        <p className="text-sm text-fg">{a.texte}</p>
                      )}
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-faint">
                        <Clock aria-hidden="true" className="h-3 w-3" />
                        {ilYa(a.le)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Chiffre({ libelle, valeur, note, className }: { libelle: string; valeur: string; note?: string; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-5", className)}>
      <dt className="text-sm text-fg-muted">{libelle}</dt>
      <dd className="mt-2 font-display text-4xl leading-none text-fg">{valeur}</dd>
      {note && <dd className="mt-2 text-xs text-fg-muted">{note}</dd>}
    </div>
  );
}

function CarteDemande({ demande: r, discrete }: { demande: DemandeResume; discrete?: boolean }) {
  return (
    <li>
      <Link
        href={`/client/requests/${r.id}`}
        className={cn(
          "group flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent/60 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-5",
          discrete && "bg-transparent",
        )}
      >
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            discrete ? "bg-surface text-fg-muted" : "bg-accent/10 text-accent",
          )}
        >
          <IconeCategorie nom={r.icone} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className={cn("truncate font-medium", discrete ? "text-fg-muted" : "text-fg")}>{r.titre}</p>
            <Badge variant={requestStatusBadgeVariant(r.status)}>{requestStatusLabel(r.status)}</Badge>
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            {[r.categorie, dateCourte(r.creeLe), r.concierge ? `avec ${r.concierge}` : null].filter(Boolean).join(" · ")}
          </p>
          {!discrete && <SuiviCompact status={r.status} className="mt-3 max-w-md" />}
        </div>
        <ChevronRight
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
        />
      </Link>
    </li>
  );
}

function CarteForfait({ forfait: f }: { forfait: Forfait }) {
  const part = f.limite ? Math.min(f.utilisees / f.limite, 1) : 0;
  return (
    <section aria-labelledby="titre-forfait" className="rounded-lg border border-border bg-surface p-6">
      <h2 id="titre-forfait" className={cn(surtitre, "text-fg-muted")}>
        Votre formule
      </h2>
      <p className="mt-3 font-display text-3xl text-fg">{f.nom}</p>
      {f.limite === null ? (
        <>
          <p className="mt-2 text-sm text-fg-muted">Demandes illimitées.</p>
          <Link
            href="/client/forfait"
            className="group mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent"
          >
            Ma formule
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-fg-muted">
            {f.utilisees} demande{f.utilisees > 1 ? "s" : ""} sur {f.limite} ce mois-ci
          </p>
          <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className={cn("h-full rounded-full", f.peutCreer ? "bg-accent" : "bg-warning")}
              style={{ width: `${Math.round(part * 100)}%` }}
            />
          </div>
          {f.peutCreer && f.limite - f.utilisees === 1 && (
            <p className="mt-2 text-xs text-warning">Plus qu&apos;une demande possible ce mois-ci.</p>
          )}
          <Link
            href="/client/forfait"
            className="group mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent"
          >
            {f.peutCreer ? "Voir les formules" : "Passer à une formule supérieure"}
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </>
      )}
    </section>
  );
}
