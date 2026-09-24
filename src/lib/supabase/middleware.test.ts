import { describe, expect, it } from "vitest";
import { isPublicPath } from "./middleware";

const ID = "e87608d7-c855-4731-9250-bedac12eec43";

describe("isPublicPath", () => {
  it("ouvre sans compte les liens envoyés au voyageur et au propriétaire", () => {
    expect(isPublicPath(`/guide/${ID}`)).toBe(true);
    expect(isPublicPath(`/proprietaire/${ID}`)).toBe(true);
  });

  it("garde publiques les pages déjà ouvertes à tous", () => {
    for (const chemin of ["/", "/login", "/signup", "/proprietaires", "/confidentialite"]) {
      expect(isPublicPath(chemin)).toBe(true);
    }
  });

  it("ne s'étend pas aux adresses voisines", () => {
    expect(isPublicPath("/guide")).toBe(false);
    expect(isPublicPath("/guides")).toBe(false);
    expect(isPublicPath("/proprietaire")).toBe(false);
    expect(isPublicPath("/proprietaire-admin")).toBe(false);
  });

  it("laisse protégés les espaces connectés", () => {
    for (const chemin of ["/admin/boite", "/admin/fiches", "/client/dashboard", "/concierge/dashboard", "/partner/dashboard"]) {
      expect(isPublicPath(chemin)).toBe(false);
    }
  });
});
