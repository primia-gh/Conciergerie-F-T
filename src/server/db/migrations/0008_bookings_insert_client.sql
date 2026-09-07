-- Le client doit pouvoir créer sa propre réservation au moment où il accepte
-- une proposition (Phase M9) — la policy `bookings_write_concierge_admin`
-- (M1) ne couvrait que le concierge/admin. Portée volontairement étroite :
-- uniquement pour SA demande, et uniquement vers une option réellement
-- sélectionnée sur une proposition de cette même demande.
create policy "bookings_insert_client" on public.bookings for insert
with check (
  client_id = auth.uid()
  and exists (
    select 1 from public.requests r
    where r.id = bookings.request_id and r.client_id = auth.uid()
  )
  and exists (
    select 1 from public.proposal_options po
    join public.proposals p on p.id = po.proposal_id
    where po.id = bookings.proposal_option_id
      and p.request_id = bookings.request_id
      and po.is_selected = true
  )
);
