import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTIONS_LOGEMENT, dernieresVersions, masquerCodes } from "@/lib/agent/fiches-modele";

type LogementRow = { id: string; nom: string; adresse: string; statut: string };
type FicheRow = { section: string; contenu: string; version: number };

/**
 * Page publique, sans connexion : un lien à envoyer au voyageur (comme le
 * livret d'accueil d'un hôtel). Accessible uniquement par son identifiant
 * (UUID, non devinable) — jamais listée ni indexée.
 *
 * Utilise la clé de service (RLS réservée à l'admin, voir DECISIONS.md) parce
 * qu'un voyageur n'a pas de session : le filtre `statut = "actif"` et le
 * masquage des codes tiennent lieu de contrôle d'accès applicatif.
 */
async function lireLogementActif(id: string) {
  if (!z.string().uuid().safeParse(id).success) return null;

  const supabase = createServiceClient();
  const [{ data: logement }, { data: fiches }] = await Promise.all([
    supabase
      .from("logement")
      .select("id, nom, adresse, statut")
      .eq("id", id)
      .eq("statut", "actif")
      .maybeSingle<LogementRow>(),
    supabase.from("fiche_connaissance").select("section, contenu, version").eq("logement_id", id).returns<FicheRow[]>(),
  ]);
  if (!logement) return null;

  const parSection = new Map(dernieresVersions(fiches ?? []).map((f) => [f.section, f.contenu]));
  return { logement, parSection };
}

export async function generateMetadata({ params }: PageProps<"/guide/[id]">): Promise<Metadata> {
  const { id } = await params;
  const trouve = await lireLogementActif(id);
  const titre = trouve ? `${trouve.logement.nom} — Conciergerie F&T` : "Guide indisponible";
  return { title: { absolute: titre } };
}

export default async function GuideLogementPage({ params }: PageProps<"/guide/[id]">) {
  const { id } = await params;
  const trouve = await lireLogementActif(id);
  if (!trouve) notFound();
  const { logement, parSection } = trouve;

  const sections = SECTIONS_LOGEMENT.map((s) => {
    const brut = parSection.get(s.cle);
    if (!brut || !brut.trim()) return null;
    const { contenu } = masquerCodes(brut);
    return { ...s, contenu };
  }).filter((s) => s !== null);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-hover">
        Conciergerie F&amp;T
      </p>
      <h1 className="mt-3 font-display text-3xl font-medium text-fg">{logement.nom}</h1>
      <p className="mt-1 text-fg-muted">{logement.adresse}</p>

      <div className="mt-10 flex flex-col gap-5">
        {sections.length === 0 ? (
          <p className="text-sm text-fg-muted">
            Les informations de ce logement ne sont pas encore prêtes. Contactez votre concierge.
          </p>
        ) : (
          sections.map((s) => (
            <Card key={s.cle}>
              <CardHeader>
                <CardTitle>{s.libelle}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-fg">{s.contenu}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <p className="mt-10 text-center text-xs text-fg-faint">
        Une question qui ne trouve pas de réponse ici ? Contactez votre concierge directement.
      </p>
    </div>
  );
}
