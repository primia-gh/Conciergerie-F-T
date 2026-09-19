import { describe, expect, it } from "vitest";
import { dernieresVersions } from "./fiches-modele";
import { enregistrerFicheSchema, nouveauLogementSchema } from "./fiches-saisie";

const LOGEMENT = "11111111-1111-4111-8111-111111111111";

describe("enregistrerFicheSchema", () => {
  it("accepte une section de logement F&T et normalise le contenu", () => {
    const r = enregistrerFicheSchema.parse({
      activite: "ft",
      logementId: LOGEMENT,
      section: "acces",
      contenu: "  Étage 3  \r\n\r\n\r\nAscenseur\r\n",
    });

    expect(r).toEqual({ activite: "ft", logementId: LOGEMENT, section: "acces", contenu: "Étage 3\n\nAscenseur" });
  });

  it("accepte une section globale sans logement (chaîne vide = pas de logement)", () => {
    const r = enregistrerFicheSchema.parse({
      activite: "premium",
      logementId: "",
      section: "faq_premium",
      contenu: "Q : x",
    });
    expect(r.logementId).toBeNull();
  });

  it("refuse une section de logement hors d'un logement, et l'inverse", () => {
    expect(enregistrerFicheSchema.safeParse({ activite: "ft", section: "acces", contenu: "x" }).success).toBe(false);
    expect(
      enregistrerFicheSchema.safeParse({ activite: "ft", logementId: LOGEMENT, section: "offre_ft", contenu: "x" })
        .success,
    ).toBe(false);
  });

  it("refuse une section d'une autre activité", () => {
    expect(enregistrerFicheSchema.safeParse({ activite: "premium", section: "offre_ft", contenu: "x" }).success).toBe(
      false,
    );
    expect(enregistrerFicheSchema.safeParse({ activite: "ft", section: "faq_premium", contenu: "x" }).success).toBe(
      false,
    );
  });

  it("refuse un logement pour Premium", () => {
    const r = enregistrerFicheSchema.safeParse({
      activite: "premium",
      logementId: LOGEMENT,
      section: "acces",
      contenu: "x",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]!.message).toBe("Un logement n'existe que pour F&T.");
  });

  it("refuse un identifiant de logement qui n'est pas un UUID", () => {
    expect(
      enregistrerFicheSchema.safeParse({ activite: "ft", logementId: "abc", section: "acces", contenu: "x" }).success,
    ).toBe(false);
  });

  it("refuse un contenu vide ou démesuré, accepte la limite exacte", () => {
    const base = { activite: "ft", section: "offre_ft" } as const;
    expect(enregistrerFicheSchema.safeParse({ ...base, contenu: " \n " }).success).toBe(false);
    expect(enregistrerFicheSchema.safeParse({ ...base, contenu: "a".repeat(8000) }).success).toBe(true);
    expect(enregistrerFicheSchema.safeParse({ ...base, contenu: "a".repeat(8001) }).success).toBe(false);
  });
});

describe("nouveauLogementSchema", () => {
  const base = { nom: "Studio d'exemple", adresse: "1 rue Fictive, 67000 Strasbourg" };

  it("accepte un propriétaire existant", () => {
    const r = nouveauLogementSchema.parse({ ...base, capacite: "4", proprietaireId: LOGEMENT });
    expect(r).toMatchObject({ capacite: 4, proprietaireId: LOGEMENT, nouveauProprietaire: null });
  });

  it("accepte un nouveau propriétaire, capacité facultative", () => {
    const r = nouveauLogementSchema.parse({
      ...base,
      capacite: "",
      proprietaireId: "",
      nouveauProprietaire: "Jean Exemple",
    });
    expect(r).toMatchObject({ capacite: null, proprietaireId: null, nouveauProprietaire: "Jean Exemple" });
  });

  it("exige un propriétaire, mais pas les deux à la fois", () => {
    expect(nouveauLogementSchema.safeParse(base).success).toBe(false);
    expect(
      nouveauLogementSchema.safeParse({ ...base, proprietaireId: LOGEMENT, nouveauProprietaire: "Jean" }).success,
    ).toBe(false);
  });

  it.each(["0", "51", "2.5", "abc"])("refuse la capacité « %s »", (capacite) => {
    expect(nouveauLogementSchema.safeParse({ ...base, capacite, proprietaireId: LOGEMENT }).success).toBe(false);
  });

  it("refuse un nom ou une adresse vide", () => {
    expect(nouveauLogementSchema.safeParse({ ...base, nom: " ", proprietaireId: LOGEMENT }).success).toBe(false);
    expect(nouveauLogementSchema.safeParse({ ...base, adresse: "", proprietaireId: LOGEMENT }).success).toBe(false);
  });
});

describe("dernieresVersions", () => {
  it("garde la plus haute version de chaque section, quel que soit l'ordre", () => {
    const r = dernieresVersions([
      { section: "acces", version: 1, contenu: "a1" },
      { section: "regles", version: 2, contenu: "r2" },
      { section: "acces", version: 3, contenu: "a3" },
      { section: "regles", version: 1, contenu: "r1" },
    ]);

    expect(r.map((l) => `${l.section}:${l.version}`).sort()).toEqual(["acces:3", "regles:2"]);
  });

  it("renvoie un tableau vide pour une entrée vide", () => {
    expect(dernieresVersions([])).toEqual([]);
  });
});
