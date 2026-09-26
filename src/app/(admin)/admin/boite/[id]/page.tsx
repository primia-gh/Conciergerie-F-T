import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CategorieEscalade } from "@/lib/agent/missions/assistant-gerant/outils";
import { sectionsPour } from "@/lib/agent/fiches-modele";
import { VueDemandeBoite } from "./vue-demande-boite";

export const metadata: Metadata = { title: "Message reçu" };

type DemandeRow = {
  id: string;
  activite: "ft" | "premium";
  statut: "nouveau" | "brouillon_pret" | "valide" | "corrige" | "escalade";
  expediteur: string | null;
  logement_id: string | null;
  logement: { nom: string } | { nom: string }[] | null;
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

export default async function AdminBoiteDemandePage({ params }: PageProps<"/admin/boite/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: demande } = await supabase
    .from("demande")
    .select(
      "id, activite, statut, expediteur, logement_id, logement:logement_id(nom), contenu_recu, langue, brouillon, reponse_finale, motif_escalade, categorie_escalade, escalade_urgente, fiches_utilisees, traite_le, created_at",
    )
    .eq("id", id)
    .maybeSingle<DemandeRow>();

  if (!demande) notFound();

  const traitee = demande.traite_le !== null;
  const fiches = Array.isArray(demande.fiches_utilisees) ? demande.fiches_utilisees : [];
  const logement = Array.isArray(demande.logement) ? demande.logement[0] : demande.logement;

  // Une réponse corrigée, ou une escalade reprise à la main, signale peut-être une
  // fiche incomplète. Les fiches proposées sont celles de CETTE demande : son
  // activité, et son logement s'il y en a un.
  const proposerAjout = traitee && (demande.statut === "corrige" || demande.statut === "escalade");
  const optionsAjout = [
    ...sectionsPour(demande.activite, "globale").map((s) => ({
      value: `globale:${s.cle}`,
      label: `Fiche générale ${ACTIVITE_LIBELLE[demande.activite]} — ${s.libelle}`,
    })),
    ...(demande.logement_id && logement
      ? sectionsPour(demande.activite, "logement").map((s) => ({
          value: `logement:${s.cle}`,
          label: `${logement.nom} — ${s.libelle}`,
        }))
      : []),
  ];

  return (
    <VueDemandeBoite
      d={{
        id: demande.id,
        activite: demande.activite,
        statut: demande.statut,
        expediteur: demande.expediteur,
        logement: logement?.nom ?? null,
        contenu_recu: demande.contenu_recu,
        langue: demande.langue,
        brouillon: demande.brouillon,
        reponse_finale: demande.reponse_finale,
        motif_escalade: demande.motif_escalade,
        categorie_escalade: demande.categorie_escalade,
        escalade_urgente: demande.escalade_urgente,
        fiches,
        traite_le: demande.traite_le,
        created_at: demande.created_at,
        optionsAjout: proposerAjout ? optionsAjout : [],
      }}
    />
  );
}
