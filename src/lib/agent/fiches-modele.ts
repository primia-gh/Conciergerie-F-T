import type { ActiviteMetier } from "./types";

export type SectionModele = {
  /** Clé stockée dans `fiche_connaissance.section`. */
  cle: string;
  libelle: string;
  /** Ce qu'on attend dans la section, affiché au-dessus de l'éditeur. */
  aide: string;
  /** Une fiche de logement n'est « complète » que si toutes ses sections obligatoires sont remplies. */
  obligatoire: boolean;
};

/** « Fiches courtes, une information par ligne, pas de paragraphes » (cahier des charges, § Base de connaissances). */
export const LONGUEUR_MAX_FICHE = 8000;

/**
 * Sections d'une fiche de LOGEMENT (F&T uniquement), telles que le cahier des
 * charges les décrit. Accès, équipements, règles et dépannage sont
 * obligatoires : « un logement n'est activé pour l'agent que si sa fiche est
 * complète sur ces sections ».
 *
 * Les codes (digicode, boîte à clés, alarme, mot de passe wifi) ne se notent
 * PAS dans une fiche : le cahier les réserve à la table chiffrée
 * `secret_logement`. On écrit « code transmis par le Gérant ».
 */
export const SECTIONS_LOGEMENT: SectionModele[] = [
  {
    cle: "acces",
    libelle: "Accès",
    aide: "Adresse, étage, boîte à clés, parking, transports, consignes d'arrivée et de départ. Pas de code : écrivez « code transmis par le Gérant ».",
    obligatoire: true,
  },
  {
    cle: "equipements",
    libelle: "Équipements",
    aide: "Cuisine, électroménager, chauffage, climatisation, nom du réseau wifi, linge, lit bébé, accessibilité. Pas de mot de passe : « transmis par le Gérant ».",
    obligatoire: true,
  },
  {
    cle: "regles",
    libelle: "Règles",
    aide: "Animaux, fêtes, fumeurs, nombre maximum de personnes, horaires de calme, tri des déchets.",
    obligatoire: true,
  },
  {
    cle: "depannage",
    libelle: "Dépannage",
    aide: "Disjoncteur, eau chaude, box internet, chauffage, lave-linge, avec la marche à suivre pas à pas.",
    obligatoire: true,
  },
  {
    cle: "alentours",
    libelle: "Alentours",
    aide: "Commerces, restaurants, activités, urgences médicales, pharmacie de garde, numéros d'urgence locaux.",
    obligatoire: false,
  },
  {
    cle: "specificites",
    libelle: "Spécificités",
    aide: "Bruit, escalier raide, voisinage sensible, travaux en cours.",
    obligatoire: false,
  },
];

/**
 * Sections GLOBALES (sans logement) de chaque activité. La clé `offre_ft`
 * existe déjà en base et sert au chat de prospection : elle ne change pas.
 * Les sections Premium sont une proposition calquée sur la fiche offre F&T,
 * à valider par le Gérant — le cahier des charges ne décrit pas Premium.
 */
export const SECTIONS_GLOBALES: Record<ActiviteMetier, SectionModele[]> = {
  ft: [
    {
      cle: "offre_ft",
      libelle: "Offre F&T",
      aide: "Services inclus, options, rémunération, secteur, types de biens, engagement, déroulé d'une mise en gestion, questions fréquentes, ce que F&T ne fait pas. Une information par ligne.",
      obligatoire: false,
    },
  ],
  premium: [
    {
      cle: "offre_premium",
      libelle: "Services et abonnement",
      aide: "Services proposés, formules d'abonnement et leurs tarifs, ce que comprend chaque formule, comment se passe une demande.",
      obligatoire: false,
    },
    {
      cle: "faq_premium",
      libelle: "Questions fréquentes",
      aide: "Les questions qui reviennent, avec la réponse en une ou deux lignes.",
      obligatoire: false,
    },
    {
      cle: "limites_premium",
      libelle: "Ce que Premium ne fait pas",
      aide: "Ce qui est hors périmètre, pour que l'assistant sache quand transmettre au lieu de répondre.",
      obligatoire: false,
    },
  ],
};

/** Sections utilisables selon la portée : un logement (F&T seulement) ou globale. */
export function sectionsPour(activite: ActiviteMetier, portee: "logement" | "globale"): SectionModele[] {
  if (portee === "logement") return activite === "ft" ? SECTIONS_LOGEMENT : [];
  return SECTIONS_GLOBALES[activite];
}

export function trouverSection(
  activite: ActiviteMetier,
  portee: "logement" | "globale",
  cle: string,
): SectionModele | undefined {
  return sectionsPour(activite, portee).find((s) => s.cle === cle);
}

export type CompletudeLogement = { complete: boolean; manquantes: SectionModele[] };

/**
 * Une fiche de logement est complète quand chaque section obligatoire a un
 * contenu non vide (dans sa dernière version — l'appelant fournit celles-ci).
 */
export function completudeLogement(fiches: { section: string; contenu: string }[]): CompletudeLogement {
  const remplies = new Set(fiches.filter((f) => f.contenu.trim().length > 0).map((f) => f.section));
  const manquantes = SECTIONS_LOGEMENT.filter((s) => s.obligatoire && !remplies.has(s.cle));
  return { complete: manquantes.length === 0, manquantes };
}

