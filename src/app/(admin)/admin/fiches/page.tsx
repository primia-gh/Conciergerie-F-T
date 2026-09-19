import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SECTIONS_GLOBALES, completudeLogement } from "@/lib/agent/fiches-modele";
import { lireResumeFiches, type LigneFiche } from "@/server/agent/fiches-lecture";
import { NouveauLogementForm } from "./_components/nouveau-logement-form";

type LogementRow = {
  id: string;
  nom: string;
  adresse: string;
  statut: string;
  proprietaire: { nom: string } | { nom: string }[] | null;
};

function CarteSectionGlobale({
  activite,
  cle,
  libelle,
  aide,
  fiche,
}: {
  activite: "ft" | "premium";
  cle: string;
  libelle: string;
  aide: string;
  fiche: LigneFiche | undefined;
}) {
  return (
    <Link href={`/admin/fiches/${activite}/${cle}`}>
      <Card className="transition-colors hover:bg-bg-subtle">
        <CardContent className="flex items-start justify-between gap-4 pt-5">
          <div>
            <p className="font-medium text-fg">{libelle}</p>
            <p className="mt-1 text-sm text-fg-muted">{aide}</p>
            <p className="mt-2 text-xs text-fg-faint">
              {fiche
                ? `Version ${fiche.version} · ${new Date(fiche.created_at).toLocaleDateString("fr-FR")}`
                : "Pas encore renseignée"}
            </p>
          </div>
          <Badge variant={fiche ? "success" : "neutral"} className="shrink-0">
            {fiche ? "Renseignée" : "Vide"}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function AdminFichesPage() {
  const supabase = await createClient();

  const [resume, { data: logements }, { data: proprietaires }] = await Promise.all([
    lireResumeFiches(supabase),
    supabase
      .from("logement")
      .select("id, nom, adresse, statut, proprietaire:proprietaire_id(nom)")
      .order("created_at", { ascending: false })
      .returns<LogementRow[]>(),
    supabase.from("proprietaire").select("id, nom").order("nom").returns<{ id: string; nom: string }[]>(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-2xl font-medium text-fg">Fiches</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Ce que l&apos;assistant a le droit de dire. Sans fiche, il ne répond à rien de précis : il vous transmet
        le message. Chaque modification crée une nouvelle version, l&apos;historique est conservé.
      </p>

      <h2 className="mt-10 font-display text-xl font-medium text-fg">F&amp;T</h2>
      <div className="mt-4 flex flex-col gap-3">
        {SECTIONS_GLOBALES.ft.map((s) => (
          <CarteSectionGlobale
            key={s.cle}
            activite="ft"
            cle={s.cle}
            libelle={s.libelle}
            aide={s.aide}
            fiche={resume.globales[`ft::${s.cle}`]}
          />
        ))}
      </div>

      <h3 className="mt-8 font-display text-lg font-medium text-fg">Logements</h3>
      {!logements || logements.length === 0 ? (
        <p className="mt-3 text-sm text-fg-muted">Aucun logement pour l&apos;instant.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {logements.map((l) => {
            const completude = completudeLogement(resume.parLogement[l.id] ?? []);
            const actif = l.statut === "actif";
            const proprietaire = Array.isArray(l.proprietaire) ? l.proprietaire[0] : l.proprietaire;
            return (
              <li key={l.id}>
                <Link href={`/admin/fiches/ft/logements/${l.id}`}>
                  <Card className="transition-colors hover:bg-bg-subtle">
                    <CardContent className="flex items-start justify-between gap-4 pt-5">
                      <div className="min-w-0">
                        <p className="font-medium text-fg">{l.nom}</p>
                        <p className="mt-1 truncate text-sm text-fg-muted">
                          {l.adresse}
                          {proprietaire ? ` · ${proprietaire.nom}` : ""}
                        </p>
                        <p className="mt-2 text-xs text-fg-faint">
                          {completude.complete
                            ? "Fiche complète"
                            : `Il manque : ${completude.manquantes.map((s) => s.libelle).join(", ")}`}
                        </p>
                      </div>
                      <Badge variant={actif ? "success" : "neutral"} className="shrink-0">
                        {actif ? "Actif" : "Inactif"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-accent">Ajouter un logement</summary>
        <Card className="mt-3">
          <CardContent className="pt-5">
            <NouveauLogementForm proprietaires={proprietaires ?? []} />
          </CardContent>
        </Card>
      </details>

      <h2 className="mt-12 font-display text-xl font-medium text-fg">Premium</h2>
      <div className="mt-4 flex flex-col gap-3">
        {SECTIONS_GLOBALES.premium.map((s) => (
          <CarteSectionGlobale
            key={s.cle}
            activite="premium"
            cle={s.cle}
            libelle={s.libelle}
            aide={s.aide}
            fiche={resume.globales[`premium::${s.cle}`]}
          />
        ))}
      </div>
    </div>
  );
}
