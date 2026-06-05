-- ============================================================
-- POLICIES: Storage - backup-historico bucket
-- ============================================================
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor)
-- após criar o bucket "backup-historico" (privado) no Storage.
-- ============================================================

-- 1. Garantir RLS ativo no schema storage (já é padrão no Supabase)
--    Buckets privados já vêm com RLS habilitado por padrão.

-- 2. Policy: leitura apenas para usuários autenticados
CREATE POLICY "authenticated_select_backup"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'backup-historico');

-- 3. Policy: insert restrito a authenticated (via RPC ou cliente)
--    O bucket é privado, então por padrão já bloqueia inserções anônimas.
--    Esta policy garante que usuários logados possam fazer upload.
CREATE POLICY "authenticated_insert_backup"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'backup-historico');

-- 4. Policy: delete restrito a authenticated (para manutenção futura)
CREATE POLICY "authenticated_delete_backup"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'backup-historico');

-- 5. Policy: update restrito a authenticated
CREATE POLICY "authenticated_update_backup"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'backup-historico')
WITH CHECK (bucket_id = 'backup-historico');

-- 6. Policy específica para permitir upload (INSERT) de authenticated
DROP POLICY IF EXISTS "allow_authenticated_upload" ON storage.objects;
CREATE POLICY "allow_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'backup-historico');

-- 7. Policy específica para permitir update de authenticated
DROP POLICY IF EXISTS "allow_authenticated_update" ON storage.objects;
CREATE POLICY "allow_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'backup-historico');
