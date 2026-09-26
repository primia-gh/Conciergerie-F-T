/**
 * Les forfaits de Conciergerie Premium, tels qu'on les présente (page
 * publique, comparaison, questionnaire, espace client, espace du Gérant).
 *
 * Décisions du Gérant (2026-09-26) : prix « sur demande » tant que les tarifs
 * sont provisoires, aucun délai de réponse chiffré. Les limites et le concierge
 * dédié doivent rester ceux de la table `plans` (seed.sql) : forfaits.test.ts
 * le vérifie. Les avantages viennent des descriptions de seed.sql et de la FAQ.
 */
export type CodeForfait = "free" | "premium" | "vip" | "private";

export type Forfait = {
  code: CodeForfait;
  nom: string;
  accroche: string;
  /** null = illimité. */
  demandesParMois: number | null;
  reponsePrioritaire: boolean;
  conciergeDedie: boolean;
  disponibiliteEtendue: boolean;
  avantagesPartenaires: boolean;
  /** Mis en avant sur la page publique. */
  recommande: boolean;
};

export const FORFAITS: Forfait[] = [
  {
    code: "free",
    nom: "Free",
    accroche: "Découvrir le service, pour des demandes ponctuelles.",
    demandesParMois: 2,
    reponsePrioritaire: false,
    conciergeDedie: false,
    disponibiliteEtendue: false,
    avantagesPartenaires: false,
    recommande: false,
  },
  {
    code: "premium",
    nom: "Premium",
    accroche: "Un accès prioritaire et davantage de demandes chaque mois.",
    demandesParMois: 10,
    reponsePrioritaire: true,
    conciergeDedie: false,
    disponibiliteEtendue: false,
    avantagesPartenaires: false,
    recommande: true,
  },
  {
    code: "vip",
    nom: "VIP",
    accroche: "Un concierge dédié qui vous connaît, sans limite de demandes.",
    demandesParMois: null,
    reponsePrioritaire: true,
    conciergeDedie: true,
    disponibiliteEtendue: false,
    avantagesPartenaires: false,
    recommande: false,
  },
  {
    code: "private",
    nom: "Private",
    accroche: "Un service sur-mesure, avec une disponibilité étendue.",
    demandesParMois: null,
    reponsePrioritaire: true,
    conciergeDedie: true,
    disponibiliteEtendue: true,
    avantagesPartenaires: true,
    recommande: false,
  },
];

export function forfait(code: string | null | undefined): Forfait | undefined {
  return FORFAITS.find((f) => f.code === code);
}

/** Prix affiché : gratuit pour Free, « sur demande » pour les autres (tarifs provisoires). */
export function prixAffiche(f: Forfait): string {
  return f.code === "free" ? "Gratuit" : "Sur demande";
}

export function demandesAffichees(f: Forfait): string {
  return f.demandesParMois === null ? "Illimitées" : `${f.demandesParMois} par mois`;
}

/** Les points forts d'un forfait, dans l'ordre de la comparaison. */
export function pointsForts(f: Forfait): string[] {
  return [
    f.demandesParMois === null ? "Demandes illimitées" : `${f.demandesParMois} demandes par mois`,
    ...(f.reponsePrioritaire ? ["Réponse prioritaire"] : []),
    ...(f.conciergeDedie ? ["Concierge dédié"] : []),
    ...(f.disponibiliteEtendue ? ["Disponibilité étendue"] : []),
    ...(f.avantagesPartenaires ? ["Avantages partenaires exclusifs"] : []),
    "Sans engagement",
  ];
}

/** Le forfait juste au-dessus (proposé quand la limite est atteinte), ou undefined. */
export function forfaitSuperieur(code: string | null | undefined): Forfait | undefined {
  const i = FORFAITS.findIndex((f) => f.code === code);
  return i >= 0 ? FORFAITS[i + 1] : undefined;
}

// --- Questionnaire « Quel forfait pour moi ? » (rien n'est enregistré) ---

export type Frequence = "occasionnelle" | "reguliere" | "frequente";
export type Accompagnement = "standard" | "dedie" | "sur_mesure";

/**
 * Conseil d'après les réponses : l'accompagnement souhaité l'emporte (concierge
 * dédié → VIP, sur-mesure → Private), sinon la fréquence choisit le forfait
 * dont la limite suffit (2 → Free, 10 → Premium, au-delà → VIP).
 */
export function recommanderForfait(reponses: { frequence: Frequence; accompagnement: Accompagnement }): CodeForfait {
  if (reponses.accompagnement === "sur_mesure") return "private";
  if (reponses.accompagnement === "dedie") return "vip";
  if (reponses.frequence === "frequente") return "vip";
  if (reponses.frequence === "reguliere") return "premium";
  return "free";
}
