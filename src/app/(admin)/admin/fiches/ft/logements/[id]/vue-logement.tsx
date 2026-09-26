import Link from "next/link";
import { BookOpen, CheckCircle2, ChevronRight, KeyRound, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LienRetour, PAGE, TitreSection, carteLien, surtitre } from "@/components/espace/en-tete";
import { SECTIONS_LOGEMENT, type CompletudeLogement } from "@/lib/agent/fiches-modele";
import { dateCourte } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ActivationBoutons } from "../../../_components/activation-boutons";
import { CopierLien } from "../../../_components/copier-lien";

export type DonneesLogement = {
  logement: { id: string; nom: string; adresse: string; capacite: number | null; statut: string };
  proprietaire: { id: string; nom: string } | null;
  sections: Record<string, { contenu: string; version: number; created_at: string } | undefined>;
  completude: CompletudeLogement;
};

/** Fiche d'un logement F&T (présentation seule : les données viennent de page.tsx). */
export function VueLogement({ d }: { d: DonneesLogement }) {
  const { logement, proprietaire, completude } = d;
  const actif = logement.statut === "actif";

  return (
    <div className={PAGE.large}>
      <LienRetour href="/admin/fiches#logements">Fiches</LienRetour>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className={cn(surtitre, "text-accent")}>Logement F&amp;T</p>
          <h1 className="mt-3 font-display text-4xl break-words text-fg">{logement.nom}</h1>
          <p className="mt-3 text-fg-muted">
            {[logement.adresse, logement.capacite ? `${logement.capacite} personnes` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Badge variant={actif ? "success" : "neutral"} className="self-start px-3 py-1 text-sm sm:self-auto">
          {actif ? "Actif pour l'assistant" : "Inactif"}
        </Badge>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <section aria-labelledby="titre-sections" className="min-w-0 lg:col-span-2">
          <TitreSection id="titre-sections">Sections de la fiche</TitreSection>
          <p className="mt-2 text-sm text-fg-muted">
            Une information par ligne. Aucun code ni mot de passe : écrivez « transmis par le Gérant ».
          </p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {SECTIONS_LOGEMENT.map((s) => {
              const fiche = d.sections[s.cle];
              const remplie = Boolean(fiche && fiche.contenu.trim());
              return (
                <li key={s.cle}>
                  <Link href={`/admin/fiches/ft/logements/${logement.id}/${s.cle}`} className={cn(carteLien, "h-full")}>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-medium text-fg">{s.libelle}</span>
                        <Badge variant={remplie ? "success" : s.obligatoire ? "warning" : "neutral"}>
                          {remplie ? "Renseignée" : s.obligatoire ? "Obligatoire" : "Facultative"}
                        </Badge>
                      </span>
                      <span className="mt-1 block text-xs text-fg-faint">
                        {remplie ? `Version ${fiche!.version} · ${dateCourte(fiche!.created_at)}` : "Pas encore renseignée"}
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
        </section>

        <aside className="flex flex-col gap-5" aria-label="Activation et liens">
          <section aria-labelledby="titre-activation" className="rounded-lg border border-accent/60 bg-surface p-5">
            <h2 id="titre-activation" className="flex items-center gap-2 font-display text-xl text-fg">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={1.5} /> Activation
            </h2>
            <p className="mt-2 mb-4 text-sm text-fg-muted">
              {completude.complete
                ? actif
                  ? "La fiche est complète et l'assistant utilise ce logement."
                  : "La fiche est complète : vous pouvez activer ce logement pour l'assistant."
                : `Pour l'activer, il manque : ${completude.manquantes.map((s) => s.libelle).join(", ")}.`}
            </p>
            {(actif || completude.complete) && <ActivationBoutons logementId={logement.id} actif={actif} />}
          </section>

          <section aria-labelledby="titre-guide" className="rounded-lg border border-border bg-surface p-5">
            <h2 id="titre-guide" className="flex items-center gap-2 font-display text-xl text-fg">
              <BookOpen aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={1.5} /> Guide voyageur
            </h2>
            <p className="mt-2 mb-4 text-sm text-fg-muted">
              {actif
                ? "Une page simple avec les informations du logement, sans les codes d'accès, à envoyer au voyageur."
                : "Le lien sera disponible une fois ce logement activé."}
            </p>
            {actif && <CopierLien chemin={`/guide/${logement.id}`} label="Copier le lien du guide" />}
          </section>

          {proprietaire && (
            <section aria-labelledby="titre-portail" className="rounded-lg border border-border bg-surface p-5">
              <h2 id="titre-portail" className="flex items-center gap-2 font-display text-xl text-fg">
                <UserRound aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={1.5} /> {proprietaire.nom}
              </h2>
              <p className="mt-2 mb-4 text-sm text-fg-muted">
                Sa page : ses logements et leur statut, sans vos notes internes ni données de réservation (pas encore
                disponibles).
              </p>
              <CopierLien chemin={`/proprietaire/${proprietaire.id}`} label="Copier le lien du portail" />
            </section>
          )}

          <p className="flex gap-2 text-xs text-fg-muted">
            <KeyRound aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Les codes d&apos;accès ne figurent jamais dans les fiches ni dans ces pages.
          </p>
        </aside>
      </div>
    </div>
  );
}
