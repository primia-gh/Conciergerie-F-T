import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnTetePage, PAGE, TitreSection, carteLien } from "@/components/espace/en-tete";
import { EtatVide } from "@/components/espace/etat-vide";
import { LIBELLES_ESCALADE } from "@/lib/agent/demande";
import type { CategorieEscalade } from "@/lib/agent/missions/assistant-gerant/outils";
import { ilYa } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { NouvelleDemandeForm } from "./nouvelle-demande-form";

export type DemandeRow = {
  id: string;
  activite: "ft" | "premium";
  statut: "nouveau" | "brouillon_pret" | "valide" | "corrige" | "escalade";
  expediteur: string | null;
  contenu_recu: string;
  categorie_escalade: CategorieEscalade | null;
  escalade_urgente: boolean;
  traite_le: string | null;
  created_at: string;
};

export type FiltreBoite = "a_traiter" | "traitees" | "toutes";

const ACTIVITE_LIBELLE = { ft: "F&T", premium: "Premium" } as const;

export function badgeStatut(d: Pick<DemandeRow, "statut" | "traite_le" | "escalade_urgente">) {
  if (d.traite_le) {
    return d.statut === "escalade"
      ? { variant: "neutral" as const, libelle: "Traité (escalade)" }
      : { variant: "success" as const, libelle: d.statut === "corrige" ? "Corrigé" : "Validé" };
  }
  if (d.statut === "escalade") {
    return { variant: d.escalade_urgente ? ("danger" as const) : ("warning" as const), libelle: d.escalade_urgente ? "Urgent : à traiter par vous" : "À traiter par vous" };
  }
  return { variant: "accent" as const, libelle: "Brouillon prêt" };
}

/** Boîte de réception du Gérant (présentation seule : les données viennent de page.tsx). */
export function VueBoite({
  demandes,
  logements,
  filtre,
}: {
  demandes: DemandeRow[];
  logements: { id: string; nom: string }[];
  filtre: FiltreBoite;
}) {
  const aTraiter = demandes.filter((d) => !d.traite_le);
  const traitees = demandes.filter((d) => d.traite_le);
  const affichees = filtre === "a_traiter" ? aTraiter : filtre === "traitees" ? traitees : demandes;

  const puce = (actif: boolean) =>
    cn(
      "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
      actif ? "border-accent bg-accent/10 text-fg" : "border-border text-fg-muted hover:border-accent/60 hover:text-fg",
    );

  return (
    <div className={PAGE.large}>
      <EnTetePage surtitre="Assistant du Gérant" titre="Boîte de réception">
        Collez un message reçu : l&apos;assistant prépare un brouillon à partir de vos fiches. Vous relisez,
        corrigez si besoin, puis vous l&apos;envoyez vous-même. Rien ne part tout seul.
      </EnTetePage>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <section aria-labelledby="titre-nouveau" className="self-start rounded-lg border border-accent/60 bg-surface p-5 sm:p-6">
          <h2 id="titre-nouveau" className="mb-5 font-display text-2xl text-fg">
            Nouveau message
          </h2>
          <NouvelleDemandeForm logements={logements} />
        </section>

        <section aria-labelledby="titre-recentes" className="min-w-0">
          <TitreSection id="titre-recentes">Messages récents</TitreSection>
          <nav aria-label="Filtrer les messages" className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/boite" aria-current={filtre === "toutes" ? "page" : undefined} className={puce(filtre === "toutes")}>
              Tous <span className="text-fg-muted">{demandes.length}</span>
            </Link>
            <Link
              href="/admin/boite?vue=a_traiter"
              aria-current={filtre === "a_traiter" ? "page" : undefined}
              className={puce(filtre === "a_traiter")}
            >
              À traiter <span className="text-fg-muted">{aTraiter.length}</span>
            </Link>
            <Link
              href="/admin/boite?vue=traitees"
              aria-current={filtre === "traitees" ? "page" : undefined}
              className={puce(filtre === "traitees")}
            >
              Traités <span className="text-fg-muted">{traitees.length}</span>
            </Link>
          </nav>

          {affichees.length === 0 ? (
            <EtatVide
              icone={Inbox}
              titre={filtre === "a_traiter" ? "Tout est traité" : "Aucun message pour l'instant"}
              className="mt-4"
            >
              {filtre === "a_traiter"
                ? "Aucun brouillon ni escalade n'attend votre relecture."
                : "Collez un premier message dans le formulaire pour voir l'assistant à l'œuvre."}
            </EtatVide>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {affichees.map((d) => {
                const statut = badgeStatut(d);
                return (
                  <li key={d.id}>
                    <Link
                      href={`/admin/boite/${d.id}`}
                      className={cn(carteLien, d.traite_le && "bg-transparent", !d.traite_le && d.escalade_urgente && "border-danger/60")}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <Badge variant="neutral">{ACTIVITE_LIBELLE[d.activite]}</Badge>
                          <Badge variant={statut.variant}>{statut.libelle}</Badge>
                          <span className="text-xs text-fg-faint">{ilYa(d.created_at)}</span>
                        </span>
                        <span className={cn("mt-2 line-clamp-2 block text-sm", d.traite_le ? "text-fg-muted" : "text-fg")}>
                          {d.contenu_recu}
                        </span>
                        <span className="mt-1 block text-xs text-fg-muted">
                          {[
                            d.expediteur ?? "Expéditeur non précisé",
                            d.categorie_escalade && !d.traite_le
                              ? (LIBELLES_ESCALADE[d.categorie_escalade] ?? d.categorie_escalade)
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
