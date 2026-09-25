import { describe, expect, it } from "vitest";
import { ESPACES, lienActif, lienNotification } from "./navigation";

const [mesDemandes, nouvelleDemande] = ESPACES.client.liens;
const ID = "3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f";

describe("lienActif", () => {
  it("allume « Mes demandes » sur le tableau de bord et le suivi d'une demande", () => {
    expect(lienActif(mesDemandes, "/client/dashboard")).toBe(true);
    expect(lienActif(mesDemandes, `/client/requests/${ID}`)).toBe(true);
    expect(lienActif(nouvelleDemande, `/client/requests/${ID}`)).toBe(false);
  });

  it("n'allume que « Nouvelle demande » sur le formulaire", () => {
    expect(lienActif(mesDemandes, "/client/requests/new")).toBe(false);
    expect(lienActif(nouvelleDemande, "/client/requests/new")).toBe(true);
  });

  it("ne confond pas deux adresses qui commencent pareil", () => {
    const fiches = ESPACES.admin.liens.find((l) => l.href === "/admin/fiches")!;
    expect(lienActif(fiches, "/admin/fiches/ft/logements/x")).toBe(true);
    expect(lienActif(fiches, "/admin/fichesXYZ")).toBe(false);
    expect(lienActif(fiches, "/account")).toBe(false);
  });
});

describe("lienNotification", () => {
  it("ouvre la demande concernée dans l'espace du rôle", () => {
    expect(lienNotification("client", { requestId: ID })).toBe(`/client/requests/${ID}`);
    expect(lienNotification("concierge", { requestId: ID })).toBe(`/concierge/requests/${ID}`);
    expect(lienNotification("partner", { requestId: ID })).toBeNull();
  });

  it("n'ouvre rien si l'identifiant est absent ou douteux", () => {
    expect(lienNotification("client", {})).toBeNull();
    expect(lienNotification("client", null)).toBeNull();
    expect(lienNotification("client", { requestId: "../../admin" })).toBeNull();
    expect(lienNotification("client", { requestId: "//exemple.com" })).toBeNull();
  });
});
