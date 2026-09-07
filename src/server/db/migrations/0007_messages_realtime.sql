-- Active Supabase Realtime (Postgres Changes) sur `messages` pour la
-- messagerie temps réel (Phase M7). RLS s'applique aussi aux souscriptions
-- Realtime : un client ne recevra jamais les notes internes des concierges.
alter publication supabase_realtime add table public.messages;
