-- Synchronise profiles.email depuis auth.users : nécessaire pour l'envoi de
-- notifications (M11) sans dépendre de la service role key.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, first_name, last_name)
  values (
    new.id,
    'client',
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );

  insert into public.client_profiles (profile_id) values (new.id);

  return new;
end;
$$;

-- Backfill des comptes déjà créés avant l'ajout de cette colonne.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;
