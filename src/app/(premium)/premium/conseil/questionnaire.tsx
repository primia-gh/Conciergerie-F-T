"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import {
  forfait,
  pointsForts,
  prixAffiche,
  recommanderForfait,
  type Accompagnement,
  type CodeForfait,
  type Frequence,
} from "@/lib/forfaits";
import { cn } from "@/lib/utils";

const INTERETS = [
  "Restaurants",
  "Voyages",
  "Hôtels",
  "Transport",
  "Événements",
  "Expériences",
  "Bien-être",
  "Shopping",
  "Autre",
];

const FREQUENCES: { valeur: Frequence; titre: string; detail: string }[] = [
  { valeur: "occasionnelle", titre: "De temps en temps", detail: "Une ou deux demandes par mois" },
  { valeur: "reguliere", titre: "Régulièrement", detail: "Jusqu'à une dizaine par mois" },
  { valeur: "frequente", titre: "Très souvent", detail: "Plus de dix par mois" },
];

const ACCOMPAGNEMENTS: { valeur: Accompagnement; titre: string; detail: string }[] = [
  { valeur: "standard", titre: "Un service à la demande", detail: "Un concierge prend chaque demande en charge" },
  { valeur: "dedie", titre: "Un concierge dédié", detail: "Toujours le même interlocuteur, qui vous connaît" },
  { valeur: "sur_mesure", titre: "Un service sur-mesure", detail: "Une disponibilité étendue et des avantages partenaires" },
];

const POURQUOI: Record<CodeForfait, (r: { frequence: Frequence; accompagnement: Accompagnement }) => string> = {
  free: () => "Pour une ou deux demandes par mois, Free suffit pour commencer. Vous pourrez changer de formule à tout moment.",
  premium: () => "Jusqu'à une dizaine de demandes par mois : Premium en comprend dix, avec une réponse prioritaire.",
  vip: (r) =>
    r.accompagnement === "dedie"
      ? "Vous souhaitez un concierge dédié : c'est le cœur de VIP, avec des demandes illimitées."
      : "Avec plus de dix demandes par mois, VIP vous évite toute limite, avec un concierge dédié.",
  private: () => "Vous souhaitez un service sur-mesure : Private ajoute une disponibilité étendue et des avantages partenaires exclusifs.",
};

const carte = (choisie: boolean) =>
  cn(
    "flex min-h-20 cursor-pointer flex-col justify-center gap-1 border px-5 py-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
    choisie ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-accent/50",
  );

