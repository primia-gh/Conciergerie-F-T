import { describe, expect, it } from "vitest";
import { cheminInterneSur } from "./chemin-sur";

describe("cheminInterneSur", () => {
  it("accepte un chemin interne", () => {
    expect(cheminInterneSur("/admin/boite")).toBe("/admin/boite");
    expect(cheminInterneSur("/nouveau-mot-de-passe")).toBe("/nouveau-mot-de-passe");
    expect(cheminInterneSur("/client/requests/12?onglet=messages")).toBe("/client/requests/12?onglet=messages");
  });

  it("refuse toute sortie vers un autre site", () => {
    for (const piege of [
      "https://faux-site.example",
      "//faux-site.example",
      "/\\faux-site.example",
      "javascript:alert(1)",
      "admin",
      "/\nhttps://faux-site.example",
    ]) {
      expect(cheminInterneSur(piege)).toBeNull();
    }
  });

  it("renvoie null sans valeur", () => {
    expect(cheminInterneSur(null)).toBeNull();
    expect(cheminInterneSur(undefined)).toBeNull();
    expect(cheminInterneSur("")).toBeNull();
  });
});
