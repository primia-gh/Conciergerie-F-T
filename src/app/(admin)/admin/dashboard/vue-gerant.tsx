import Link from "next/link";
import { AlertTriangle, ArrowRight, Building2, FileEdit, Inbox, UserPlus } from "lucide-react";
import { HorizontalBarChart } from "@/components/features/horizontal-bar-chart";
import { EnTetePage, PAGE, TitreSection } from "@/components/espace/en-tete";
import { NIVEAU_AUTONOMIE, libelleTache } from "@/components/espace/libelles";
import { dateLongue } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type DonneesGerant = {
  prenom: string | null;
  aTraiter: {
    escalades: number;
    escaladesUrgentes: number;
    brouillons: number;
    prospects: number;
    demandesSansConcierge: number;
  };
  /** Tâches de l'assistant qui ne sont pas au niveau « Propose ». */
  reglesAutonomes: { tache: string; niveau: string }[];
  ft: { logements: number; logementsActifs: number; prospectsTotal: number };
  premium: {
    ouvertes: number;
    terminees: number;
    clients: number;
    clientsActifs: number;
    concierges: number;
    reservations: number;
    heuresPriseEnCharge: number | null;
    parCategorie: { label: string; value: number }[];
    parJour: { label: string; value: number }[];
  };
};

function CarteATraiter({
  href,
  icone: Icone,
  valeur,
  libelle,
  detail,
  urgent,
}: {
  href: string;
  icone: typeof Inbox;
  valeur: number;
  libelle: string;
  detail?: string;
  urgent?: boolean;
}) {
  const vide = valeur === 0;
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-4 rounded-lg border p-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        urgent ? "border-danger/60 bg-danger/5 hover:bg-danger/10" : vide ? "border-border hover:bg-surface" : "border-accent/60 bg-surface hover:bg-surface-raised",
      )}
    >
      <span className="flex items-center justify-between">
        <Icone
          aria-hidden="true"
          className={cn("h-5 w-5", urgent ? "text-danger" : vide ? "text-fg-faint" : "text-accent")}
          strokeWidth={1.5}
        />
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
        />
      </span>
      <span>
        <span className={cn("block font-display text-4xl leading-none", vide ? "text-fg-muted" : "text-fg")}>
          {valeur}
        </span>
        <span className="mt-2 block text-sm text-fg">{libelle}</span>
        {detail && <span className={cn("mt-1 block text-xs", urgent ? "text-danger" : "text-fg-muted")}>{detail}</span>}
      </span>
    </Link>
  );
}

function Chiffre({ libelle, valeur, note }: { libelle: string; valeur: string; note?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <dt className="text-sm text-fg-muted">{libelle}</dt>
      <dd className="mt-2 font-display text-3xl leading-none text-fg">{valeur}</dd>
      {note && <dd className="mt-2 text-xs text-fg-muted">{note}</dd>}
    </div>
  );
}