/** « Quelle formule pour moi ? » : trois questions, un conseil. Rien n'est enregistré. */
export function Questionnaire({ estClient }: { estClient: boolean }) {
  const [interets, setInterets] = useState<string[]>([]);
  const [frequence, setFrequence] = useState<Frequence | null>(null);
  const [accompagnement, setAccompagnement] = useState<Accompagnement | null>(null);
  const [resultat, setResultat] = useState<CodeForfait | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const resultatRef = useRef<HTMLDivElement>(null);

  function conseiller(e: React.FormEvent) {
    e.preventDefault();
    if (!frequence || !accompagnement) {
      setErreur("Répondez aux questions 2 et 3 pour voir la formule conseillée.");
      return;
    }
    setErreur(null);
    setResultat(recommanderForfait({ frequence, accompagnement }));
    // Laisse le temps d'afficher le résultat, puis y amène le lecteur.
    requestAnimationFrame(() => resultatRef.current?.focus());
  }

  function recommencer() {
    setInterets([]);
    setFrequence(null);
    setAccompagnement(null);
    setResultat(null);
  }

  const conseil = resultat ? forfait(resultat) : undefined;

  return (
    <div className="flex flex-col gap-12">
      <form onSubmit={conseiller} className="flex flex-col gap-10" noValidate>
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-display text-2xl">
            <span className="text-accent">1.</span> Que souhaitez-vous nous confier ?{" "}
            <span className="font-sans text-sm text-fg-muted">(plusieurs choix possibles)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {INTERETS.map((i) => {
              const coche = interets.includes(i);
              return (
                <label
                  key={i}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                    coche ? "border-accent bg-accent/10 text-fg" : "border-border text-fg-muted hover:border-accent/50 hover:text-fg",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={coche}
                    onChange={() => setInterets((l) => (coche ? l.filter((x) => x !== i) : [...l, i]))}
                  />
                  {coche && <Check aria-hidden="true" className="h-4 w-4 text-accent" />}
                  {i}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-display text-2xl">
            <span className="text-accent">2.</span> À quelle fréquence ?
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {FREQUENCES.map((f) => (
              <label key={f.valeur} className={carte(frequence === f.valeur)}>
                <input
                  type="radio"
                  name="frequence"
                  className="sr-only"
                  checked={frequence === f.valeur}
                  onChange={() => setFrequence(f.valeur)}
                />
                <span className="font-medium text-fg">{f.titre}</span>
                <span className="text-sm text-fg-muted">{f.detail}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-display text-2xl">
            <span className="text-accent">3.</span> Quel accompagnement souhaitez-vous ?
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {ACCOMPAGNEMENTS.map((a) => (
              <label key={a.valeur} className={carte(accompagnement === a.valeur)}>
                <input
                  type="radio"
                  name="accompagnement"
                  className="sr-only"
                  checked={accompagnement === a.valeur}
                  onChange={() => setAccompagnement(a.valeur)}
                />
                <span className="font-medium text-fg">{a.titre}</span>
                <span className="text-sm text-fg-muted">{a.detail}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {erreur && (
          <p role="alert" className="border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {erreur}
          </p>
        )}

        <div className="flex flex-col items-start gap-3">
          <button
            type="submit"
            className="group inline-flex min-h-14 items-center gap-3 bg-accent px-8 text-base font-medium tracking-wide text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
          >
            Voir la formule conseillée
            <ArrowRight aria-hidden="true" className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
          </button>
          <p className="text-sm text-fg-muted">Vos réponses ne sont ni enregistrées ni envoyées.</p>
        </div>
      </form>

      <div ref={resultatRef} tabIndex={-1} aria-live="polite" className="scroll-mt-24 outline-none">
        {conseil && frequence && accompagnement && (
          <section aria-labelledby="titre-conseil" className="flex flex-col gap-6 border border-accent bg-surface-raised p-7 sm:p-10">
            <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">Notre conseil</p>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="titre-conseil" className="font-display text-5xl italic text-accent-hover">
                {conseil.nom}
              </h2>
              <span className="font-display text-2xl">{prixAffiche(conseil)}</span>
            </div>
            <p className="max-w-2xl text-lg leading-relaxed text-fg">{POURQUOI[conseil.code]({ frequence, accompagnement })}</p>
            {interets.length > 0 && (
              <p className="text-fg-muted">
                {interets.join(", ")} : nos concierges s&apos;en occupent, quelle que soit votre formule.
              </p>
            )}
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {pointsForts(conseil).map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <Check aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={estClient ? "/client/forfait" : "/signup"}
                className="group inline-flex min-h-12 items-center justify-center gap-3 bg-accent px-7 text-base font-medium tracking-wide text-accent-fg transition-colors hover:bg-accent-hover"
              >
                {estClient ? "Demander cette formule" : conseil.code === "free" ? "Commencer gratuitement" : "Créer mon compte"}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/premium/forfaits"
                className="inline-flex min-h-12 items-center justify-center border border-accent px-7 text-sm tracking-wide text-fg transition-colors hover:bg-accent hover:text-accent-fg"
              >
                Comparer toutes les formules
              </Link>
              <button
                type="button"
                onClick={recommencer}
                className="inline-flex min-h-12 items-center gap-2 px-2 text-sm text-fg-muted transition-colors hover:text-fg"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" /> Recommencer
              </button>
            </div>
            {!estClient && conseil.code !== "free" && (
              <p className="text-sm text-fg-muted">
                Vous commencez avec Free ; demandez ensuite {conseil.nom} depuis votre espace, nous revenons vers
                vous pour l&apos;activer.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
