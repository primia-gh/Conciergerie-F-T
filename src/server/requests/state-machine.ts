/**
 * Machine à états de `Request` — voir ARCHITECTURE.md §5.
 * Source de vérité unique des transitions autorisées : toute mutation de
 * `requests.status` doit passer par `assertValidTransition` plutôt que
 * d'écrire le statut directement, y compris depuis l'admin.
 */

export const REQUEST_STATUSES = [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESEARCHING",
  "PROPOSAL_DRAFT",
  "PROPOSAL_SENT",
  "WAITING_CLIENT",
  "ACCEPTED",
  "REJECTED",
  "BOOKING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  NEW: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESEARCHING", "CANCELLED"],
  RESEARCHING: ["PROPOSAL_DRAFT", "CANCELLED"],
  PROPOSAL_DRAFT: ["PROPOSAL_SENT", "CANCELLED"],
  PROPOSAL_SENT: ["WAITING_CLIENT", "CANCELLED"],
  WAITING_CLIENT: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["BOOKING", "CANCELLED"],
  REJECTED: ["RESEARCHING", "CANCELLED"],
  BOOKING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertValidTransition(from: RequestStatus, to: RequestStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Transition invalide : ${from} → ${to}`);
  }
}
