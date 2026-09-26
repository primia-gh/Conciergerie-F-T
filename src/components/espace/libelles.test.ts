import { describe, expect, it } from "vitest";
import {
  autonomyLevelEnum,
  messageAgentAuthorEnum,
  messageAgentStatusEnum,
  ownerStatusEnum,
  partnerStatusEnum,
  proposalStatusEnum,
} from "@/server/db/schema";
import {
  AUTEUR_MESSAGE_AGENT,
  NIVEAU_AUTONOMIE,
  STATUT_MESSAGE_AGENT,
  STATUT_PARTENAIRE,
  STATUT_PROPOSITION,
  STATUT_PROPRIETAIRE,
  libelle,
} from "./libelles";

describe("libellés des espaces connectés", () => {
  it.each([
    ["propositions", proposalStatusEnum.enumValues, STATUT_PROPOSITION],
    ["partenaires", partnerStatusEnum.enumValues, STATUT_PARTENAIRE],
    ["propriétaires", ownerStatusEnum.enumValues, STATUT_PROPRIETAIRE],
    ["autonomie", autonomyLevelEnum.enumValues, NIVEAU_AUTONOMIE],
    ["auteurs", messageAgentAuthorEnum.enumValues, AUTEUR_MESSAGE_AGENT],
    ["statuts de message", messageAgentStatusEnum.enumValues, STATUT_MESSAGE_AGENT],
  ])("donne un libellé à chaque valeur de la base (%s)", (_, valeurs, table) => {
    for (const v of valeurs) expect(table[v], v).toBeDefined();
  });

  it("affiche une valeur inconnue telle quelle plutôt que de planter", () => {
    expect(libelle(STATUT_PARTENAIRE, "archive")).toEqual({ libelle: "archive", variante: "neutral" });
    expect(libelle(STATUT_PARTENAIRE, null).libelle).toBe("—");
  });
});
