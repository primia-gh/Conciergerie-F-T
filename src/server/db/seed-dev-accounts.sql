-- DEV UNIQUEMENT. Ne jamais exécuter sur un projet staging/production.
-- Crée 4 comptes de test (un par rôle) avec email pré-confirmé, pour permettre
-- de tester le parcours de connexion réel sans dépendre d'une boîte mail.
-- Mot de passe pour les 4 comptes : TestPassword123!
--
-- Contournement volontaire : signUp() normal exige la confirmation par email ;
-- ici on insère directement dans auth.users comme le ferait l'API Admin de
-- Supabase. Les colonnes *_token/*_change doivent être '' et non NULL, sinon
-- le driver Go de GoTrue échoue au login avec "Database error querying schema"
-- (cause réelle : "converting NULL to string is unsupported").

do $$
declare
  v_instance uuid := '00000000-0000-0000-0000-000000000000';
  v_password text := 'TestPassword123!';
  v_ids uuid[] := array[
    'aaaaaaaa-0000-4000-8000-000000000001'::uuid, -- client
    'aaaaaaaa-0000-4000-8000-000000000002'::uuid, -- concierge
    'aaaaaaaa-0000-4000-8000-000000000003'::uuid, -- admin
    'aaaaaaaa-0000-4000-8000-000000000004'::uuid  -- partner
  ];
  v_emails text[] := array[
    'dev-client@example.invalid',
    'dev-concierge@example.invalid',
    'dev-admin@example.invalid',
    'dev-partner@example.invalid'
  ];
  v_roles text[] := array['client', 'concierge', 'admin', 'partner'];
  i int;
begin
  for i in 1..4 loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token,
      email_change, email_change_token_new, email_change_token_current,
      recovery_token, phone_change, phone_change_token, reauthentication_token
    ) values (
      v_instance, v_ids[i], 'authenticated', 'authenticated', v_emails[i],
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}',
      jsonb_build_object('first_name', initcap(v_roles[i]), 'last_name', 'Dev'),
      now(), now(), '', '', '', '', '', '', '', ''
    )
    on conflict (id) do nothing;

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at
    ) values (
      gen_random_uuid(), v_ids[i], v_ids[i]::text, 'email',
      jsonb_build_object('sub', v_ids[i]::text, 'email', v_emails[i]),
      now(), now(), now()
    )
    on conflict (provider_id, provider) do nothing;

    -- Le trigger handle_new_user vient de créer profiles+client_profiles avec role='client'.
    if v_roles[i] != 'client' then
      update public.profiles set role = v_roles[i]::public.role where id = v_ids[i];
      delete from public.client_profiles where profile_id = v_ids[i];
    end if;
  end loop;
end $$;
