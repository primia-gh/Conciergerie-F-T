-- Audit des règles d'accès (RLS) de la base — 10e cas du jeu « Droits d'accès »
-- du cahier des charges (§ Recette). À rejouer sur la base de dev, puis sur la
-- production avant toute mise en service, après chaque migration.
--
-- Lecture seule : ne modifie rien. Résultat attendu : que des lignes « OK ».
--
-- Règles vérifiées, pour chaque table de l'agent :
--   1. la sécurité par ligne (RLS) est activée ;
--   2. au moins une policy existe (sinon la table est inaccessible, pas protégée) ;
--   3. TOUTES les policies exigent le rôle admin (le Gérant) ;
--   4. le journal `action` n'a AUCUNE policy d'écriture (lecture seule, même pour l'admin).

with attendu(nom) as (
  values
    ('proprietaire'), ('bien_prospect'), ('logement'), ('secret_logement'),
    ('reservation'), ('voyageur'), ('message_agent'), ('action'), ('regle'),
    ('incident'), ('prestataire'), ('menage'), ('fiche_connaissance'),
    ('rendez_vous'), ('lien_acces'), ('demande')
),
etat as (
  select
    a.nom,
    c.relrowsecurity as rls,
    (select count(*) from pg_policies p
       where p.schemaname = 'public' and p.tablename = a.nom) as nb_policies,
    (select count(*) from pg_policies p
       where p.schemaname = 'public' and p.tablename = a.nom
         and (p.qual is null or p.qual !~ 'current_app_role\(\).*admin')) as policies_non_admin,
    (select count(*) from pg_policies p
       where p.schemaname = 'public' and p.tablename = a.nom
         and a.nom = 'action' and p.cmd <> 'SELECT') as ecritures_sur_le_journal
  from attendu a
  left join pg_class c
    on c.relname = a.nom and c.relnamespace = 'public'::regnamespace
)
select
  nom,
  rls,
  nb_policies,
  policies_non_admin,
  ecritures_sur_le_journal,
  case
    when rls is true
      and nb_policies > 0
      and policies_non_admin = 0
      and ecritures_sur_le_journal = 0
    then 'OK' else 'ECHEC'
  end as verdict
from etat
order by verdict desc, nom;

-- Complément : aucune table du schéma public ne doit être sans RLS
-- (résultat attendu : aucune ligne).
select c.relname as table_sans_rls
from pg_class c
where c.relnamespace = 'public'::regnamespace
  and c.relkind = 'r'
  and not c.relrowsecurity
order by 1;