/** Sauts de ligne unifiés, espaces de fin retirés, lignes vides multiples réduites. */
export function normaliserContenuFiche(texte: string): string {
  return texte
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((ligne) => ligne.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const MOTS_CODE =
  "digicode|code d['’]?acc[eè]s|code (?:de la |de l['’])?porte|code (?:de la |de l['’])?bo[iî]te|bo[iî]te [àa] cl[eé]s?|cadenas|alarme|interphone";

// Un mot-clé d'accès suivi, sur la même ligne, d'un nombre de 3 à 8 chiffres.
// Un chiffre suivi d'une virgule ou d'un point en fin de phrase (« le digicode
// est 4521. ») reste un code ; seule une décimale (« 3,5 ») ou un séparateur de
// milliers (« 1,250 ») est écartée.
const CODE_NUMERIQUE = new RegExp(
  `(?:${MOTS_CODE})[^\\n]{0,40}?(?<!\\d)(?<!\\d[.,])\\d{3,8}(?!\\d)(?![.,]\\d)`,
  "i",
);

// « mot de passe : xxxx » / « mdp = xxxx » / « password est xxxx » : une valeur
// suit le mot-clé. « mot de passe sur le frigo » n'est pas signalé.
const MOT_DE_PASSE = /(?:mot de passe|mdp|password)[^\n]{0,30}?(?:[:=]|\best\b)\s*[A-Za-z0-9!@#$%^&*_-]{4,}/i;

/**
 * Lignes d'une fiche qui ressemblent à un code d'accès ou à un mot de passe.
 * Un AVERTISSEMENT, jamais un blocage : l'heuristique peut se tromper, et le
 * vrai garde-fou reste que l'assistant n'écrit jamais de code dans un brouillon.
 */
export function detecterCodesProbables(contenu: string): string[] {
  return contenu
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && ligneRessembleAUnCode(l))
    .map((l) => (l.length > 80 ? `${l.slice(0, 79)}…` : l));
}

function ligneRessembleAUnCode(ligne: string): boolean {
  return CODE_NUMERIQUE.test(ligne) || MOT_DE_PASSE.test(ligne);
}

export const LIGNE_MASQUEE = "[ligne masquée : ressemble à un code d'accès]";

/**
 * Remplace, dans une fiche, chaque ligne qui ressemble à un code ou à un mot
 * de passe. Appliqué avant de donner une fiche au modèle : « un secret n'est
 * jamais injecté tel quel dans un message du modèle » (cahier des charges). Ce
 * que le modèle n'a pas vu, il ne peut pas le recopier, même manipulé.
 *
 * L'heuristique peut masquer à tort une ligne légitime : l'assistant dira
 * alors qu'il n'a pas l'information et escaladera, ce qui est sans danger.
 */
export function masquerCodes(contenu: string): { contenu: string; lignesMasquees: number } {
  let lignesMasquees = 0;
  const lignes = contenu.split(/\r?\n/).map((ligne) => {
    if (!ligne.trim() || !ligneRessembleAUnCode(ligne.trim())) return ligne;
    lignesMasquees++;
    return LIGNE_MASQUEE;
  });
  return { contenu: lignes.join("\n"), lignesMasquees };
}

export type AjoutLigne = { ok: true; contenu: string } | { ok: false; error: string };

/**
 * Ajoute une information à la fin d'une fiche. Refuse ce qui est déjà présent
 * (comparaison sans tenir compte des majuscules ni des espaces autour) et ce
 * qui ferait dépasser la longueur maximale : une fiche reste courte.
 */
export function ajouterLigne(contenuActuel: string | null, ligne: string): AjoutLigne {
  const nouvelle = normaliserContenuFiche(ligne);
  if (!nouvelle) return { ok: false, error: "La ligne à ajouter est vide." };

  const actuel = normaliserContenuFiche(contenuActuel ?? "");
  const existantes = new Set(actuel.split("\n").map((l) => l.trim().toLowerCase()));
  const nouvellesLignes = nouvelle
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (nouvellesLignes.every((l) => existantes.has(l.toLowerCase()))) {
    return { ok: false, error: "Cette information figure déjà dans la fiche." };
  }

  const contenu = actuel ? `${actuel}\n${nouvelle}` : nouvelle;
  if (contenu.length > LONGUEUR_MAX_FICHE) {
    return {
      ok: false,
      error: `La fiche deviendrait trop longue (${LONGUEUR_MAX_FICHE} caractères maximum). Raccourcissez-la d'abord.`,
    };
  }
  return { ok: true, contenu };
}

/**
 * Ne garde que la dernière version de chaque section, à partir de lignes de
 * UNE même portée (un logement, ou les fiches globales d'une activité).
 * L'ordre d'arrivée n'a pas d'importance : la plus haute version gagne.
 */
export function dernieresVersions<T extends { section: string; version: number }>(lignes: T[]): T[] {
  const meilleures = new Map<string, T>();
  for (const ligne of lignes) {
    const actuelle = meilleures.get(ligne.section);
    if (!actuelle || ligne.version > actuelle.version) meilleures.set(ligne.section, ligne);
  }
  return [...meilleures.values()];
}
