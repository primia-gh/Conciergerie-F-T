-- Row Level Security — deny by default, policies explicites par table.
-- Convention : le rôle admin agit normalement via la service role key côté serveur
-- (qui bypass RLS) ; les policies "admin" ci-dessous sont une défense en profondeur
-- pour le cas où une session admin authentifiée interroge directement la base.

-- Fonction utilitaire : lit le rôle applicatif de l'utilisateur courant sans
-- provoquer de récursion RLS sur `profiles` (SECURITY DEFINER bypass la RLS
-- de la table qu'elle interroge en interne).
create or replace function public.current_app_role()
returns public.role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- === profiles ===
alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles for select
using (
  id = auth.uid()
  or public.current_app_role() = 'admin'
  or exists (
    select 1 from public.requests r
    where (r.client_id = public.profiles.id and r.concierge_id = auth.uid())
       or (r.concierge_id = public.profiles.id and r.client_id = auth.uid())
  )
);

create policy "profiles_insert_own" on public.profiles for insert
with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles for update
using (id = auth.uid() or public.current_app_role() = 'admin')
with check (id = auth.uid() or public.current_app_role() = 'admin');

-- === client_profiles ===
alter table public.client_profiles enable row level security;

create policy "client_profiles_select" on public.client_profiles for select
using (
  profile_id = auth.uid()
  or public.current_app_role() = 'admin'
  or exists (
    select 1 from public.requests r
    where r.client_id = public.client_profiles.profile_id and r.concierge_id = auth.uid()
  )
);

create policy "client_profiles_insert_own" on public.client_profiles for insert
with check (profile_id = auth.uid());

create policy "client_profiles_update_own" on public.client_profiles for update
using (profile_id = auth.uid() or public.current_app_role() = 'admin')
with check (profile_id = auth.uid() or public.current_app_role() = 'admin');

-- === concierge_profiles ===
alter table public.concierge_profiles enable row level security;

create policy "concierge_profiles_select" on public.concierge_profiles for select
using (
  profile_id = auth.uid()
  or public.current_app_role() = 'admin'
  or exists (
    select 1 from public.requests r
    where r.concierge_id = public.concierge_profiles.profile_id and r.client_id = auth.uid()
  )
);

create policy "concierge_profiles_insert_own" on public.concierge_profiles for insert
with check (profile_id = auth.uid());

create policy "concierge_profiles_update_own" on public.concierge_profiles for update
using (profile_id = auth.uid() or public.current_app_role() = 'admin')
with check (profile_id = auth.uid() or public.current_app_role() = 'admin');

-- === categories (référentiel public en lecture) ===
alter table public.categories enable row level security;

create policy "categories_select_authenticated" on public.categories for select
to authenticated using (true);

create policy "categories_write_admin" on public.categories for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

-- === plans (référentiel public en lecture) ===
alter table public.plans enable row level security;

create policy "plans_select_authenticated" on public.plans for select
to authenticated using (true);

create policy "plans_write_admin" on public.plans for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

-- === subscriptions (écriture réservée au service role, ex. webhook Stripe) ===
alter table public.subscriptions enable row level security;

create policy "subscriptions_select" on public.subscriptions for select
using (client_id = auth.uid() or public.current_app_role() = 'admin');

create policy "subscriptions_admin_write" on public.subscriptions for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

-- === partners ===
alter table public.partners enable row level security;

create policy "partners_select_staff_or_self" on public.partners for select
using (
  public.current_app_role() in ('admin', 'concierge')
  or profile_id = auth.uid()
);

create policy "partners_write_admin" on public.partners for all
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

create policy "partners_update_own" on public.partners for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

-- === requests (cœur métier) ===
alter table public.requests enable row level security;

create policy "requests_select" on public.requests for select
using (
  client_id = auth.uid()
  or concierge_id = auth.uid()
  or (public.current_app_role() = 'concierge' and status = 'NEW' and concierge_id is null)
  or public.current_app_role() = 'admin'
);

create policy "requests_insert_own" on public.requests for insert
with check (client_id = auth.uid());

create policy "requests_update" on public.requests for update
using (
  concierge_id = auth.uid()
  or client_id = auth.uid()
  or public.current_app_role() = 'admin'
  or (public.current_app_role() = 'concierge' and status = 'NEW' and concierge_id is null)
)
with check (
  concierge_id = auth.uid()
  or client_id = auth.uid()
  or public.current_app_role() = 'admin'
);

-- === request_status_history (journal, append-only) ===
alter table public.request_status_history enable row level security;

create policy "request_status_history_select" on public.request_status_history for select
using (
  public.current_app_role() = 'admin'
  or exists (
    select 1 from public.requests r
    where r.id = request_status_history.request_id
      and (r.client_id = auth.uid() or r.concierge_id = auth.uid())
  )
);

create policy "request_status_history_insert" on public.request_status_history for insert
with check (
  changed_by = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = request_status_history.request_id
      and (r.client_id = auth.uid() or r.concierge_id = auth.uid())
  )
);