/** Tableau de bord du Gérant, pour ses deux activités (présentation seule). */
export function VueGerant({ d }: { d: DonneesGerant }) {
  const t = d.aTraiter;
  const total = t.escalades + t.brouillons + t.prospects + t.demandesSansConcierge;

  return (
    <div className={PAGE.large}>
      <EnTetePage surtitre={dateLongue(new Date())} titre={`Bonjour ${d.prenom ?? ""}`}>
        {total === 0
          ? "Rien ne vous attend pour le moment, sur aucune des deux activités."
          : "Voici ce qui vous attend, pour vos deux activités."}
      </EnTetePage>

      {d.reglesAutonomes.length > 0 && (
        <div role="note" className="mt-8 flex flex-col gap-3 rounded-lg border border-warning/60 bg-warning/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex gap-3 text-sm text-fg">
            <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0 text-warning" strokeWidth={1.5} />
            <span>
              {d.reglesAutonomes.length === 1
                ? "Une tâche de l'assistant peut agir sans votre clic : "
                : `${d.reglesAutonomes.length} tâches de l'assistant peuvent agir sans votre clic : `}
              {d.reglesAutonomes
                .map((r) => `« ${libelleTache(r.tache)} » (${NIVEAU_AUTONOMIE[r.niveau]?.libelle ?? r.niveau})`)
                .join(", ")}
              .
            </span>
          </p>
          <Link
            href="/admin/ft/regles"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-medium text-accent"
          >
            Voir les réglages
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      )}

      <section aria-labelledby="a-traiter" className="mt-10">
        <TitreSection id="a-traiter">À traiter</TitreSection>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <CarteATraiter
            href="/admin/boite"
            icone={Inbox}
            valeur={t.escalades}
            libelle="Messages à traiter par vous"
            detail={t.escaladesUrgentes > 0 ? `dont ${t.escaladesUrgentes} urgent${t.escaladesUrgentes > 1 ? "s" : ""}` : "Boîte de réception"}
            urgent={t.escaladesUrgentes > 0}
          />
          <CarteATraiter
            href="/admin/boite"
            icone={FileEdit}
            valeur={t.brouillons}
            libelle="Brouillons à relire"
            detail="Boîte de réception"
          />
          <CarteATraiter
            href="/admin/ft?statut=prospect"
            icone={UserPlus}
            valeur={t.prospects}
            libelle="Propriétaires à contacter"
            detail="F&T · nouveaux prospects"
          />
          <CarteATraiter
            href="/admin/requests?status=NEW"
            icone={Building2}
            valeur={t.demandesSansConcierge}
            libelle="Demandes sans concierge"
            detail="Premium"
          />
        </div>
      </section>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-10">
        <section aria-labelledby="titre-ft">
          <TitreSection id="titre-ft">Conciergerie F&amp;T</TitreSection>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <Chiffre
              libelle="Logements actifs"
              valeur={`${d.ft.logementsActifs} / ${d.ft.logements}`}
              note={
                d.ft.logements - d.ft.logementsActifs > 0
                  ? `${d.ft.logements - d.ft.logementsActifs} à compléter dans « Fiches »`
                  : "Utilisables par l'assistant"
              }
            />
            <Chiffre libelle="Propriétaires prospects" valeur={String(d.ft.prospectsTotal)} note="Tous statuts confondus" />
          </dl>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <Link href="/admin/fiches" className="inline-flex min-h-11 items-center text-accent hover:underline">
              Fiches et logements
            </Link>
            <Link href="/admin/ft" className="inline-flex min-h-11 items-center text-accent hover:underline">
              Prospects
            </Link>
            <Link href="/admin/ft/regles" className="inline-flex min-h-11 items-center text-accent hover:underline">
              Réglages d&apos;autonomie
            </Link>
          </div>
        </section>

        <section aria-labelledby="titre-premium">
          <TitreSection id="titre-premium">Conciergerie Premium</TitreSection>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Chiffre libelle="Demandes ouvertes" valeur={String(d.premium.ouvertes)} />
            <Chiffre libelle="Terminées" valeur={String(d.premium.terminees)} />
            <Chiffre libelle="Réservations" valeur={String(d.premium.reservations)} />
            <Chiffre
              libelle="Clients"
              valeur={String(d.premium.clients)}
              note={`${d.premium.clientsActifs} avec au moins une demande`}
            />
            <Chiffre libelle="Concierges" valeur={String(d.premium.concierges)} />
            <Chiffre
              libelle="Prise en charge"
              valeur={d.premium.heuresPriseEnCharge !== null ? `${d.premium.heuresPriseEnCharge.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h` : "—"}
              note={d.premium.heuresPriseEnCharge !== null ? "Délai moyen" : "Aucune demande attribuée"}
            />
          </dl>
          <p className="mt-3 text-xs text-fg-muted">
            Chiffre d&apos;affaires et satisfaction apparaîtront quand le paiement et les avis clients seront branchés.
          </p>
        </section>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="titre-categories" className="rounded-lg border border-border bg-surface p-6">
          <h2 id="titre-categories" className="font-display text-xl text-fg">
            Demandes Premium par catégorie
          </h2>
          <div className="mt-5">
            {d.premium.parCategorie.length === 0 ? (
              <p className="text-sm text-fg-muted">Aucune demande pour l&apos;instant.</p>
            ) : (
              <HorizontalBarChart data={d.premium.parCategorie} />
            )}
          </div>
        </section>
        <section aria-labelledby="titre-jours" className="rounded-lg border border-border bg-surface p-6">
          <h2 id="titre-jours" className="font-display text-xl text-fg">
            Demandes Premium, 14 derniers jours
          </h2>
          <div className="mt-5">
            {d.premium.parJour.every((j) => j.value === 0) ? (
              <p className="text-sm text-fg-muted">Aucune demande sur la période.</p>
            ) : (
              <HorizontalBarChart data={d.premium.parJour.filter((j) => j.value > 0)} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
