-- RGPD (droit à l'effacement) : quand `profiles.deleted_at` passe de NULL à une
-- valeur, on bannit définitivement le compte Supabase Auth correspondant.
-- Sans cela, l'utilisateur supprimé applicativement pourrait quand même se
-- reconnecter (auth.users n'est pas piloté par la RLS de `public.profiles`).
-- SECURITY DEFINER nécessaire : `authenticated` n'a pas de droit d'écriture sur
-- `auth.users` (et ne doit jamais en avoir directement).
--
-- Limite connue et documentée (SECURITY.md) : un access token déjà émis avant la
-- suppression reste cryptographiquement valide jusqu'à son expiration naturelle
-- (défaut Supabase : 1h) — la révocation immédiate de session nécessite l'Admin
-- API (`auth.admin.signOut`), qui exige une clé service_role non disponible dans
-- cet environnement. Le blocage de toute NOUVELLE connexion, lui, est immédiat.
create or replace function public.handle_profile_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    update auth.users set banned_until = 'infinity' where id = new.id;
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_profile_soft_delete() from public;
revoke execute on function public.handle_profile_soft_delete() from anon;
revoke execute on function public.handle_profile_soft_delete() from authenticated;

drop trigger if exists on_profile_soft_delete on public.profiles;
create trigger on_profile_soft_delete
  after update on public.profiles
  for each row execute function public.handle_profile_soft_delete();
