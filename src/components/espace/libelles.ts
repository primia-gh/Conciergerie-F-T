/**
 * Libellés affichés dans les espaces connectés pour les valeurs internes de la
 * base (énumérations de schema.ts). Une valeur absente s'affiche telle quelle :
 * voir libelles.test.ts, qui vérifie que chaque valeur a son libellé.
 */
type Variante = "neutral" | "accent" | "success" | "warning" | "danger";
type Libelle = { libelle: string; variante: Variante };

export const STATUT_PROPOSITION: Record<string, Libelle> = {
  draft: { libelle: "Brouillon", variante: "neutral" },
  sent: { libelle: "Envoyée au client", variante: "accent" },
  accepted: { libelle: "Acceptée", variante: "success" },
  rejected: { libelle: "Refusée", variante: "danger" },
};

export const STATUT_PARTENAIRE: Record<string, Libelle> = {
  active: { libelle: "Actif", variante: "success" },
  pending: { libelle: "En attente", variante: "warning" },
  inactive: { libelle: "Inactif", variante: "neutral" },
};

export const STATUT_PROPRIETAIRE: Record<string, Libelle> = {
  prospect: { libelle: "Nouveau prospect", variante: "accent" },
  en_discussion: { libelle: "En discussion", variante: "warning" },
  client: { libelle: "Client", variante: "success" },
  perdu: { libelle: "Perdu", variante: "neutral" },
};

export const NIVEAU_AUTONOMIE: Record<string, Libelle & { aide: string }> = {
  propose: { libelle: "Propose", variante: "neutral", aide: "Rien ne part sans vous." },
  agit_apres_validation: {
    libelle: "Agit après validation",
    variante: "warning",
    aide: "L'action est prête, elle attend votre clic.",
  },
  agit_seul: { libelle: "Agit seul", variante: "danger", aide: "L'action part directement, et reste dans le journal." },
};

export const AUTEUR_MESSAGE_AGENT: Record<string, string> = {
  voyageur: "Voyageur",
  agent: "Assistant",
  gerant: "Vous",
  proprietaire: "Propriétaire",
};

export const STATUT_MESSAGE_AGENT: Record<string, string> = {
  propose: "proposé",
  valide: "validé",
  envoye: "envoyé",
  corrige: "corrigé",
};

export function libelle(table: Record<string, Libelle>, valeur: string | null | undefined): Libelle {
  return (valeur && table[valeur]) || { libelle: valeur ?? "—", variante: "neutral" };
}

/** Tâches de l'assistant (colonne `regle.tache`), avec les mots du cahier des charges. */
export const TACHES: Record<string, string> = {
  reponse_factuelle: "Réponse factuelle (wifi, accès, équipements)",
  envoi_infos_arrivee: "Envoi des infos d'arrivée",
  depart_tardif_dans_les_regles: "Départ tardif dans les règles",
  geste_commercial_remboursement: "Geste commercial, remboursement",
  estimation_revenus: "Estimation de revenus",
  reponse_avis_negatif: "Réponse à un avis négatif",
  creation_incident: "Création d'incident",
  relance_prospect_48h: "Relance d'un prospect à 48 h",
  reponse_offre_prospect: "Réponse d'un prospect sur l'offre",
};

export function libelleTache(tache: string): string {
  return TACHES[tache] ?? tache.replace(/_/g, " ");
}
