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

export function requestStatusLabel(status: string): string {
  return REQUEST_STATUS_LABELS[status as RequestStatus] ?? status;
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
