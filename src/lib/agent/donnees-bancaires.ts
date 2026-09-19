/**
 * Détection et masquage des données bancaires (numéros de carte, IBAN).
 *
 * « Aucune donnée bancaire ne transite par l'agent » (cahier des charges, § Sécurité) :
 * un message collé par le Gérant peut en contenir (un client qui donne sa carte
 * « pour aller plus vite »). On les masque AVANT d'enregistrer le message et
 * avant tout envoi au modèle, si bien que ni la base ni l'API n'en reçoivent.
 *
 * On ne masque que les suites qui passent la vérification de clé (Luhn pour une
 * carte, modulo 97 pour un IBAN) : un numéro de téléphone ou de réservation
 * ordinaire n'est pas touché. Un numéro long qui passerait la clé par hasard
 * est masqué à tort, ce qui est préférable à laisser fuir une vraie carte.
 */

export const MARQUE_CARTE = "[numéro de carte masqué]";
export const MARQUE_IBAN = "[IBAN masqué]";

export function luhnValide(chiffres: string): boolean {
  if (!/^\d+$/.test(chiffres)) return false;
  let somme = 0;
  let doubler = false;
  for (let i = chiffres.length - 1; i >= 0; i--) {
    let n = Number(chiffres[i]);
    if (doubler) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    somme += n;
    doubler = !doubler;
  }
  return somme % 10 === 0;
}

export function ibanValide(iban: string): boolean {
  const compact = iban.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(compact)) return false;
  const rearrange = compact.slice(4) + compact.slice(0, 4);
  // Lettres -> nombres (A=10 … Z=35), puis modulo 97 calculé par tranches.
  const chiffres = [...rearrange].map((c) => (/\d/.test(c) ? c : String(c.charCodeAt(0) - 55))).join("");
  let reste = 0;
  for (const c of chiffres) reste = (reste * 10 + Number(c)) % 97;
  return reste === 1;
}

// 13 à 19 chiffres, séparés éventuellement par des espaces ou des tirets.
const CANDIDAT_CARTE = /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g;
// Code pays, clé, puis groupes de 4 caractères (espaces facultatifs).
const CANDIDAT_IBAN = /(?<![A-Za-z0-9])[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,4})?(?![A-Za-z0-9])/g;

export function masquerDonneesBancaires(texte: string): { texte: string; masques: number } {
  let masques = 0;

  const sansIban = texte.replace(CANDIDAT_IBAN, (candidat) => {
    if (!ibanValide(candidat)) return candidat;
    masques++;
    return MARQUE_IBAN;
  });

  const sansCarte = sansIban.replace(CANDIDAT_CARTE, (candidat) => {
    const chiffres = candidat.replace(/\D/g, "");
    if (chiffres.length < 13 || chiffres.length > 19 || !luhnValide(chiffres)) return candidat;
    masques++;
    return MARQUE_CARTE;
  });

  return { texte: sansCarte, masques };
}

export function contientDonneeBancaire(texte: string): boolean {
  return masquerDonneesBancaires(texte).masques > 0;
}
