-- Fiche offre F&T (lot L1) : seule source à partir de laquelle l'agent répond
-- aux prospects propriétaires (voir regle "reponse_offre_prospect", 0018).
-- Portée globale : logement_id NULL. Contenu au format "une information par
-- ligne" demandé par le cahier des charges, pas des paragraphes.
-- Brouillon initial rédigé avec le gérant (2026-09-17) — corrigible à tout
-- moment depuis le tableau de bord, sans toucher au code (version s'incrémente
-- à chaque modification, l'historique reste consultable).

insert into public.fiche_connaissance (logement_id, section, contenu, version, auteur) values
(null, 'offre_ft', 'Secteur couvert : Grand Est (extension à toute la France prévue, calendrier non fixé).
Services inclus : création et optimisation de l''annonce (Airbnb, Booking), fixation et ajustement des prix, communication avec les voyageurs 24h/24, coordination du ménage entre chaque séjour, gestion des arrivées et départs, suivi de la maintenance, relevé mensuel des revenus et dépenses.
Options : photographie professionnelle du bien, home staging avant mise en location, gestion de la taxe de séjour — sur devis, à confirmer au cas par cas.
Mode de rémunération : commission de 20 % sur les revenus locatifs.
Types de biens acceptés : appartements et maisons meublés, éligibles à la location courte durée dans leur commune, sans surface minimale imposée.
Durée d''engagement : sans engagement, résiliable à tout moment avec un préavis d''un mois.
Déroulé d''une mise en gestion : 1) visite du bien et estimation des revenus potentiels, 2) signature du mandat de gestion, 3) création de l''annonce et des fiches internes (accès, équipements, règles), 4) mise en ligne et première réservation, 5) suivi mensuel avec relevé transmis au propriétaire.
Question fréquente — dégât causé par un voyageur : couvert par la caution demandée au voyageur, déclaré et suivi via le journal d''incidents.
Question fréquente — récupérer son logement pour ses vacances : possible sur demande avec un délai de prévenance, à bloquer dans le calendrier.
Question fréquente — comment sont fixés les prix : ajustés selon la saison, la demande et les événements locaux.
Ce que F&T ne fait pas : ne fixe pas de prix sans plafond validé par le propriétaire, ne manipule jamais de données bancaires (paiement via un prestataire de paiement sécurisé), n''intervient pas sur le juridique ou le fiscal (orientation vers un professionnel).', 1, 'gerant');
