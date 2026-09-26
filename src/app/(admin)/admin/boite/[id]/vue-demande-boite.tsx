import { AlertTriangle, BookOpen, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LienRetour, PAGE, surtitre } from "@/components/espace/en-tete";
import { LIBELLES_ESCALADE } from "@/lib/agent/demande";
import type { CategorieEscalade } from "@/lib/agent/missions/assistant-gerant/outils";
import { dateCourte, dateLongue, heure } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { badgeStatut } from "../vue-boite";
import { AjoutFicheForm } from "./ajout-fiche-form";
import { ClotureForm } from "./cloture-form";

export type DonneesDemandeBoite = {
  id: string;
  activite: "ft" | "premium";
  statut: "nouveau" | "brouillon_pret" | "valide" | "corrige" | "escalade";
  expediteur: string | null;
  logement: string | null;
  contenu_recu: string;
  langue: string | null;
  brouillon: string | null;
  reponse_finale: string | null;
  motif_escalade: string | null;
  categorie_escalade: CategorieEscalade | null;
  escalade_urgente: boolean;
  fiches: { id: string; section: string; version: number }[];
  traite_le: string | null;
  created_at: string;
  /** Fiches proposées pour « Ajouter cette information à une fiche ? » ; vide si sans objet. */
  optionsAjout: { value: string; label: string }[];
};

const ACTIVITE_LIBELLE = { ft: "F&T", premium: "Premium" } as const;
const LANGUE_LIBELLE: Record<string, string> = {
  fr: "français",
  en: "anglais",
  de: "allemand",
  es: "espagnol",
  it: "italien",
  nl: "néerlandais",
};

/** Un message de la boîte de réception (présentation seule : les données viennent de page.tsx). */
export function VueDemandeBoite({ d }: { d: DonneesDemandeBoite }) {
  const estEscalade = d.statut === "escalade";
  const traitee = d.traite_le !== null;
  const statut = badgeStatut(d);

  return (
    <div className={PAGE.large}>
      <LienRetour href="/admin/boite">Boîte de réception</LienRetour>

      <header className="flex flex-col gap-4">
        <p className={cn(surtitre, "text-accent")}>
          Message reçu le {dateLongue(d.created_at)} à {heure(d.created_at)}
        </p>
        <h1 className="font-display text-4xl break-words text-fg">{d.expediteur ?? "Expéditeur non précisé"}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{ACTIVITE_LIBELLE[d.activite]}</Badge>
          {d.logement && <Badge variant="accent">{d.logement}</Badge>}
          <Badge variant={statut.variant}>{statut.libelle}</Badge>
        </div>
      </header>

      {estEscalade && !traitee && (
        <div
          role="alert"
          className={cn(
            "mt-8 flex gap-3 rounded-lg border p-5 text-sm",
            d.escalade_urgente ? "border-danger bg-danger/10 text-danger" : "border-warning bg-warning/10 text-warning",
          )}
        >
          <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-medium">
              {d.escalade_urgente ? "Urgent : " : ""}l&apos;assistant vous passe la main
              {d.categorie_escalade ? ` (${LIBELLES_ESCALADE[d.categorie_escalade] ?? d.categorie_escalade})` : ""}.
            </p>
            {d.motif_escalade && <p className="mt-1 text-fg">{d.motif_escalade}</p>}
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section aria-labelledby="titre-recu" className="flex flex-col self-start rounded-lg border border-border bg-surface p-5 sm:p-6">
          <h2 id="titre-recu" className="flex items-center gap-2 font-display text-xl text-fg">
            <Mail aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={1.5} /> Message reçu
          </h2>
          <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-fg">{d.contenu_recu}</p>
        </section>

        <section
          aria-labelledby="titre-reponse"
          className={cn("rounded-lg border bg-surface p-5 sm:p-6", traitee ? "border-border" : "border-accent/60")}
        >
          <h2 id="titre-reponse" className="font-display text-xl text-fg">
            {traitee ? "Réponse enregistrée" : estEscalade && d.brouillon ? "Brouillon d'attente" : estEscalade ? "Votre réponse" : "Brouillon"}
          </h2>
          {d.langue && !traitee && (
            <p className="mt-1 text-sm text-fg-muted">Rédigé en {LANGUE_LIBELLE[d.langue] ?? d.langue}.</p>
          )}
          <div className="mt-4">
            {traitee ? (
              <>
                <p className="text-sm text-fg-muted">
                  {d.statut === "valide" ? "Validé tel quel" : d.statut === "corrige" ? "Corrigé par vous" : "Escalade traitée"} le{" "}
                  {dateCourte(d.traite_le!)} à {heure(d.traite_le!)}.
                </p>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-fg">
                  {d.reponse_finale ?? "Aucune réponse enregistrée."}
                </p>
              </>
            ) : (
              <ClotureForm demandeId={d.id} estEscalade={estEscalade} texteInitial={d.brouillon ?? ""} />
            )}
          </div>
        </section>
      </div>

      {d.optionsAjout.length > 0 && (
        <div className="mt-8">
          <AjoutFicheForm demandeId={d.id} options={d.optionsAjout} ligneInitiale={d.reponse_finale ?? ""} />
        </div>
      )}

      {d.fiches.length > 0 && (
        <p className="mt-8 flex gap-2 text-sm text-fg-muted">
          <BookOpen aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span>
            Fiches fournies à l&apos;assistant : {d.fiches.map((f) => `${f.section} (v${f.version})`).join(", ")}.
          </span>
        </p>
      )}
    </div>
  );
}
