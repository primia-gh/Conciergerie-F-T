import { describe, expect, it } from "vitest";
import { REQUEST_STATUSES, assertValidTransition, canTransition } from "./state-machine";

describe("canTransition", () => {
  it("autorise le chemin nominal complet NEW → COMPLETED", () => {
    const path = [
      "NEW",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESEARCHING",
      "PROPOSAL_DRAFT",
      "PROPOSAL_SENT",
      "WAITING_CLIENT",
      "ACCEPTED",
      "BOOKING",
      "CONFIRMED",
      "COMPLETED",
    ] as const;

    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it("autorise le refus client à revenir en RESEARCHING", () => {
    expect(canTransition("WAITING_CLIENT", "REJECTED")).toBe(true);
    expect(canTransition("REJECTED", "RESEARCHING")).toBe(true);
  });

  it("autorise l'annulation depuis tout statut non terminal", () => {
    for (const status of REQUEST_STATUSES) {
      if (status === "COMPLETED" || status === "CANCELLED") continue;
      expect(canTransition(status, "CANCELLED")).toBe(true);
    }
  });

  it("ne permet aucune transition depuis un statut terminal", () => {
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransition("CANCELLED", "NEW")).toBe(false);
  });

  it("rejette les sauts d'étapes", () => {
    expect(canTransition("NEW", "PROPOSAL_SENT")).toBe(false);
    expect(canTransition("NEW", "COMPLETED")).toBe(false);
  });

  it("rejette les transitions arrière hors du cas refus→recherche", () => {
    expect(canTransition("CONFIRMED", "BOOKING")).toBe(false);
    expect(canTransition("ASSIGNED", "NEW")).toBe(false);
  });
});

describe("assertValidTransition", () => {
  it("ne lève pas pour une transition valide", () => {
    expect(() => assertValidTransition("NEW", "ASSIGNED")).not.toThrow();
  });

  it("lève une erreur explicite pour une transition invalide", () => {
    expect(() => assertValidTransition("NEW", "COMPLETED")).toThrow(
      "Transition invalide : NEW → COMPLETED",
    );
  });
});
