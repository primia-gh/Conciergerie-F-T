-- V2 (assistant du Gérant) : accès à la boîte de réception et verrou du journal.

-- demande : même convention que 0016 — refus par défaut, seule la session admin
-- (= "Gérant") y accède directement. L'agent passe par la service role côté serveur.
alter table public.demande enable row level security;
create policy "demande_admin_all" on public.demande for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

-- Journal `action` : "jamais modifiable après écriture" (cahier des charges).
-- Jusqu'ici c'était une convention (aucune policy d'écriture), que la service
-- role contourne. Ce déclencheur l'impose dans la base elle-même : aucun
-- update, delete ni truncate, quel que soit le rôle. Un effacement à la demande
-- d'une personne (RGPD) devra être une opération d'administration explicite
-- (désactiver ce déclencheur le temps de l'opération, puis le remettre).
create or replace function public.interdire_modification_journal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Le journal (table action) est en écriture seule : % refusé.', tg_op
    using errcode = 'integrity_constraint_violation';
end;
$$;

create trigger action_journal_lecture_seule_row
before update or delete on public.action
for each row execute function public.interdire_modification_journal();

create trigger action_journal_lecture_seule_truncate
before truncate on public.action
for each statement execute function public.interdire_modification_journal();
