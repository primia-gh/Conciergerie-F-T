import { describe, expect, it } from "vitest";
import { CATEGORIES_ESCALADE } from "./missions/assistant-gerant/outils";
import {
  LIBELLES_ESCALADE,
  LONGUEUR_MAX_MESSAGE,
  decisionCloture,
  miseAJourApresErreur,
  miseAJourApresPreparation,
  nouvelleDemandeSchema,
} from "./demande";

describe("nouvelleDemandeSchema", () => {
  it("accepte F&T et Premium, normalise les sauts de ligne et l'expéditeur vide", () => {
    const r = nouvelleDemandeSchema.parse({
      activite: "premium",
      expediteur: "   ",
      contenu: "  Bonjour\r\nMerci  ",
    });

    expect(r).toEqual({ activite: "premium", logementId: null, expediteur: null, contenu: "Bonjour\nMerci" });
  });

  it("accepte un logement pour F&T, refuse un identifiant qui n'est pas un UUID", () => {
    const logementId = "11111111-1111-4111-8111-111111111111";

    expect(nouvelleDemandeSchema.parse({ activite: "ft", logementId, contenu: "Bonjour" }).logementId).toBe(logementId);
    expect(nouvelleDemandeSchema.safeParse({ activite: "ft", logementId: "abc", contenu: "Bonjour" }).success).toBe(
      false,
    );
  });

  it("traite une chaîne vide comme « pas de logement »", () => {
    expect(nouvelleDemandeSchema.parse({ activite: "ft", logementId: "", contenu: "Bonjour" }).logementId).toBeNull();
  });

  it("refuse un logement pour Premium", () => {
    const r = nouvelleDemandeSchema.safeParse({
      activite: "premium",
      logementId: "11111111-1111-4111-8111-111111111111",
      contenu: "Bonjour",
    });

    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]!.message).toBe("Un logement n'existe que pour F&T.");
  });

  it("refuse « commun » : une demande appartient toujours à une activité", () => {
    const r = nouvelleDemandeSchema.safeParse({ activite: "commun", contenu: "Bonjour" });
    expect(r.success).toBe(false);
  });

  it("refuse une activité absente avec un message compréhensible", () => {
    const r = nouvelleDemandeSchema.safeParse({ contenu: "Bonjour" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]!.message).toBe("Choisissez F&T ou Premium.");
  });

  it("refuse un message vide ou fait d'espaces", () => {
    expect(nouvelleDemandeSchema.safeParse({ activite: "ft", contenu: "  \n " }).success).toBe(false);
  });

  it("refuse un message trop long, accepte la limite exacte", () => {
    const limite = "a".repeat(LONGUEUR_MAX_MESSAGE);
    expect(nouvelleDemandeSchema.safeParse({ activite: "ft", contenu: limite }).success).toBe(true);
    expect(nouvelleDemandeSchema.safeParse({ activite: "ft", contenu: limite + "a" }).success).toBe(false);
  });

  it("refuse un expéditeur de plus de 100 caractères", () => {
    const r = nouvelleDemandeSchema.safeParse({
      activite: "ft",
      contenu: "Bonjour",
      expediteur: "x".repeat(101),
    });
    expect(r.success).toBe(false);
  });
});