-- === request_attachments ===
alter table public.request_attachments enable row level security;

create policy "request_attachments_select" on public.request_attachments for select
using (
  public.current_app_role() = 'admin'
  or exists (
    select 1 from public.requests r
    where r.id = request_attachments.request_id
      and (r.client_id = auth.uid() or r.concierge_id = auth.uid())
  )
);

create policy "request_attachments_insert" on public.request_attachments for insert
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = request_attachments.request_id
      and (r.client_id = auth.uid() or r.concierge_id = auth.uid())
  )
);

create policy "request_attachments_delete_own" on public.request_attachments for delete
using (uploaded_by = auth.uid() or public.current_app_role() = 'admin');

-- === messages (notes internes masquées au client) ===
alter table public.messages enable row level security;

create policy "messages_select" on public.messages for select
using (
  public.current_app_role() = 'admin'
  or exists (
    select 1 from public.requests r
    where r.id = messages.request_id
      and (
        (r.client_id = auth.uid() and messages.is_internal_note = false)
        or r.concierge_id = auth.uid()
      )
  )
);

create policy "messages_insert" on public.messages for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = messages.request_id
      and (r.client_id = auth.uid() or r.concierge_id = auth.uid())
      and (
        messages.is_internal_note = false
        or r.concierge_id = auth.uid()
        or public.current_app_role() = 'admin'
      )
  )
);

create policy "messages_update_participant" on public.messages for update
using (
  exists (
    select 1 from public.requests r
    where r.id = messages.request_id
      and (r.client_id = auth.uid() or r.concierge_id = auth.uid())
  )
)
with check (
  exists (
    select 1 from public.requests r
    where r.id = messages.request_id
      and (r.client_id = auth.uid() or r.concierge_id = auth.uid())
  )
);

-- === proposals ===
alter table public.proposals enable row level security;

create policy "proposals_select" on public.proposals for select
using (
  concierge_id = auth.uid()
  or public.current_app_role() = 'admin'
  or (
    status in ('sent', 'accepted', 'rejected')
    and exists (
      select 1 from public.requests r
      where r.id = proposals.request_id and r.client_id = auth.uid()
    )
  )
);

create policy "proposals_insert_concierge" on public.proposals for insert
with check (
  concierge_id = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = proposals.request_id and r.concierge_id = auth.uid()
  )
);

create policy "proposals_update_concierge" on public.proposals for update
using (concierge_id = auth.uid() or public.current_app_role() = 'admin')
with check (concierge_id = auth.uid() or public.current_app_role() = 'admin');

-- Le client peut faire passer une proposition envoyée à accepted/rejected, rien d'autre.
create policy "proposals_client_respond" on public.proposals for update
using (
  status = 'sent'
  and exists (
    select 1 from public.requests r
    where r.id = proposals.request_id and r.client_id = auth.uid()
  )
)
with check (
  status in ('accepted', 'rejected')
  and exists (
    select 1 from public.requests r
    where r.id = proposals.request_id and r.client_id = auth.uid()
  )
);

