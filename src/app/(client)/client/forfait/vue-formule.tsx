import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { EnTetePage, PAGE, TitreSection } from "@/components/espace/en-tete";
import { ComparaisonForfaits } from "@/components/premium/comparaison-forfaits";
import { forfait, type CodeForfait } from "@/lib/forfaits";
import { dateLongue } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { BadgeFormule, BoutonAnnulerDemande, BoutonDemanderFormule } from "./boutons-formule";

export type DonneesFormule = {
  actuelle: { code: CodeForfait; nom: string; limite: number | null; utilisees: number };
  demande: { code: string; le: string } | null;
};

/** La formule du client et le changement de formule (présentation seule : les données viennent de page.tsx). */
export function VueFormule({ d }: { d: DonneesFormule }) {
  const { actuelle, demande } = d;
  const demandee = demande ? forfait(demande.code) : undefined;
  const part = actuelle.limite ? Math.min(actuelle.utilisees / actuelle.limite, 1) : 0;
  const complet = actuelle.limite !== null && actuelle.utilisees >= actuelle.limite;

  return (
    <div className={PAGE.large}>
      <EnTetePage surtitre="Mon espace" titre="Ma formule">
        Changez de formule quand vous le souhaitez, sans engagement : votre demande nous est transmise et nous
        revenons vers vous pour l&apos;activer.
      </EnTetePage>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="titre-actuelle" className="rounded-lg border border-border bg-surface p-6">
          <TitreSection id="titre-actuelle">Votre formule</TitreSection>
          <p className="mt-3 font-display text-4xl text-fg">{actuelle.nom}</p>
          {actuelle.limite === null ? (
            <p className="mt-2 text-sm text-fg-muted">Demandes illimitées.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-fg-muted">
                {actuelle.utilisees} demande{actuelle.utilisees > 1 ? "s" : ""} sur {actuelle.limite} ce mois-ci
                {complet ? " : limite atteinte." : "."}
              </p>
              <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full rounded-full", complet ? "bg-warning" : "bg-accent")}
                  style={{ width: `${Math.round(part * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-fg-faint">Le compteur repart à zéro le 1er de chaque mois.</p>
            </>
          )}
        </section>

        {demande ? (
          <section
            aria-labelledby="titre-demande"
            role="status"
            className="rounded-lg border border-accent/60 bg-surface p-6"
          >
            <TitreSection id="titre-demande" className="gap-2">
              <Clock aria-hidden="true" className="h-3.5 w-3.5" /> Demande en cours
            </TitreSection>
            <p className="mt-3 font-display text-4xl text-fg">{demandee?.nom ?? demande.code}</p>
            <p className="mt-2 text-sm text-fg-muted">
              Envoyée le {dateLongue(demande.le)}. Nous revenons vers vous pour les modalités, puis nous
              activons la formule.
            </p>
            <div className="mt-4">
              <BoutonAnnulerDemande />
            </div>
          </section>
        ) : (
          <section aria-labelledby="titre-aide" className="rounded-lg border border-dashed border-border p-6">
            <TitreSection id="titre-aide">Vous hésitez ?</TitreSection>
            <p className="mt-3 text-fg-muted">Trois questions pour savoir quelle formule vous correspond.</p>
            <Link
              href="/premium/conseil"
              className="group mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent"
            >
              Quelle formule pour moi ?
              <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
          </section>
        )}
      </div>

      <section aria-labelledby="titre-comparaison" className="mt-12">
        <TitreSection id="titre-comparaison">Toutes les formules</TitreSection>
        <p className="mt-2 mb-6 text-sm text-fg-muted">
          Tarifs des formules payantes communiqués sur demande.
        </p>
        <ComparaisonForfaits
          enAvant={actuelle.code}
          libelleEnAvant="Votre formule"
          actions={(f) =>
            f.code === actuelle.code ? (
              <BadgeFormule texte="Votre formule actuelle" />
            ) : demande?.code === f.code ? (
              <BadgeFormule texte="Demande envoyée" />
            ) : (
              <BoutonDemanderFormule code={f.code} nom={f.nom} principal={!demande && f.recommande} />
            )
          }
        />
      </section>
    </div>
  );
}
