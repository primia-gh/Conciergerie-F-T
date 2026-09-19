import { describe, expect, it } from "vitest";
import {
  LONGUEUR_MAX_FICHE,
  SECTIONS_GLOBALES,
  SECTIONS_LOGEMENT,
  completudeLogement,
  detecterCodesProbables,
  normaliserContenuFiche,
  sectionsPour,
  trouverSection,
} from "./fiches-modele";

describe("sections", () => {
  it("F&T a six sections de logement, dont quatre obligatoires (accès, équipements, règles, dépannage)", () => {
    expect(SECTIONS_LOGEMENT).toHaveLength(6);
    expect(SECTIONS_LOGEMENT.filter((s) => s.obligatoire).map((s) => s.cle)).toEqual([
      "acces",
      "equipements",
      "regles",
      "depannage",
    ]);
  });

  it("conserve la clé « offre_ft » déjà utilisée en base et par le chat de prospection", () => {
    expect(SECTIONS_GLOBALES.ft.map((s) => s.cle)).toContain("offre_ft");
  });

  it("Premium n'a pas de logement : aucune section de logement", () => {
    expect(sectionsPour("premium", "logement")).toEqual([]);
    expect(sectionsPour("ft", "logement")).toBe(SECTIONS_LOGEMENT);
  });

  it("aucune clé n'est partagée entre les activités (pas de collision de version)", () => {
    const cles = [
      ...SECTIONS_GLOBALES.ft.map((s) => s.cle),
      ...SECTIONS_GLOBALES.premium.map((s) => s.cle),
    ];
    expect(new Set(cles).size).toBe(cles.length);
  });

  it("trouverSection ne reconnaît une section que dans sa bonne portée et sa bonne activité", () => {
    expect(trouverSection("ft", "logement", "acces")?.libelle).toBe("Accès");
    expect(trouverSection("ft", "globale", "acces")).toBeUndefined();
    expect(trouverSection("premium", "globale", "offre_ft")).toBeUndefined();
    expect(trouverSection("premium", "logement", "acces")).toBeUndefined();
  });

  it("l'aide de la section d'accès interdit d'y noter un code", () => {
    expect(trouverSection("ft", "logement", "acces")!.aide).toContain("Pas de code");
  });

  it("fixe la longueur maximale d'une fiche à 8 000 caractères", () => {
    expect(LONGUEUR_MAX_FICHE).toBe(8000);
  });
});

describe("completudeLogement", () => {
  const rempli = (section: string) => ({ section, contenu: "Une information." });

  it("est complète quand les quatre sections obligatoires sont remplies", () => {
    const r = completudeLogement(["acces", "equipements", "regles", "depannage"].map(rempli));
    expect(r).toEqual({ complete: true, manquantes: [] });
  });

  it("liste les sections obligatoires manquantes", () => {
    const r = completudeLogement([rempli("acces"), rempli("regles")]);

    expect(r.complete).toBe(false);
    expect(r.manquantes.map((s) => s.cle)).toEqual(["equipements", "depannage"]);
  });

  it("une section vide ou faite d'espaces compte comme manquante", () => {
    const r = completudeLogement([
      rempli("acces"),
      rempli("equipements"),
      rempli("regles"),
      { section: "depannage", contenu: "  \n " },
    ]);

    expect(r.manquantes.map((s) => s.cle)).toEqual(["depannage"]);
  });

  it("les sections facultatives ne comptent pas", () => {
    const r = completudeLogement([rempli("alentours"), rempli("specificites")]);
    expect(r.manquantes).toHaveLength(4);
  });

  it("ignore une section inconnue", () => {
    const r = completudeLogement([rempli("nimporte_quoi")]);
    expect(r.complete).toBe(false);
  });
});

describe("normaliserContenuFiche", () => {
  it("unifie les sauts de ligne, retire les espaces de fin et réduit les lignes vides", () => {
    const r = normaliserContenuFiche("  Ligne 1  \r\n\r\n\r\n\r\nLigne 2\t\r\n");
    expect(r).toBe("Ligne 1\n\nLigne 2");
  });
});

describe("detecterCodesProbables", () => {
  it.each([
    "Digicode : 4521",
    "digicode de l'immeuble 4521A? code 1234",
    "Code d'accès de la porte : 8790",
    "Boîte à clés (code 3141) à droite de l'entrée",
    "Code de la boîte 2718",
    "Alarme : 1357",
    "Interphone 22 B 4890",
  ])("signale « %s »", (ligne) => {
    expect(detecterCodesProbables(ligne)).toHaveLength(1);
  });

  it.each([
    "Le digicode est 4521.",
    "Digicode : 4521, entrez vite.",
    "Le code de la boîte à clés est 1357 (à droite de la porte).",
    "Alarme : 1357 !",
  ])("signale un code suivi d'une ponctuation : « %s »", (ligne) => {
    expect(detecterCodesProbables(ligne)).toHaveLength(1);
  });

  it.each([
    "Alarme incendie à 3,5 m du couloir",
    "Interphone au 2ème étage, tarif 12,50 €",
    "Code postal 67000, parking à 1,250 km",
  ])("ne confond pas un nombre décimal ou un séparateur de milliers avec un code : « %s »", (ligne) => {
    expect(detecterCodesProbables(ligne)).toEqual([]);
  });

  it.each([
    "Mot de passe : Maison2026!",
    "mdp = abcd1234",
    "Le mot de passe du wifi est Soleil2026",
  ])("signale le mot de passe dans « %s »", (ligne) => {
    expect(detecterCodesProbables(ligne)).toHaveLength(1);
  });

  it.each([
    "Digicode : transmis par le Gérant",
    "Code transmis par le Gérant avant l'arrivée",
    "Boîte à clés située à droite de l'entrée",
    "Wifi : réseau Maison, mot de passe sur le frigo",
    "Étage 4, ascenseur, appartement 12",
    "Parking gratuit à 200 mètres",
    "Alarme incendie dans le couloir, sortie de secours au fond",
  ])("ne signale pas « %s »", (ligne) => {
    expect(detecterCodesProbables(ligne)).toEqual([]);
  });

  it("ne renvoie que les lignes concernées, tronquées si longues", () => {
    const contenu = `Étage 3\nDigicode : 4521 ${"x".repeat(100)}\nBalcon`;
    const r = detecterCodesProbables(contenu);

    expect(r).toHaveLength(1);
    expect(r[0]!.length).toBeLessThanOrEqual(80);
    expect(r[0]).toContain("Digicode");
  });

  it("gère les retours à la ligne Windows", () => {
    expect(detecterCodesProbables("Étage 3\r\nDigicode : 4521\r\nBalcon")).toHaveLength(1);
  });

  it("ne signale pas un texte vide", () => {
    expect(detecterCodesProbables("")).toEqual([]);
  });
});
