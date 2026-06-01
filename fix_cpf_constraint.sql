-- ============================================================
-- CORREÇÃO COMPLETA: Remove restrições NOT NULL desnecessárias
-- da tabela motoristas_veiculos (campos não usados no formulário)
-- ============================================================
-- Execute no SQL Editor do Supabase Dashboard:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

ALTER TABLE motoristas_veiculos
  ALTER COLUMN cpf       DROP NOT NULL,
  ALTER COLUMN cnh       DROP NOT NULL,
  ALTER COLUMN telefone  DROP NOT NULL;

-- Verificação: confirma que os campos agora são nullable
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'motoristas_veiculos'
ORDER BY ordinal_position;
