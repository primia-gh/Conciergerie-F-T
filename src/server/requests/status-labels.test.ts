import { describe, expect, it } from "vitest";
import { REQUEST_STATUSES } from "./state-machine";
import { ETAPES_DEMANDE, attenteReponseClient, etapeDemande, requestStatusLabel } from "./status-labels";

describe("etapeDemande", () => {
  it("place chaque statut sur une étape du suivi, sauf l'annulation", () => {
    for (const status of REQUEST_STATUSES) {
      const etape = etapeDemande(status);
      if (status === "CANCELLED") expect(etape).toBe(-1);
      else expect(etape).toBeGreaterThanOrEqual(0);
      expect(etape).toBeLessThan(ETAPES_DEMANDE.length);
    }
  });

  it("n'avance jamais à rebours sur le chemin nominal", () => {
    const chemin = [
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
    ];
    const etapes = chemin.map(etapeDemande);
    for (let i = 1; i < etapes.length; i++) expect(etapes[i]).toBeGreaterThanOrEqual(etapes[i - 1]);
    expect(etapes.at(-1)).toBe(ETAPES_DEMANDE.length - 1);
  });

  it("ramène une proposition refusée à la recherche", () => {
    expect(ETAPES_DEMANDE[etapeDemande("REJECTED")]).toBe("Recherche");
  });
});

describe("attenteReponseClient", () => {
  it("ne signale une action au client que lorsqu'une proposition l'attend", () => {
    const enAttente = REQUEST_STATUSES.filter(attenteReponseClient);
    expect(enAttente).toEqual(["PROPOSAL_SENT", "WAITING_CLIENT"]);
  });
});

describe("requestStatusLabel", () => {
  it("donne un libellé lisible à chaque statut", () => {
    for (const status of REQUEST_STATUSES) expect(requestStatusLabel(status)).not.toBe(status);
  });
});

describe("requestStatusLabel pour l'équipe", () => {
  it("parle du client à la troisième personne quand c'est l'équipe qui lit", () => {
    expect(requestStatusLabel("WAITING_CLIENT")).toBe("En attente de votre réponse");
    expect(requestStatusLabel("WAITING_CLIENT", true)).toBe("En attente du client");
    expect(requestStatusLabel("NEW", true)).toBe(requestStatusLabel("NEW"));
  });
});
