import { describe, expect, it } from "vitest";
import {
  MARQUE_CARTE,
  MARQUE_IBAN,
  contientDonneeBancaire,
  ibanValide,
  luhnValide,
  masquerDonneesBancaires,
} from "./donnees-bancaires";

// Numéros de test publics des prestataires de paiement (aucune carte réelle).
const CARTE_VISA = "4242424242424242";
const CARTE_MASTERCARD = "5555555555554444";
const CARTE_AMEX = "378282246310005";
const IBAN_FR = "FR1420041010050500013M02606";
const IBAN_DE = "DE89370400440532013000";

describe("luhnValide", () => {
  it("accepte les numéros de test des prestataires", () => {
    for (const n of [CARTE_VISA, CARTE_MASTERCARD, CARTE_AMEX]) expect(luhnValide(n)).toBe(true);
  });

  it("refuse une clé fausse et un texte non numérique", () => {
    expect(luhnValide("4242424242424241")).toBe(false);
    expect(luhnValide("4242 4242")).toBe(false);
    expect(luhnValide("")).toBe(false);
  });
});

describe("ibanValide", () => {
  it("accepte des IBAN valides, avec ou sans espaces", () => {
    expect(ibanValide(IBAN_FR)).toBe(true);
    expect(ibanValide("FR14 2004 1010 0505 0001 3M02 606")).toBe(true);
    expect(ibanValide(IBAN_DE)).toBe(true);
  });

  it("refuse une clé fausse ou un format qui n'en est pas un", () => {
    expect(ibanValide("FR1520041010050500013M02606")).toBe(false);
    expect(ibanValide("Bonjour")).toBe(false);
  });
});

describe("masquerDonneesBancaires", () => {
  it.each([
    ["sans séparateur", CARTE_VISA],
    ["par groupes de 4", "4242 4242 4242 4242"],
    ["avec des tirets", "4242-4242-4242-4242"],
    ["American Express (15 chiffres)", "3782 822463 10005"],
  ])("masque une carte %s", (_libelle, carte) => {
    const r = masquerDonneesBancaires(`Voici ma carte ${carte}, merci de débiter.`);

    expect(r.texte).toBe(`Voici ma carte ${MARQUE_CARTE}, merci de débiter.`);
    expect(r.masques).toBe(1);
  });

  it("masque un IBAN, avec ou sans espaces", () => {
    const r = masquerDonneesBancaires(`Virement sur ${IBAN_FR} ou sur DE89 3704 0044 0532 0130 00.`);

    expect(r.texte).toBe(`Virement sur ${MARQUE_IBAN} ou sur ${MARQUE_IBAN}.`);
    expect(r.masques).toBe(2);
  });

  it("masque plusieurs numéros dans un même message", () => {
    const r = masquerDonneesBancaires(`${CARTE_VISA} puis ${CARTE_MASTERCARD}`);
    expect(r.masques).toBe(2);
  });

  it.each([
    ["un numéro de téléphone", "Appelez-moi au 06 12 34 56 78"],
    ["un numéro de téléphone international", "+33 6 12 34 56 78"],
    ["une date", "Arrivée le 19/09/2026 à 15h30"],
    ["un montant", "Le total est de 1 250,00 euros"],
    ["une suite de 16 chiffres qui n'est pas une carte (clé fausse)", "Réservation 4242424242424241"],
    ["un code postal et une adresse", "12 rue de la Paix, 67000 Strasbourg"],
    ["un texte sans chiffre", "Bonjour, quel est le wifi ?"],
  ])("ne touche pas %s", (_libelle, texte) => {
    const r = masquerDonneesBancaires(texte);

    expect(r.texte).toBe(texte);
    expect(r.masques).toBe(0);
  });

  it("ne coupe pas un long nombre pour en extraire une carte", () => {
    // 20 chiffres collés : trop long pour une carte, pas de masquage partiel.
    const long = "42424242424242424242";
    expect(masquerDonneesBancaires(long).masques).toBe(0);
  });
});

describe("contientDonneeBancaire", () => {
  it("détecte une carte ou un IBAN, ignore le reste", () => {
    expect(contientDonneeBancaire(`carte : ${CARTE_VISA}`)).toBe(true);
    expect(contientDonneeBancaire(`IBAN ${IBAN_FR}`)).toBe(true);
    expect(contientDonneeBancaire("Appelez le 06 12 34 56 78")).toBe(false);
  });
});
