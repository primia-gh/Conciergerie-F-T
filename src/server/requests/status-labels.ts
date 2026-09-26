import type { RequestStatus } from "./state-machine";

/**
 * Libellés lisibles pour l'affichage client — les valeurs brutes de l'enum
 * (ex. "PROPOSAL_DRAFT") sont des identifiants internes, pas un vocabulaire
 * destiné à l'utilisateur final.
 */
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: "Nouvelle demande",
  ASSIGNED: "Prise en charge",
  IN_PROGRESS: "En cours de traitement",
  RESEARCHING: "Recherche en cours",
  PROPOSAL_DRAFT: "Proposition en préparation",
  PROPOSAL_SENT: "Proposition envoyée",
  WAITING_CLIENT: "En attente de votre réponse",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  BOOKING: "Réservation en cours",
  CONFIRMED: "Réservation confirmée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export const TERMINAL_STATUSES: RequestStatus[] = ["COMPLETED", "CANCELLED"];

/** Formulations propres à l'équipe (concierge, Gérant) quand celle du client ne convient pas. */
const LIBELLES_EQUIPE: Partial<Record<RequestStatus, string>> = {
  WAITING_CLIENT: "En attente du client",
};

export function requestStatusLabel(status: string, pourEquipe = false): string {
  return (pourEquipe && LIBELLES_EQUIPE[status as RequestStatus]) || REQUEST_STATUS_LABELS[status as RequestStatus] || status;
}

export type StatusBadgeVariant = "neutral" | "accent" | "success" | "danger";

export function requestStatusBadgeVariant(status: string): StatusBadgeVariant {
  switch (status as RequestStatus) {
    case "NEW":
      return "neutral";
    case "CONFIRMED":
    case "COMPLETED":
      return "success";
    case "REJECTED":
    case "CANCELLED":
      return "danger";
    default:
      return "accent";
  }
}

/**
 * Étapes montrées au client dans le suivi d'une demande : une version courte
 * de la machine à états, sans le vocabulaire interne (brouillon, etc.).
 */
export const ETAPES_DEMANDE = [
  "Demande reçue",
  "Prise en charge",
  "Recherche",
  "Proposition",
  "Réservation",
  "Terminée",
] as const;

/** Index de l'étape en cours dans `ETAPES_DEMANDE`, ou -1 si la demande est annulée. */
export function etapeDemande(status: string): number {
  switch (status as RequestStatus) {
    case "NEW":
      return 0;
    case "ASSIGNED":
      return 1;
    case "IN_PROGRESS":
    case "RESEARCHING":
    case "PROPOSAL_DRAFT":
    // Proposition refusée : le concierge reprend la recherche.
    case "REJECTED":
      return 2;
    case "PROPOSAL_SENT":
    case "WAITING_CLIENT":
      return 3;
    case "ACCEPTED":
    case "BOOKING":
    case "CONFIRMED":
      return 4;
    case "COMPLETED":
      return 5;
    default:
      return -1;
  }
}

/** Le client doit répondre : une proposition l'attend. */
export function attenteReponseClient(status: string): boolean {
  return status === "PROPOSAL_SENT" || status === "WAITING_CLIENT";
}

/**
 * Priorité d'une demande. Depuis le 2026-09-26 elle vient de la formule du
 * client (« réponse prioritaire » des formules payantes) : « high » et
 * « urgent » signifient « prioritaire » et « très prioritaire », pas une urgence.
 */
export const PRIORITES = ["low", "normal", "high", "urgent"] as const;
export type Priorite = (typeof PRIORITES)[number];

export const PRIORITE_LABELS: Record<string, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Prioritaire",
  urgent: "Très prioritaire",
};

/** Priorité donnée par la formule (`plans.features.priority`) ; « normal » si absente ou inconnue. */
export function prioriteDeFormule(valeur: unknown): Priorite {
  return PRIORITES.find((p) => p === valeur) ?? "normal";
}

export function demandePrioritaire(priorite: string): boolean {
  return priorite === "high" || priorite === "urgent";
}
