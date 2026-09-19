import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LIBELLES_ESCALADE } from "@/lib/agent/demande";
import type { CategorieEscalade } from "@/lib/agent/missions/assistant-gerant/outils";
import { ClotureForm } from "./cloture-form";

type DemandeRow = {
  id: string;
  activite: "ft" | "premium";
  statut: "nouveau" | "brouillon_pret" | "valide" | "corrige" | "escalade";
  expediteur: string | null;
  contenu_recu: string;
  langue: string | null;
  brouillon: string | null;
  reponse_finale: string | null;
  motif_escalade: string | null;
  categorie_escalade: CategorieEscalade | null;
  escalade_urgente: boolean;
  fiches_utilisees: { id: string; section: string; version: number }[];
  traite_le: string | null;
  created_at: string;
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

export default async function AdminBoiteDemandePage({ params }: PageProps<"/admin/boite/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: demande } = await supabase
    .from("demande")
    .select(
      "id, activite, statut, expediteur, contenu_recu, langue, brouillon, reponse_finale, motif_escalade, categorie_escalade, escalade_urgente, fiches_utilisees, traite_le, created_at",
    )
    .eq("id", id)
    .maybeSingle<DemandeRow>();

  if (!demande) notFound();

  const estEscalade = demande.statut === "escalade";
  const traitee = demande.traite_le !== null;
  const fiches = Array.isArray(demande.fiches_utilisees) ? demande.fiches_utilisees : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/boite" className="text-sm text-fg-muted hover:text-fg">
        ← Retour à la boîte de réception
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="neutral">{ACTIVITE_LIBELLE[demande.activite]}</Badge>
        <span className="text-sm text-fg-muted">
          {demande.expediteur ?? "Expéditeur non précisé"} ·{" "}
          {new Date(demande.created_at).toLocaleString("fr-FR")}
        </span>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Message reçu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-fg">{demande.contenu_recu}</p>
        </CardContent>
      </Card>

      {estEscalade && (
        <div
          role="alert"
          className={`mt-6 rounded-md border p-4 text-sm ${
            demande.escalade_urgente
              ? "border-danger bg-danger/10 text-danger"
              : "border-warning bg-warning/10 text-warning"
          }`}
        >
          <p className="font-medium">
            {demande.escalade_urgente ? "Urgent — " : ""}À traiter par vous
            {demande.categorie_escalade
              ? ` : ${LIBELLES_ESCALADE[demande.categorie_escalade] ?? demande.categorie_escalade}`
              : ""}
          </p>
          {demande.motif_escalade && <p className="mt-1">{demande.motif_escalade}</p>}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {traitee ? "Réponse enregistrée" : estEscalade && demande.brouillon ? "Brouillon d'attente" : "Brouillon"}
          </CardTitle>
          {demande.langue && !traitee && (
            <p className="text-sm text-fg-muted">
              Rédigé en {LANGUE_LIBELLE[demande.langue] ?? demande.langue}.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {traitee ? (
            <>
              <p className="text-sm text-fg-muted">
                {demande.statut === "valide"
                  ? "Validé tel quel"
                  : demande.statut === "corrige"
                    ? "Corrigé par vous"
                    : "Escalade traitée"}{" "}
                le {new Date(demande.traite_le!).toLocaleString("fr-FR")}.
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-fg">
                {demande.reponse_finale ?? "Aucune réponse enregistrée."}
              </p>
            </>
          ) : (
            <ClotureForm
              demandeId={demande.id}
              estEscalade={estEscalade}
              texteInitial={demande.brouillon ?? ""}
            />
          )}
        </CardContent>
      </Card>

      {fiches.length > 0 && (
        <p className="mt-6 text-sm text-fg-muted">
          Fiches fournies à l&apos;assistant :{" "}
          {fiches.map((f) => `${f.section} (v${f.version})`).join(", ")}.
        </p>
      )}
    </div>
  );
}