-- === proposal_options ===
alter table public.proposal_options enable row level security;

create policy "proposal_options_select" on public.proposal_options for select
using (
  public.current_app_role() = 'admin'
  or exists (
    select 1 from public.proposals p
    join public.requests r on r.id = p.request_id
    where p.id = proposal_options.proposal_id
      and (p.concierge_id = auth.uid() or r.client_id = auth.uid())
  )
  or exists (
    select 1 from public.partners pa
    where pa.id = proposal_options.partner_id and pa.profile_id = auth.uid()
  )
);

create policy "proposal_options_write_concierge" on public.proposal_options for all
using (
  public.current_app_role() = 'admin'
  or exists (
    select 1 from public.proposals p
    where p.id = proposal_options.proposal_id and p.concierge_id = auth.uid()
  )
)
with check (
  public.current_app_role() = 'admin'
  or exists (
    select 1 from public.proposals p
    where p.id = proposal_options.proposal_id and p.concierge_id = auth.uid()
  )
);

-- Le client ne peut modifier que son choix/feedback (restriction de colonnes gérée
-- côté application ; la RLS garantit ici seulement qu'il agit sur SA proposition).
create policy "proposal_options_client_feedback" on public.proposal_options for update
using (
  exists (
    select 1 from public.proposals p
    join public.requests r on r.id = p.request_id
    where p.id = proposal_options.proposal_id and r.client_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.proposals p
    join public.requests r on r.id = p.request_id
    where p.id = proposal_options.proposal_id and r.client_id = auth.uid()
  )
);

-- === bookings ===
alter table public.bookings enable row level security;

create policy "bookings_select" on public.bookings for select
using (
  client_id = auth.uid()
  or public.current_app_role() = 'admin'
  or exists (
    select 1 from public.requests r
    where r.id = bookings.request_id and r.concierge_id = auth.uid()
  )
  or exists (
    select 1 from public.partners pa
    where pa.id = bookings.partner_id and pa.profile_id = auth.uid()
  )
);

create policy "bookings_write_concierge_admin" on public.bookings for all
using (
  public.current_app_role() = 'admin'
  or exists (
    select 1 from public.requests r
    where r.id = bookings.request_id and r.concierge_id = auth.uid()
  )
)
with check (
  public.current_app_role() = 'admin'
  or exists (
    select 1 from public.requests r
    where r.id = bookings.request_id and r.concierge_id = auth.uid()
  )
);

-- === payments (aucune écriture cliente : uniquement service role via webhook Stripe) ===
alter table public.payments enable row level security;

create policy "payments_select" on public.payments for select
using (client_id = auth.uid() or public.current_app_role() = 'admin');

-- === notifications (création côté serveur uniquement) ===
alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications for select
using (user_id = auth.uid() or public.current_app_role() = 'admin');

create policy "notifications_update_own" on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- === reviews ===
alter table public.reviews enable row level security;

create policy "reviews_select" on public.reviews for select
using (
  client_id = auth.uid()
  or public.current_app_role() = 'admin'
  or exists (
    select 1 from public.bookings b
    join public.requests r on r.id = b.request_id
    where b.id = reviews.booking_id and r.concierge_id = auth.uid()
  )
);

create policy "reviews_insert_own" on public.reviews for insert
with check (
  client_id = auth.uid()
  and exists (
    select 1 from public.bookings b
    where b.id = reviews.booking_id and b.client_id = auth.uid() and b.status = 'completed'
  )
);

-- === audit_logs ===
alter table public.audit_logs enable row level security;

create policy "audit_logs_select_admin" on public.audit_logs for select
using (public.current_app_role() = 'admin');

create policy "audit_logs_insert" on public.audit_logs for insert
with check (actor_id = auth.uid());
