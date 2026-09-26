import type { ReactNode } from "react";
import { Check, Minus } from "lucide-react";
import {
  FORFAITS,
  demandesAffichees,
  pointsForts,
  prixAffiche,
  type CodeForfait,
  type Forfait,
} from "@/lib/forfaits";
import { cn } from "@/lib/utils";

type Ligne = { libelle: string; valeur: (f: Forfait) => ReactNode };

function OuiNon({ oui }: { oui: boolean }) {
  return oui ? (
    <>
      <Check aria-hidden="true" className="mx-auto h-5 w-5 text-accent" strokeWidth={1.75} />
      <span className="sr-only">Oui</span>
    </>
  ) : (
    <>
      <Minus aria-hidden="true" className="mx-auto h-4 w-4 text-fg-faint" />
      <span className="sr-only">Non</span>
    </>
  );
}

const LIGNES: Ligne[] = [
  { libelle: "Tarif", valeur: (f) => <span className="font-display text-lg">{prixAffiche(f)}</span> },
  { libelle: "Demandes", valeur: (f) => demandesAffichees(f) },
  { libelle: "Réponse prioritaire", valeur: (f) => <OuiNon oui={f.reponsePrioritaire} /> },
  { libelle: "Concierge dédié", valeur: (f) => <OuiNon oui={f.conciergeDedie} /> },
  { libelle: "Disponibilité étendue", valeur: (f) => <OuiNon oui={f.disponibiliteEtendue} /> },
  { libelle: "Avantages partenaires exclusifs", valeur: (f) => <OuiNon oui={f.avantagesPartenaires} /> },
  { libelle: "Sans engagement", valeur: () => <OuiNon oui /> },
];

/**
 * Comparaison des quatre forfaits : tableau sur grand écran, cartes sur
 * téléphone. `actions` place un bouton sous chaque forfait (s'inscrire,
 * demander ce forfait…) ; `enAvant` met une colonne en valeur.
 */
export function ComparaisonForfaits({
  actions,
  enAvant = FORFAITS.find((f) => f.recommande)?.code,
  libelleEnAvant = "Le plus choisi",
}: {
  actions?: (f: Forfait) => ReactNode;
  enAvant?: CodeForfait;
  libelleEnAvant?: string;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Comparaison des forfaits Conciergerie Premium</caption>
          <thead>
            <tr>
              <th scope="col" className="w-1/5 p-4 text-left align-bottom">
                <span className="sr-only">Critère</span>
              </th>
              {FORFAITS.map((f) => (
                <th
                  key={f.code}
                  scope="col"
                  className={cn(
                    "border-t p-5 text-left align-top font-normal",
                    f.code === enAvant ? "border-x border-accent bg-surface-raised" : "border-transparent",
                  )}
                >
                  {f.code === enAvant && (
                    <span className="mb-3 inline-block text-[0.7rem] font-medium tracking-[0.2em] text-accent uppercase">
                      {libelleEnAvant}
                    </span>
                  )}
                  <span className="block font-display text-3xl italic text-fg">{f.nom}</span>
                  <span className="mt-2 block leading-relaxed text-fg-muted">{f.accroche}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIGNES.map((ligne) => (
              <tr key={ligne.libelle}>
                <th scope="row" className="border-t border-border p-4 text-left font-normal text-fg-muted">
                  {ligne.libelle}
                </th>
                {FORFAITS.map((f) => (
                  <td
                    key={f.code}
                    className={cn(
                      "border-t border-border p-4 text-center text-fg",
                      f.code === enAvant && "border-x border-x-accent bg-surface-raised",
                    )}
                  >
                    {ligne.valeur(f)}
                  </td>
                ))}
              </tr>
            ))}
            {actions && (
              <tr>
                <td className="p-4" />
                {FORFAITS.map((f) => (
                  <td
                    key={f.code}
                    className={cn(
                      "border-t border-border p-4 align-top",
                      f.code === enAvant && "border-x border-b border-accent bg-surface-raised",
                    )}
                  >
                    {actions(f)}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-4 md:hidden">
        {FORFAITS.map((f) => (
          <li
            key={f.code}
            className={cn(
              "flex flex-col gap-4 border p-6",
              f.code === enAvant ? "border-accent bg-surface-raised" : "border-border bg-surface",
            )}
          >
            {f.code === enAvant && (
              <span className="text-[0.7rem] font-medium tracking-[0.2em] text-accent uppercase">{libelleEnAvant}</span>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-3xl italic text-fg">{f.nom}</h3>
              <span className="font-display text-lg text-fg">{prixAffiche(f)}</span>
            </div>
            <p className="leading-relaxed text-fg-muted">{f.accroche}</p>
            <ul className="flex flex-col gap-2.5">
              {pointsForts(f).map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-fg">
                  <Check aria-hidden="true" strokeWidth={1.5} className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {p}
                </li>
              ))}
            </ul>
            {actions && <div className="pt-1">{actions(f)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}
