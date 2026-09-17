-- Valeurs de départ conseillées par le cahier des charges (section "Niveaux
-- d'autonomie") pour la table `regle`. Chaque tâche démarre au niveau le plus
-- prudent compatible avec sa condition de passage : une tâche qui doit encore
-- accumuler des cas validés (ex. réponse factuelle : 50 cas à 95 %) démarre en
-- "agit_apres_validation", jamais directement en "agit_seul" — voir la règle
-- générale "en dessous du seuil, la tâche reste en validation" (cahier des
-- charges, section Rollout).

insert into public.regle (domaine, tache, condition, action_autorisee, niveau_autonomie) values
('communication', 'reponse_factuelle', '95 % de réponses validées sans correction sur les 50 derniers cas', 'Répondre au voyageur sur wifi, accès, équipements', 'agit_apres_validation'),
('communication', 'envoi_infos_arrivee', '30 envois sans correction', 'Envoyer les informations d''arrivée au voyageur', 'agit_apres_validation'),
('communication', 'depart_tardif_dans_les_regles', '20 cas sans correction', 'Confirmer un départ tardif conforme aux règles du logement', 'agit_apres_validation'),
('finance', 'geste_commercial_remboursement', 'Ne change pas', 'Proposer un geste commercial ou un remboursement', 'propose'),
('finance', 'estimation_revenus', 'Ne change pas', 'Proposer une estimation de revenus au propriétaire', 'propose'),
('reputation', 'reponse_avis_negatif', 'Ne change pas', 'Proposer une réponse à un avis négatif', 'propose'),
('exploitation', 'creation_incident', 'Déjà au niveau maximal, car réversible', 'Créer un incident (panne, dégât)', 'agit_seul');
