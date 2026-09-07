-- Bucket privé pour les pièces jointes de demandes. Convention de chemin :
-- {request_id}/{uuid}-{nom_original}. Jamais public : accès uniquement via
-- URL signée générée côté serveur pour un utilisateur autorisé.
insert into storage.buckets (id, name, public)
values ('request-attachments', 'request-attachments', false)
on conflict (id) do nothing;

-- Le premier segment du chemin (foldername[1]) est le request_id : on
-- réutilise les mêmes règles d'accès que sur la table `requests`.
create policy "request_attachments_storage_select"
on storage.objects for select
using (
  bucket_id = 'request-attachments'
  and exists (
    select 1 from public.requests r
    where r.id::text = (storage.foldername(name))[1]
      and (
        r.client_id = auth.uid()
        or r.concierge_id = auth.uid()
        or public.current_app_role() = 'admin'
      )
  )
);

create policy "request_attachments_storage_insert"
on storage.objects for insert
with check (
  bucket_id = 'request-attachments'
  and exists (
    select 1 from public.requests r
    where r.id::text = (storage.foldername(name))[1]
      and (r.client_id = auth.uid() or r.concierge_id = auth.uid())
  )
);

create policy "request_attachments_storage_delete"
on storage.objects for delete
using (
  bucket_id = 'request-attachments'
  and exists (
    select 1 from public.requests r
    where r.id::text = (storage.foldername(name))[1]
      and (r.client_id = auth.uid() or r.concierge_id = auth.uid() or public.current_app_role() = 'admin')
  )
);
