import { describe, expect, it } from "vitest";
import { LONGUEUR_MAX_FICHE, ajouterLigne } from "./fiches-modele";
import { ajoutFicheSchema } from "./fiches-saisie";

describe("ajouterLigne", () => {
  it("ajoute l'information à la fin de la fiche", () => {
    const r = ajouterLigne("Animaux interdits\nPas de fêtes", "Silence après 22 h");

    expect(r).toEqual({ ok: true, contenu: "Animaux interdits\nPas de fêtes\nSilence après 22 h" });
  });

  it("sur une fiche vide ou absente, la ligne devient le contenu", () => {
    expect(ajouterLigne(null, "Parking gratuit")).toEqual({ ok: true, contenu: "Parking gratuit" });
    expect(ajouterLigne("  \n ", "Parking gratuit")).toEqual({ ok: true, contenu: "Parking gratuit" });
  });

  it("refuse une information déjà présente, sans tenir compte des majuscules ni des espaces", () => {
    const r = ajouterLigne("Animaux interdits\nPas de fêtes", "  PAS DE FÊTES ");

    expect(r).toEqual({ ok: false, error: "Cette information figure déjà dans la fiche." });
  });

  it("accepte un ajout de plusieurs lignes dont une seule est nouvelle", () => {
    const r = ajouterLigne("Pas de fêtes", "Pas de fêtes\nSilence après 22 h");

    expect(r).toMatchObject({ ok: true });
    if (r.ok) expect(r.contenu).toBe("Pas de fêtes\nPas de fêtes\nSilence après 22 h");
  });

  it("refuse une ligne vide", () => {
    expect(ajouterLigne("Pas de fêtes", "   ")).toEqual({ ok: false, error: "La ligne à ajouter est vide." });
  });

  it("refuse un ajout qui ferait dépasser la longueur maximale, accepte la limite exacte", () => {
    const base = "a".repeat(LONGUEUR_MAX_FICHE - 2);

    expect(ajouterLigne(base, "b").ok).toBe(true);
    const trop = ajouterLigne(base, "bb");
    expect(trop.ok).toBe(false);
    if (!trop.ok) expect(trop.error).toContain("trop longue");
  });
});

describe("ajoutFicheSchema", () => {
  it("décompose la cible en portée et section", () => {
    const r = ajoutFicheSchema.parse({ cible: "logement:acces", ligne: "Ascenseur en panne" });

    expect(r).toEqual({ cible: { portee: "logement", section: "acces" }, ligne: "Ascenseur en panne" });
  });

  it("accepte une cible globale", () => {
    expect(ajoutFicheSchema.parse({ cible: "globale:faq_premium", ligne: "x" }).cible).toEqual({
      portee: "globale",
      section: "faq_premium",
    });
  });

  it.each(["", "acces", "logement:", "autre:acces", "logement:ACCES", "logement:acces;drop", "globale:a b"])(
    "refuse la cible « %s »",
    (cible) => {
      expect(ajoutFicheSchema.safeParse({ cible, ligne: "x" }).success).toBe(false);
    },
  );

  it("refuse une ligne vide ou trop longue, accepte la limite exacte", () => {
    expect(ajoutFicheSchema.safeParse({ cible: "logement:acces", ligne: "  " }).success).toBe(false);
    expect(ajoutFicheSchema.safeParse({ cible: "logement:acces", ligne: "a".repeat(2000) }).success).toBe(true);
    expect(ajoutFicheSchema.safeParse({ cible: "logement:acces", ligne: "a".repeat(2001) }).success).toBe(false);
  });
});
