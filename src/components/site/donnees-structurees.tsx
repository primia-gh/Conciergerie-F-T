/**
 * Données structurées (JSON-LD, schema.org) lues par Google et les assistants
 * de recherche pour identifier l'entreprise derrière une page. Contenu :
 * uniquement des constantes écrites dans le code, jamais une saisie
 * d'internaute ; `<` est tout de même échappé, comme le recommande Next.js.
 * Aucune information non validée par le Gérant (adresse, téléphone, avis…).
 */
export function DonneesStructurees({ donnees }: { donnees: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees).replace(/</g, "\\u003c") }}
    />
  );
}

export const ADRESSE_SITE = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const DONNEES_SITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Conciergerie F&T · Conciergerie Premium",
  url: ADRESSE_SITE,
  inLanguage: "fr-FR",
};

export const DONNEES_PREMIUM = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Conciergerie Premium",
  url: `${ADRESSE_SITE}/premium`,
  description:
    "Conciergerie privée sur abonnement : décrivez votre besoin, un concierge dédié recherche et vous propose des solutions prêtes à valider.",
  serviceType: "Conciergerie privée",
  inLanguage: "fr-FR",
};

// Secteur et nature du service : fiche offre F&T validée par le Gérant (2026-09-17),
// publication autorisée le 2026-09-25.
export const DONNEES_FT = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Conciergerie F&T",
  url: `${ADRESSE_SITE}/location`,
  logo: `${ADRESSE_SITE}/brand/cle-ft.svg`,
  description:
    "Conciergerie de location courte durée : gestion complète de votre logement sur Airbnb et Booking, de l'annonce à l'accueil des voyageurs.",
  serviceType: "Gestion locative de courte durée",
  areaServed: { "@type": "AdministrativeArea", name: "Grand Est" },
  inLanguage: "fr-FR",
};
