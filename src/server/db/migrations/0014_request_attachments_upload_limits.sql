-- Durcissement M15 : la policy RLS du bucket `request-attachments` (migration 0006)
-- autorisait l'upload de n'importe quel fichier, sans limite de taille ni de type —
-- un client aurait pu uploader un exécutable ou un fichier de plusieurs Go. On
-- restreint au niveau du bucket lui-même (appliqué par Storage, indépendamment du
-- code applicatif) : images courantes + PDF, 10 Mo max par fichier.
update storage.buckets
set
  file_size_limit = 10485760, -- 10 Mo
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf'
  ]
where id = 'request-attachments';
