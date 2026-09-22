import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SECTIONS_LOGEMENT, completudeLogement, dernieresVersions } from "@/lib/agent/fiches-modele";
import { ActivationBoutons } from "../../../_components/activation-boutons";
import { CopierLienGuide } from "../../../_components/copier-lien-guide";

type LogementRow = {
  id: string;
  nom: string;
  adresse: string;
  capacite: number | null;
  statut: string;
  proprietaire: { nom: string } | { nom: string }[] | null;
};

type FicheRow = { section: string; contenu: string; version: number; created_at: string };

export default async function AdminLogementPage({ params }: PageProps<"/admin/fiches/ft/logements/[id]">) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [{ data: logement }, { data: fiches }] = await Promise.all([
    supabase
      .from("logement")
      .select("id, nom, adresse, capacite, statut, proprietaire:proprietaire_id(nom)")
      .eq("id", id)
      .maybeSingle<LogementRow>(),
    supabase
      .from("fiche_connaissance")
      .select("section, contenu, version, created_at")
      .eq("logement_id", id)
      .returns<FicheRow[]>(),
  ]);
  if (!logement) notFound();

  const dernieres = dernieresVersions(fiches ?? []);
  const parSection = new Map(dernieres.map((f) => [f.section, f]));
  const completude = completudeLogement(dernieres);
  const actif = logement.statut === "actif";
  const proprietaire = Array.isArray(logement.proprietaire) ? logement.proprietaire[0] : logement.proprietaire;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/fiches" className="text-sm text-fg-muted hover:text-fg">
        ← Retour aux fiches
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-medium text-fg">{logement.nom}</h1>
        <Badge variant={actif ? "success" : "neutral"}>{actif ? "Actif" : "Inactif"}</Badge>
      </div>
      <p className="mt-1 text-sm text-fg-muted">
        {logement.adresse}
        {logement.capacite ? ` · ${logement.capacite} personnes` : ""}
        {proprietaire ? ` · propriétaire : ${proprietaire.nom}` : ""}
      </p>

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-3 pt-5">
          {completude.complete ? (
            <p className="text-sm text-success">
              La fiche est complète : ce logement peut être utilisé par l&apos;assistant.
            </p>
          ) : (
            <p className="text-sm text-fg-muted">
              Pour activer ce logement, il manque : {completude.manquantes.map((s) => s.libelle).join(", ")}.
            </p>
          )}
          {(actif || completude.complete) && <ActivationBoutons logementId={logement.id} actif={actif} />}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="flex flex-col gap-2 pt-5">
          {actif ? (
            <>
              <p className="text-sm text-fg-muted">
                Une page simple avec les informations de ce logement (accès, équipements, règles,
                dépannage, alentours), sans les codes d&apos;accès — à envoyer au voyageur.
              </p>
              <div>
                <CopierLienGuide logementId={logement.id} />
              </div>
            </>
          ) : (
            <p className="text-sm text-fg-muted">
              Le lien du guide voyageur sera disponible une fois ce logement activé.
            </p>
          )}
        </CardContent>
      </Card>

      <h2 className="mt-10 font-display text-lg font-medium text-fg">Sections de la fiche</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {SECTIONS_LOGEMENT.map((s) => {
          const fiche = parSection.get(s.cle);
          const remplie = Boolean(fiche && fiche.contenu.trim());
          return (
            <li key={s.cle}>
              <Link href={`/admin/fiches/ft/logements/${logement.id}/${s.cle}`}>
                <Card className="transition-colors hover:bg-bg-subtle">
                  <CardContent className="flex items-center justify-between gap-4 pt-5">
                    <div>
                      <p className="font-medium text-fg">
                        {s.libelle} {s.obligatoire && <Badge variant="neutral">Obligatoire</Badge>}
                      </p>
                      <p className="mt-1 text-sm text-fg-muted">
                        {remplie
                          ? `Version ${fiche!.version} · ${new Date(fiche!.created_at).toLocaleDateString("fr-FR")}`
                          : "Pas encore renseignée"}
                      </p>
                    </div>
                    <Badge variant={remplie ? "success" : s.obligatoire ? "warning" : "neutral"}>
                      {remplie ? "Renseignée" : "Vide"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