describe("decisionCloture", () => {
  it("brouillon repris à l'identique = validé (même avec des \\r\\n du navigateur)", () => {
    const r = decisionCloture({
      statut: "brouillon_pret",
      brouillon: "Bonjour.\n\nConciergerie F&T",
      reponseSaisie: "Bonjour.\r\n\r\nConciergerie F&T\r\n",
    });

    expect(r).toMatchObject({ ok: true, statut: "valide", reponseFinale: "Bonjour.\n\nConciergerie F&T" });
    if (r.ok) expect(r.journal.type).toBe("validation_brouillon");
  });

  it("brouillon modifié = corrigé", () => {
    const r = decisionCloture({
      statut: "brouillon_pret",
      brouillon: "Bonjour.",
      reponseSaisie: "Bonjour, avec ma correction.",
    });

    expect(r).toMatchObject({ ok: true, statut: "corrige" });
  });

  it("refuse une réponse vide sur un brouillon prêt", () => {
    const r = decisionCloture({ statut: "brouillon_pret", brouillon: "Bonjour.", reponseSaisie: "  " });
    expect(r).toEqual({ ok: false, error: "La réponse ne peut pas être vide." });
  });

  it("une escalade reste « escalade » (le motif reste comptable), réponse facultative", () => {
    const sans = decisionCloture({ statut: "escalade", brouillon: null, reponseSaisie: "" });
    const avec = decisionCloture({ statut: "escalade", brouillon: null, reponseSaisie: "Ma réponse" });

    expect(sans).toMatchObject({ ok: true, statut: "escalade", reponseFinale: null });
    expect(avec).toMatchObject({ ok: true, statut: "escalade", reponseFinale: "Ma réponse" });
    if (avec.ok) expect(avec.journal.type).toBe("traitement_escalade");
  });

  it.each(["nouveau", "valide", "corrige"] as const)("refuse de clôturer une demande « %s »", (statut) => {
    const r = decisionCloture({ statut, brouillon: "x", reponseSaisie: "y" });
    expect(r.ok).toBe(false);
  });
});

describe("LIBELLES_ESCALADE", () => {
  it("a un libellé pour chaque catégorie d'escalade", () => {
    for (const categorie of CATEGORIES_ESCALADE) {
      expect(LIBELLES_ESCALADE[categorie]).toBeTruthy();
    }
  });
});

describe("miseAJourApresPreparation", () => {
  const fichesUtilisees = [{ id: "f1", section: "equipements", version: 2 }];

  it("brouillon sans escalade → brouillon prêt", () => {
    const r = miseAJourApresPreparation({
      mode: "modele",
      brouillon: { texte: "Bonjour", langue: "fr", sectionsUtilisees: ["equipements"] },
      escalade: null,
      fichesUtilisees,
    });

    expect(r.demande).toEqual({
      statut: "brouillon_pret",
      brouillon: "Bonjour",
      langue: "fr",
      motif_escalade: null,
      categorie_escalade: null,
      escalade_urgente: false,
      fiches_utilisees: fichesUtilisees,
    });
    expect(r.journal.resultat).toBe("brouillon_pret");
    expect(r.journal.decision).toContain("equipements");
  });

  it("escalade urgente avec brouillon d'attente → escalade, brouillon conservé", () => {
    const r = miseAJourApresPreparation({
      mode: "modele",
      brouillon: { texte: "Nous revenons vers vous.", langue: "fr", sectionsUtilisees: [] },
      escalade: { categorie: "urgence_securite", motif: "Fuite d'eau", urgent: true },
      fichesUtilisees,
    });

    expect(r.demande).toMatchObject({
      statut: "escalade",
      brouillon: "Nous revenons vers vous.",
      categorie_escalade: "urgence_securite",
      escalade_urgente: true,
    });
    expect(r.journal.resultat).toBe("escalade_urgente");
  });

  it("mode démonstration → escalade sans catégorie, motif = information, rien de simulé", () => {
    const r = miseAJourApresPreparation({ mode: "demo", information: "Mode démonstration…" });

    expect(r.demande).toMatchObject({
      statut: "escalade",
      brouillon: null,
      categorie_escalade: null,
      motif_escalade: "Mode démonstration…",
    });
    expect(r.journal.resultat).toBe("demo");
  });

  it("coupe une décision de journal démesurée", () => {
    const r = miseAJourApresPreparation({
      mode: "modele",
      brouillon: null,
      escalade: { categorie: "doute", motif: "x".repeat(1000), urgent: false },
      fichesUtilisees: [],
    });

    expect(r.journal.decision.length).toBeLessThanOrEqual(500);
  });
});

describe("miseAJourApresErreur", () => {
  it("escalade en « doute » plutôt que de laisser la demande sans suite", () => {
    const r = miseAJourApresErreur();

    expect(r.demande).toMatchObject({ statut: "escalade", brouillon: null, categorie_escalade: "doute" });
    expect(r.journal.resultat).toBe("erreur");
  });
});
