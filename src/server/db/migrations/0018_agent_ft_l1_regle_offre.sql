-- Autonomie du chat de prospection propriétaire (lot L1). Ce n'est pas une
-- des 7 tâches déjà réglées en L0 (celles-là concernent le voyageur en
-- séjour, phases 2/3) : c'est une tâche à part, spécifique à la prospection.
--
-- "Agit seul" est justifié ici pour rester une vraie messagerie instantanée
-- (le cahier des charges exige une réponse en moins de dix secondes), à
-- condition stricte que la réponse vienne uniquement de la fiche offre F&T
-- et que toute question hors fiche soit transmise sans jamais être inventée
-- — c'est ce garde-fou qui remplace la validation humaine par message.

insert into public.regle (domaine, tache, condition, action_autorisee, niveau_autonomie) values
('communication', 'reponse_offre_prospect', 'Réponse strictement tirée de la fiche offre F&T ; toute question hors fiche est transmise au gérant, jamais inventée', 'Répondre à un prospect propriétaire sur l''offre F&T (services, tarifs, secteur, engagement)', 'agit_seul');
