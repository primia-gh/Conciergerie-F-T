-- Autonomie de la relance à 48h (lot L1). Comportement borné (texte fixe,
-- un seul envoi, s'arrête dès réponse) : "agit_seul" par défaut, réglable
-- comme n'importe quelle autre tâche depuis le tableau de bord.

insert into public.regle (domaine, tache, condition, action_autorisee, niveau_autonomie) values
('communication', 'relance_prospect_48h', 'Un seul envoi, texte fixe, s''arrête dès que le prospect répond', 'Envoyer une relance de courtoisie à un prospect propriétaire sans réponse depuis 48h', 'agit_seul');
