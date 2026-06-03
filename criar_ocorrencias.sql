-- ============================================================
-- Migration: Ocorrências - Mural Colaborativo
-- ============================================================
-- A tabela já existe no schema principal (supabase_schema.sql).
-- Este arquivo apenas garante as RLS policies corretas.

-- 1. RLS: qualquer usuário autenticado pode ler, inserir, atualizar e deletar
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;

-- SELECT
DROP POLICY IF EXISTS select_authenticated ON ocorrencias;
CREATE POLICY select_all ON ocorrencias
  FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT
DROP POLICY IF EXISTS insert_admin ON ocorrencias;
CREATE POLICY insert_all ON ocorrencias
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- UPDATE
DROP POLICY IF EXISTS update_admin ON ocorrencias;
CREATE POLICY update_all ON ocorrencias
  FOR UPDATE USING (auth.role() = 'authenticated');

-- DELETE
DROP POLICY IF EXISTS delete_admin ON ocorrencias;
CREATE POLICY delete_all ON ocorrencias
  FOR DELETE USING (auth.role() = 'authenticated');
