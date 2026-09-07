-- Provisionne automatiquement `profiles` (+ `client_profiles`) à l'inscription.
-- SÉCURITÉ : le rôle est TOUJOURS 'client', jamais lu depuis les métadonnées
-- fournies par l'utilisateur (raw_user_meta_data) — sinon un signup pourrait
-- s'auto-attribuer 'admin'. Les comptes concierge/admin/partner sont créés
-- uniquement via l'API Admin (service role), jamais par ce trigger public.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, first_name, last_name)
  values (
    new.id,
    'client',
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );

  insert into public.client_profiles (profile_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
