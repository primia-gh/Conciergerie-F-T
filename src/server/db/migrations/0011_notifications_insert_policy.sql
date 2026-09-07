-- M1 prévoyait des notifications créées uniquement via la service role key
-- (absente de cet environnement — voir PROJECT_ANALYSIS.md). Le dispatcher
-- (M11) doit donc pouvoir écrire depuis une session utilisateur normale.
-- Simplification assumée : n'importe quel utilisateur authentifié peut créer
-- une notification pour n'importe quel destinataire (la table ne porte pas de
-- request_id permettant une policy plus fine du type "partage une demande
-- avec le destinataire" sans complexifier le schéma). Risque résiduel :
-- spam de notifications par un compte compromis, pas de fuite de données ni
-- d'élévation de privilège. À revoir en M14 (sécurité) si besoin d'un
-- contrôle plus strict.
create policy "notifications_insert_authenticated" on public.notifications for insert
to authenticated
with check (true);
