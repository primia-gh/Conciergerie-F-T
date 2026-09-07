-- handle_new_user() n'est censée être invoquée QUE par le trigger `on_auth_user_created`
-- (déclenché par le système sur insertion dans auth.users) — jamais directement par un
-- appelant via /rest/v1/rpc/handle_new_user. Un appel RPC direct par un utilisateur anonyme
-- ou authentifié échouerait de toute façon (contrainte de clé étrangère sur un id arbitraire),
-- mais l'exposer inutilement en API publique est signalé par l'advisor sécurité Supabase.
-- Révoquer EXECUTE ne casse pas le trigger : le déclencheur système invoque la fonction
-- directement, sans passer par le contrôle d'ACL appliqué aux appels RPC/SQL d'un rôle.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
