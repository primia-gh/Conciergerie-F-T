-- Row Level Security pour les 15 nouvelles tables de l'Agent IA Conciergerie F&T.
-- Même convention que 0002_rls_policies.sql : deny by default, seule la session
-- admin authentifiée (= "Gérant" pour ce projet) a un accès direct via RLS.
-- L'agent (lib/agent/) et les futurs portails à lien unique (propriétaire,
-- prestataire, voyageur) passeront par la service role key côté serveur, qui
-- bypass RLS — ces policies ne sont qu'une défense en profondeur pour le Gérant.

alter table public.proprietaire enable row level security;
create policy "proprietaire_admin_all" on public.proprietaire for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

alter table public.bien_prospect enable row level security;
create policy "bien_prospect_admin_all" on public.bien_prospect for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

alter table public.logement enable row level security;
create policy "logement_admin_all" on public.logement for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

-- secret_logement : codes d'accès chiffrés, jamais exposés hors du Gérant côté RLS.
alter table public.secret_logement enable row level security;
create policy "secret_logement_admin_all" on public.secret_logement for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

alter table public.reservation enable row level security;
create policy "reservation_admin_all" on public.reservation for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

alter table public.voyageur enable row level security;
create policy "voyageur_admin_all" on public.voyageur for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

alter table public.message_agent enable row level security;
create policy "message_agent_admin_all" on public.message_agent for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

-- action : journal immuable. Lecture Gérant uniquement, aucune policy d'écriture
-- (les insertions se font exclusivement via la service role key côté serveur).
alter table public.action enable row level security;
create policy "action_admin_select" on public.action for select
using (public.current_app_role() = 'admin');

alter table public.regle enable row level security;
create policy "regle_admin_all" on public.regle for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

alter table public.incident enable row level security;
create policy "incident_admin_all" on public.incident for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

alter table public.prestataire enable row level security;
create policy "prestataire_admin_all" on public.prestataire for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

alter table public.menage enable row level security;
create policy "menage_admin_all" on public.menage for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

alter table public.fiche_connaissance enable row level security;
create policy "fiche_connaissance_admin_all" on public.fiche_connaissance for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

alter table public.rendez_vous enable row level security;
create policy "rendez_vous_admin_all" on public.rendez_vous for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

-- lien_acces : jetons d'accès à usage unique (propriétaire/prestataire). Le Gérant
-- peut les consulter/générer ; la validation d'un token par son détenteur se fait
-- via une route serveur dédiée (service role), jamais via une session Supabase Auth.
alter table public.lien_acces enable row level security;
create policy "lien_acces_admin_all" on public.lien_acces for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');
