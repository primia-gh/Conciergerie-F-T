import { describe, expect, it } from "vitest";
import { creerCollecteur } from "./collecteur";

const brouillonValide = {
  texte: "Bonjour, le wifi est indiqué dans le livret d'accueil.\n\nConciergerie F&T",
  langue: "fr",
  sections_utilisees: ["equipements"],
};

describe("creerCollecteur", () => {
  it("garde le brouillon valide proposé par le modèle", async () => {
    const c = creerCollecteur();

    const retour = await c.executeurOutil({ nom: "proposer_reponse", input: brouillonValide });

    expect(retour).toContain("enregistré");
    expect(c.resultat().brouillon).toEqual({
      texte: brouillonValide.texte,
      langue: "fr",
      sectionsUtilisees: ["equipements"],
    });
  });

  it("refuse une langue hors des six prévues", async () => {
    const c = creerCollecteur();

    const retour = await c.executeurOutil({
      nom: "proposer_reponse",
      input: { ...brouillonValide, langue: "ar" },
    });

    expect(retour).toContain("refusé");
    expect(c.resultat().brouillon).toBeNull();
  });

  it("refuse un brouillon vide ou démesuré", async () => {
    const c = creerCollecteur();

    await c.executeurOutil({ nom: "proposer_reponse", input: { ...brouillonValide, texte: "   " } });
    await c.executeurOutil({
      nom: "proposer_reponse",
      input: { ...brouillonValide, texte: "a".repeat(4001) },
    });

    expect(c.resultat().brouillon).toBeNull();
  });

  it("ne remplace pas un brouillon déjà enregistré", async () => {
    const c = creerCollecteur();
    await c.executeurOutil({ nom: "proposer_reponse", input: brouillonValide });

    const retour = await c.executeurOutil({
      nom: "proposer_reponse",
      input: { ...brouillonValide, texte: "Autre texte" },
    });

    expect(retour).toContain("déjà");
    expect(c.resultat().brouillon?.texte).toBe(brouillonValide.texte);
  });

  it("garde l'escalade, urgent à false par défaut", async () => {
    const c = creerCollecteur();

    await c.executeurOutil({
      nom: "escalader",
      input: { categorie: "argent", motif: "Demande de remboursement" },
    });

    expect(c.resultat().escalade).toEqual({
      categorie: "argent",
      motif: "Demande de remboursement",
      urgent: false,
    });
  });

  it("refuse une catégorie d'escalade inconnue", async () => {
    const c = creerCollecteur();

    const retour = await c.executeurOutil({
      nom: "escalader",
      input: { categorie: "pas_grave", motif: "x" },
    });

    expect(retour).toContain("refusée");
    expect(c.resultat().escalade).toBeNull();
  });

  it("la première escalade fait foi : un second appel ne l'adoucit pas", async () => {
    const c = creerCollecteur();
    await c.executeurOutil({
      nom: "escalader",
      input: { categorie: "urgence_securite", motif: "Fuite d'eau", urgent: true },
    });

    await c.executeurOutil({
      nom: "escalader",
      input: { categorie: "doute", motif: "Finalement pas sûr" },
    });

    expect(c.resultat().escalade).toEqual({
      categorie: "urgence_securite",
      motif: "Fuite d'eau",
      urgent: true,
    });
  });

  it("répond « Outil inconnu » pour tout autre outil, sans effet", async () => {
    const c = creerCollecteur();

    const retour = await c.executeurOutil({ nom: "envoyer_message", input: { texte: "x" } });

    expect(retour).toBe("Outil inconnu.");
    expect(c.resultat()).toEqual({ brouillon: null, escalade: null });
  });
});
