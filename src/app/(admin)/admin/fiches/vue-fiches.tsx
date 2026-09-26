import Link from "next/link";
import { ChevronRight, Home, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnTetePage, PAGE, TitreSection, carteLien } from "@/components/espace/en-tete";
import { EtatVide } from "@/components/espace/etat-vide";
import { SECTIONS_GLOBALES, SECTIONS_LOGEMENT, completudeLogement } from "@/lib/agent/fiches-modele";
import type { LigneFiche, ResumeFiches } from "@/server/agent/fiches-lecture";
import { dateCourte } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { NouveauLogementForm } from "./_components/nouveau-logement-form";

export type LogementRow = {
  id: string;
  nom: string;
  adresse: string;
  statut: string;
  proprietaire: { nom: string } | { nom: string }[] | null;
};

const OBLIGATOIRES = SECTIONS_LOGEMENT.filter((s) => s.obligatoire).length;

function CarteSection({
  href,
  libelle,
  aide,
  fiche,
}: {
  href: string;
  libelle: string;
  aide: string;
  fiche: LigneFiche | undefined;
}) {
  return (
    <li>
      <Link href={href} className={cn(carteLien, "h-full items-start")}>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-medium text-fg">{libelle}</span>
            <Badge variant={fiche ? "success" : "warning"}>{fiche ? "Renseignée" : "Vide"}</Badge>
          </span>
          <span className="mt-1 line-clamp-2 block text-sm text-fg-muted">{aide}</span>
          <span className="mt-2 block text-xs text-fg-faint">
            {fiche ? `Version ${fiche.version} · ${dateCourte(fiche.created_at)}` : "L'assistant n'a rien à dire sur ce sujet"}
          </span>
        </span>
        <ChevronRight
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
        />
      </Link>
    </li>
  );
}

/** Vue d'ensemble des fiches (présentation seule : les données viennent de page.tsx). */
export function VueFiches({
  resume,
  logements,
  proprietaires,
}: {
  resume: ResumeFiches;
  logements: LogementRow[];
  proprietaires: { id: string; nom: string }[];
}) {
  return (
    <div className={PAGE.large}>
      <EnTetePage surtitre="Assistant du Gérant" titre="Fiches">
        Ce que l&apos;assistant a le droit de dire. Sans fiche, il ne répond à rien de précis : il vous transmet
        le message. Chaque modification crée une nouvelle version, l&apos;historique est conservé.
      </EnTetePage>

      <nav aria-label="Aller à" className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <a href="#fiches-ft" className="inline-flex min-h-11 items-center text-accent hover:underline">
          Fiche générale F&amp;T
        </a>
        <a href="#logements" className="inline-flex min-h-11 items-center text-accent hover:underline">
          Logements
        </a>
        <a href="#fiches-premium" className="inline-flex min-h-11 items-center text-accent hover:underline">
          Premium
        </a>
      </nav>

      <section id="fiches-ft" aria-labelledby="titre-ft" className="mt-8 scroll-mt-24">
        <TitreSection id="titre-ft">Conciergerie F&amp;T · fiche générale</TitreSection>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {SECTIONS_GLOBALES.ft.map((s) => (
            <CarteSection
              key={s.cle}
              href={`/admin/fiches/ft/${s.cle}`}
              libelle={s.libelle}
              aide={s.aide}
              fiche={resume.globales[`ft::${s.cle}`]}
            />
          ))}
        </ul>
      </section>

      <section id="logements" aria-labelledby="titre-logements" className="mt-12 scroll-mt-24">
        <TitreSection id="titre-logements" compte={logements.length}>
          Logements F&amp;T
        </TitreSection>
        <p className="mt-2 text-sm text-fg-muted">
          Un logement n&apos;est utilisé par l&apos;assistant qu&apos;une fois ses {OBLIGATOIRES} sections obligatoires
          remplies et après votre activation.
        </p>
        {logements.length === 0 ? (
          <EtatVide icone={Home} titre="Aucun logement pour l'instant" className="mt-4">
            Ajoutez votre premier logement ci-dessous, puis remplissez sa fiche.
          </EtatVide>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {logements.map((l) => {
              const completude = completudeLogement(resume.parLogement[l.id] ?? []);
              const remplies = OBLIGATOIRES - completude.manquantes.length;
              const actif = l.statut === "actif";
              const proprietaire = Array.isArray(l.proprietaire) ? l.proprietaire[0] : l.proprietaire;
              return (
                <li key={l.id}>
                  <Link href={`/admin/fiches/ft/logements/${l.id}`} className={cn(carteLien, "h-full")}>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="truncate font-medium text-fg">{l.nom}</span>
                        <Badge variant={actif ? "success" : "neutral"}>{actif ? "Actif" : "Inactif"}</Badge>
                      </span>
                      <span className="mt-1 block truncate text-sm text-fg-muted">
                        {[l.adresse, proprietaire?.nom].filter(Boolean).join(" · ")}
                      </span>
                      <span className="mt-3 flex items-center gap-3">
                        <span aria-hidden="true" className="flex flex-1 gap-1">
                          {Array.from({ length: OBLIGATOIRES }, (_, i) => (
                            <span key={i} className={cn("h-1 flex-1 rounded-full", i < remplies ? "bg-accent" : "bg-border")} />
                          ))}
                        </span>
                        <span className="shrink-0 text-xs text-fg-muted">
                          {completude.complete
                            ? "Fiche complète"
                            : `${remplies} sur ${OBLIGATOIRES} sections obligatoires`}
                        </span>
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

        <details className="mt-4 rounded-lg border border-border bg-surface p-5" open={logements.length === 0}>
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-accent">
            <Plus aria-hidden="true" className="h-4 w-4" /> Ajouter un logement
          </summary>
          <div className="mt-4">
            <NouveauLogementForm proprietaires={proprietaires} />
          </div>
        </details>
      </section>

      <section id="fiches-premium" aria-labelledby="titre-premium" className="mt-12 scroll-mt-24">
        <TitreSection id="titre-premium">Conciergerie Premium</TitreSection>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {SECTIONS_GLOBALES.premium.map((s) => (
            <CarteSection
              key={s.cle}
              href={`/admin/fiches/premium/${s.cle}`}
              libelle={s.libelle}
              aide={s.aide}
              fiche={resume.globales[`premium::${s.cle}`]}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
