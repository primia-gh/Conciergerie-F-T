import Link from "next/link";
import { Check, Clock, Gauge } from "lucide-react";
import { forfait, forfaitSuperieur, pointsForts } from "@/lib/forfaits";
import { dateLongue } from "@/lib/dates";
import { BoutonDemanderFormule } from "../../forfait/boutons-formule";

/**
 * Limite de la formule atteinte : on propose la formule juste au-dessus, avec
 * une demande en un clic, ou on rappelle la demande déjà envoyée.
 */
export function LimiteAtteinte({
  code,
  nom,
  limite,
  demande,
}: {
  code: string;
  nom: string;
  limite: number | null;
  demande: { code: string; le: string } | null;
}) {
  const suivante = forfaitSuperieur(code);
  const demandee = demande ? forfait(demande.code) : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
          <Gauge aria-hidden="true" className="h-7 w-7 text-warning" strokeWidth={1.5} />
        </span>
        <p className="mt-6 text-xs font-medium tracking-[0.2em] text-warning uppercase">Limite atteinte</p>
        <h1 className="mt-3 font-display text-4xl text-fg">Votre formule est complète ce mois-ci</h1>
        <p className="mt-4 leading-relaxed text-fg-muted">
          La formule {nom} comprend {limite} demande{limite && limite > 1 ? "s" : ""} par mois, et vous les avez
          toutes utilisées. Le compteur repart à zéro le 1er du mois.
        </p>
      </div>

      {demandee ? (
        <section role="status" className="mt-10 rounded-lg border border-accent/60 bg-surface p-6 text-center">
          <p className="flex items-center justify-center gap-2 text-sm text-accent">
            <Clock aria-hidden="true" className="h-4 w-4" /> Demande en cours
          </p>
          <p className="mt-2 font-display text-3xl text-fg">{demandee.nom}</p>
          <p className="mt-2 text-sm text-fg-muted">
            Envoyée le {dateLongue(demande!.le)} : nous revenons vers vous pour l&apos;activer.
          </p>
        </section>
      ) : (
        suivante && (
          <section aria-labelledby="titre-suivante" className="mt-10 rounded-lg border border-accent/60 bg-surface p-6 sm:p-8">
            <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">Pour continuer ce mois-ci</p>
            <h2 id="titre-suivante" className="mt-2 font-display text-3xl italic text-fg">
              {suivante.nom}
            </h2>
            <p className="mt-2 text-fg-muted">{suivante.accroche}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {pointsForts(suivante).map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-fg">
                  <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-6 max-w-xs">
              <BoutonDemanderFormule code={suivante.code} nom={suivante.nom} principal />
            </div>
            <p className="mt-3 text-xs text-fg-muted">
              Tarif communiqué sur demande : nous revenons vers vous avant toute activation.
            </p>
          </section>
        )
      )}

      <div className="mt-8 flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/client/dashboard"
          className="inline-flex min-h-12 items-center px-6 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          Retour à mes demandes
        </Link>
        <Link
          href="/client/forfait"
          className="inline-flex min-h-12 items-center border border-accent px-6 text-sm text-fg transition-colors hover:bg-accent hover:text-accent-fg"
        >
          Comparer toutes les formules
        </Link>
      </div>
    </div>
  );
}
