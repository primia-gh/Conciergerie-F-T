import Link from "next/link";
import { ChevronRight, FileText, Phone, SlidersHorizontal, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnTetePage, PAGE, carteLien } from "@/components/espace/en-tete";
import { EtatVide } from "@/components/espace/etat-vide";
import { STATUT_PROPRIETAIRE, libelle } from "@/components/espace/libelles";
import { ilYa } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type ProspectRow = {
  id: string;
  type: string | null;
  adresse: string | null;
  capacite: number | null;
  created_at: string;
  proprietaire: {
    id: string;
    nom: string;
    telephone: string | null;
    statut: string;
    source: string | null;
  } | null;
};

const ORIGINE: Record<string, string> = {
  formulaire_estimation: "Formulaire d'estimation",
  chat_site: "Chat du site",
};

export const FILTRES = ["prospect", "en_discussion", "client", "perdu"] as const;

/** Liste des prospects F&T (présentation seule : les données viennent de page.tsx). */
export function VueProspects({ data, statut }: { data: ProspectRow[]; statut: (typeof FILTRES)[number] | null }) {
  const tous = data;
  const compte = (s: string) => tous.filter((p) => (p.proprietaire?.statut ?? "prospect") === s).length;
  const affiches = statut ? tous.filter((p) => (p.proprietaire?.statut ?? "prospect") === statut) : tous;

  const puce = (actif: boolean) =>
    cn(
      "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
      actif ? "border-accent bg-accent/10 text-fg" : "border-border text-fg-muted hover:border-accent/60 hover:text-fg",
    );

  return (
    <div className={PAGE.moyenne}>
      <EnTetePage
        surtitre="Conciergerie F&T"
        titre="Prospects"
        actions={
          <>
            <Link href="/admin/fiches/ft/offre_ft" className="inline-flex min-h-11 items-center gap-2 text-sm text-fg-muted hover:text-fg">
              <FileText aria-hidden="true" className="h-4 w-4" /> Fiche offre
            </Link>
            <Link href="/admin/ft/regles" className="inline-flex min-h-11 items-center gap-2 text-sm text-fg-muted hover:text-fg">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" /> Réglages d&apos;autonomie
            </Link>
          </>
        }
      >
        Les propriétaires qui ont demandé une estimation sur /proprietaires (ou écrit au chat, quand il sera
        ouvert). Rappel promis sous 24 h pour le formulaire.
      </EnTetePage>

      <nav aria-label="Filtrer par statut" className="mt-8 flex flex-wrap gap-2">
        <Link href="/admin/ft" aria-current={statut === null ? "page" : undefined} className={puce(statut === null)}>
          Tous <span className="text-fg-muted">{tous.length}</span>
        </Link>
        {FILTRES.map((f) => (
          <Link
            key={f}
            href={`/admin/ft?statut=${f}`}
            aria-current={statut === f ? "page" : undefined}
            className={puce(statut === f)}
          >
            {STATUT_PROPRIETAIRE[f].libelle} <span className="text-fg-muted">{compte(f)}</span>
          </Link>
        ))}
      </nav>

      {affiches.length === 0 ? (
        <EtatVide icone={UserPlus} titre={statut ? "Personne dans ce statut" : "Aucun prospect pour l'instant"} className="mt-6">
          {statut
            ? "Changez de filtre pour voir les autres propriétaires."
            : "Ils apparaîtront ici dès qu'un propriétaire demandera une estimation sur la page /proprietaires."}
        </EtatVide>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {affiches.map((p) => {
            const s = libelle(STATUT_PROPRIETAIRE, p.proprietaire?.statut ?? "prospect");
            return (
              <li key={p.id} className="relative">
                <Link
                  href={`/admin/ft/${p.id}`}
                  className={cn(carteLien, p.proprietaire?.telephone && "pr-20 sm:pr-20 md:pr-52")}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-lg text-accent">
                    {(p.proprietaire?.nom ?? "?")[0].toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="truncate font-medium text-fg">{p.proprietaire?.nom ?? "Prospect"}</span>
                      <Badge variant={s.variante}>{s.libelle}</Badge>
                    </span>
                    <span className="mt-1 block text-sm text-fg-muted">
                      {[p.type ?? "Type non précisé", p.adresse, p.capacite ? `${p.capacite} couchages` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span className="mt-1 block text-xs text-fg-faint">
                      {ORIGINE[p.proprietaire?.source ?? ""] ?? "Origine inconnue"} · {ilYa(p.created_at)}
                    </span>
                  </span>
                  {!p.proprietaire?.telephone && (
                    <ChevronRight
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
                    />
                  )}
                </Link>
                {p.proprietaire?.telephone && (
                  <a
                    href={`tel:${p.proprietaire.telephone.replace(/[^+0-9]/g, "")}`}
                    className="absolute top-1/2 right-4 flex h-11 -translate-y-1/2 items-center gap-2 rounded-full border border-border bg-bg px-3 text-sm text-fg transition-colors hover:border-accent sm:right-5"
                  >
                    <Phone aria-hidden="true" className="h-4 w-4 text-accent" />
                    <span className="sr-only">Appeler {p.proprietaire.nom} au </span>
                    <span className="sr-only md:not-sr-only">{p.proprietaire.telephone}</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
