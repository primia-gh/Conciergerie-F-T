-- Le journal `action` est en écriture seule — jeu « Manipulations / traçabilité »
-- du cahier des charges : « le journal n'est jamais modifiable après écriture ».
-- À rejouer sur la base de dev, puis sur la production avant mise en service.
--
-- Le bloc se termine VOLONTAIREMENT par une erreur « RESULTAT : … » : c'est ce
-- qui annule tout ce qu'il a écrit (aucune ligne de test n'est conservée).
-- Résultat attendu : tous les contrôles à « refuse(ok) » ou « accepte(ok) ».

do $$
declare r text := '';
begin
  insert into public.action (activite, type, decision, auteur)
  values ('ft', 'test_immuabilite', 'ligne de test', 'test');
  r := r || 'insert avec activite=accepte(ok); ';

  begin
    update public.action set decision = 'modifiee' where type = 'test_immuabilite';
    r := r || 'update=PASSE(ECHEC); ';
  exception when integrity_constraint_violation then r := r || 'update=refuse(ok); ';
  end;

  begin
    delete from public.action where type = 'test_immuabilite';
    r := r || 'delete=PASSE(ECHEC); ';
  exception when integrity_constraint_violation then r := r || 'delete=refuse(ok); ';
  end;

  begin
    truncate public.action;
    r := r || 'truncate=PASSE(ECHEC); ';
  exception when integrity_constraint_violation then r := r || 'truncate=refuse(ok); ';
  end;

  -- Plus de défaut sur `activite` : un écrivain qui l'oublie échoue (pas de fausse étiquette « ft »).
  begin
    insert into public.action (type, decision, auteur) values ('test_sans_activite', 'x', 'test');
    r := r || 'insert sans activite=PASSE(ECHEC); ';
  exception when not_null_violation then r := r || 'insert sans activite=refuse(ok); ';
  end;

  raise exception 'RESULTAT : %', r;
end $$;
