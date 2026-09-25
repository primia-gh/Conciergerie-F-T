import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { completudeLogement, dernieresVersions } from "@/lib/agent/fiches-modele";

type ProprietaireRow = {
  id: string;
  nom: string;
  date_signature: string | null;
  taux_commission: string | null;
};
type LogementRow = { id: string; nom: string; adresse: string; capacite: number | null; statut: string };
type FicheRow = { logement_id: string | null; section: string; contenu: string; version: number };

/**
 * Page publique, sans connexion : un lien privé à envoyer au propriétaire
 * (même principe que /guide/[id]). Volontairement limitée à ce qui existe
 * réellement aujourd'hui — pas de dates ni de réservations (aucun PMS, aucun
 * iCal connecté ; la table `reservation` est vide) — pour ne jamais montrer
 * un écran qui a l'air cassé ni inventer des données.
 *
 * Troisième usage de la clé de service sans session (voir DECISIONS.md) :
 * le contrôle applicatif est ici l'identifiant non devinable, et le fait de
 * ne jamais sélectionner `proprietaire.notes` (usage interne uniquement).
 */
async function lireProprietaire(id: string) {
  if (!z.string().uuid().safeParse(id).success) return null;

  const supabase = createServiceClient();
  const { data: proprietaire } = await supabase
    .from("proprietaire")
    .select("id, nom, date_signature, taux_commission")
    .eq("id", id)
    .maybeSingle<ProprietaireRow>();
  if (!proprietaire) return null;

  const { data: logements } = await supabase
    .from("logement")
    .select("id, nom, adresse, capacite, statut")
    .eq("proprietaire_id", id)
    .returns<LogementRow[]>();

  const logementIds = (logements ?? []).map((l) => l.id);
  const { data: fiches } =
    logementIds.length > 0
      ? await supabase
          .from("fiche_connaissance")
          .select("logement_id, section, contenu, version")
          .in("logement_id", logementIds)
          .returns<FicheRow[]>()
      : { data: [] as FicheRow[] };

  const fichesParLogement = new Map<string, FicheRow[]>();
  for (const f of fiches ?? []) {
    if (!f.logement_id) continue;
    fichesParLogement.set(f.logement_id, [...(fichesParLogement.get(f.logement_id) ?? []), f]);
  }

  return { proprietaire, logements: logements ?? [], fichesParLogement };
}

export async function generateMetadata({ params }: PageProps<"/proprietaire/[id]">): Promise<Metadata> {
  const { id } = await params;
  const trouve = await lireProprietaire(id);
  const titre = trouve ? `Espace propriétaire — ${trouve.proprietaire.nom}` : "Espace indisponible";
  return { title: { absolute: titre }, robots: { index: false, follow: false } };
}

export default async function PortailProprietairePage({ params }: PageProps<"/proprietaire/[id]">) {
  const { id } = await params;
  const trouve = await lireProprietaire(id);
  if (!trouve) notFound();
  const { proprietaire, logements, fichesParLogement } = trouve;

  const commission = proprietaire.taux_commission ? Number(proprietaire.taux_commission) : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-hover">
        Conciergerie F&amp;T
      </p>
      <h1 className="mt-3 font-display text-3xl font-medium text-fg">Espace propriétaire</h1>
      <p className="mt-1 text-fg-muted">{proprietaire.nom}</p>

      {(proprietaire.date_signature || commission !== null) && (
        <Card className="mt-8">
          <CardContent className="flex flex-col gap-1.5 pt-5 text-sm text-fg-muted">
            {proprietaire.date_signature && (
              <p>
                Signature le {new Date(proprietaire.date_signature).toLocaleDateString("fr-FR")}
              </p>
            )}
            {commission !== null && <p>Commission convenue : {commission} %</p>}
          </CardContent>
        </Card>
      )}

      <h2 className="mt-10 font-display text-lg font-medium text-fg">Vos logements</h2>
      <div className="mt-4 flex flex-col gap-4">
        {logements.length === 0 ? (
          <p className="text-sm text-fg-muted">Aucun logement enregistré pour le moment.</p>
        ) : (
          logements.map((l) => {
            const dernieres = dernieresVersions(fichesParLogement.get(l.id) ?? []);
            const completude = completudeLogement(dernieres);
            const actif = l.statut === "actif";
            return (
              <Card key={l.id}>
                <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                  <CardTitle>{l.nom}</CardTitle>
                  <Badge variant={actif ? "success" : "neutral"}>
                    {actif ? "Géré par l'assistant" : "En préparation"}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-fg-muted">
                  <p>
                    {l.adresse}
                    {l.capacite ? ` · ${l.capacite} personnes` : ""}
                  </p>
                  {!completude.complete && (
                    <p className="mt-2">
                      En préparation : {completude.manquantes.map((s) => s.libelle).join(", ")}.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <p className="mt-10 text-center text-xs text-fg-faint">
        Le planning des réservations n&apos;est pas encore disponible ici. Pour toute question,
        contactez votre concierge directement.
      </p>
    </div>
  );
}
