-- current_app_role() ne doit pas être appelable anonymement via l'API REST
-- (aucune policy "anon" n'en a besoin — les policies anon-facing sont "to authenticated"
-- explicitement, ou échouent de toute façon faute de auth.uid()).
-- Elle reste exécutable par "authenticated" car les policies RLS l'invoquent pour
-- CHAQUE utilisateur connecté sur les 18 tables métier ; la révoquer casserait l'appli.
-- Elle ne renvoie que le rôle du user courant (aucune donnée sensible exposée).
revoke execute on function public.current_app_role() from public;
revoke execute on function public.current_app_role() from anon;
grant execute on function public.current_app_role() to authenticated;
