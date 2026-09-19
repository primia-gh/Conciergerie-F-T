import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LIBELLES_ESCALADE } from "@/lib/agent/demande";
import type { CategorieEscalade } from "@/lib/agent/missions/assistant-gerant/outils";
import { NouvelleDemandeForm } from "./nouvelle-demande-form";

// Préparer un brouillon appelle le modèle (plusieurs secondes) : la durée
// autorisée s'applique à l'action serveur du formulaire, placé sur cette page.
export const maxDuration = 60;

type DemandeRow = {
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

const ACTIVITE_LIBELLE = { ft: "F&T", premium: "Premium" } as const;

function badgeStatut(d: DemandeRow) {
  if (d.traite_le) {
    return d.statut === "escalade"
      ? { variant: "neutral" as const, libelle: "Traité (escalade)" }
      : { variant: "success" as const, libelle: d.statut === "corrige" ? "Corrigé" : "Validé" };
  }
  if (d.statut === "escalade") {
    return { variant: d.escalade_urgente ? ("danger" as const) : ("warning" as const), libelle: "À traiter par vous" };
  }
  return { variant: "accent" as const, libelle: "Brouillon prêt" };
}

export default async function AdminBoitePage() {
  const supabase = await createClient();

  const { data: logements } = await supabase
    .from("logement")
    .select("id, nom")
    .eq("statut", "actif")
    .order("nom")
    .returns<{ id: string; nom: string }[]>();

  const { data: demandes } = await supabase
    .from("demande")
    .select(
      "id, activite, statut, expediteur, contenu_recu, categorie_escalade, escalade_urgente, traite_le, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<DemandeRow[]>();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-2xl font-medium text-fg">Boîte de réception</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Collez un message reçu : l&apos;assistant prépare un brouillon à partir de vos fiches. Vous
        relisez, corrigez si besoin, puis vous l&apos;envoyez vous-même.
      </p>

      <Card className="mt-8">
        <CardContent className="pt-5">
          <NouvelleDemandeForm logements={logements ?? []} />
        </CardContent>
      </Card>

      <h2 className="mt-12 font-display text-lg font-medium text-fg">Demandes récentes</h2>
      {!demandes || demandes.length === 0 ? (
        <p className="mt-4 text-sm text-fg-muted">Aucune demande pour l&apos;instant.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {demandes.map((d) => {
            const statut = badgeStatut(d);
            return (
              <li key={d.id}>
                <Link href={`/admin/boite/${d.id}`}>
                  <Card className="transition-colors hover:bg-bg-subtle">
                    <CardContent className="flex items-start justify-between gap-4 pt-5">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm text-fg-muted">
                          <Badge variant="neutral">{ACTIVITE_LIBELLE[d.activite]}</Badge>
                          {d.expediteur ?? "Expéditeur non précisé"} ·{" "}
                          {new Date(d.created_at).toLocaleString("fr-FR")}
                        </p>
                        <p className="mt-1 truncate text-fg">{d.contenu_recu}</p>
                        {d.categorie_escalade && !d.traite_le && (
                          <p className="mt-1 text-sm text-fg-muted">
                            {LIBELLES_ESCALADE[d.categorie_escalade] ?? d.categorie_escalade}
                          </p>
                        )}
                      </div>
                      <Badge variant={statut.variant} className="shrink-0">
                        {statut.libelle}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
