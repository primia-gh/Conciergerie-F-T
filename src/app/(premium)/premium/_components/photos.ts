/**
 * Photos d'ambiance de Conciergerie Premium : photos libres de droits
 * (licence Unsplash — usage commercial gratuit, crédit non obligatoire, mais
 * conservé ici), téléchargées le 2026-09-25 avec l'accord du Gérant, réduites
 * à 1 600 px de large, servies depuis `public/premium/` (aucun domaine
 * extérieur à autoriser). Elles illustrent des univers, jamais un bien ou un
 * partenaire réel.
 */
export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
  credit: string;
};

export const PHOTOS = {
  tableDuSoir: {
    src: "/premium/table-du-soir.jpg",
    width: 1200,
    height: 1800,
    alt: "Table nappée de blanc dans une salle de restaurant boisée, sous une lumière chaude du soir",
    credit: "Sara Abilova — unsplash.com/photos/9jNYTFpa2gs",
  },
  villa: {
    src: "/premium/villa-baie.jpg",
    width: 1600,
    height: 900,
    alt: "Piscine à débordement d'une villa surplombant une baie bleue",
    credit: "big.tiny.belly — unsplash.com/photos/XtnNrQYC7ts",
  },
  chef: {
    src: "/premium/chef-dressage.jpg",
    width: 1600,
    height: 939,
    alt: "Mains d'un chef dressant des assiettes en cuisine",
    credit: "Fabrizio Magoni — unsplash.com/photos/boaDpmC-_Xo",
  },
  yacht: {
    src: "/premium/yacht.jpg",
    width: 1600,
    height: 1200,
    alt: "Yacht au mouillage sur une eau turquoise",
    credit: "Héctor Mavare — unsplash.com/photos/ICAZMF1NSno",
  },
  circuit: {
    src: "/premium/circuit.jpg",
    width: 1600,
    height: 1067,
    alt: "Voiture de sport lancée sur un circuit automobile",
    credit: "Carl Gelin — unsplash.com/photos/Vz6td8STEwo",
  },
  appartement: {
    src: "/premium/appartement-haussmannien.jpg",
    width: 1600,
    height: 1067,
    alt: "Salle à manger d'un appartement haussmannien : moulures, parquet en chevrons et lustre",
    credit: "Yann Maignan — unsplash.com/photos/x3BCSWCAtrY",
  },
  cave: {
    src: "/premium/cave-grand-cru.jpg",
    width: 1600,
    height: 1067,
    alt: "Allée d'une cave à vin bordée de casiers, sous une lumière dorée",
    credit: "Amin Zabardast — unsplash.com/photos/mpfXEaWfdoQ",
  },
} satisfies Record<string, Photo>;
