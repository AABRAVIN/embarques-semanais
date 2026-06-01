-- ============================================================
-- MIGRAÇÃO: Garantir coluna placas (TEXT JSON) na tabela
-- motoristas_veiculos, migrando dados de placa1/placa2.
-- ============================================================
-- Execute este script no SQL Editor do Supabase Dashboard:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

-- 1. Adiciona a coluna placas se não existir
ALTER TABLE motoristas_veiculos ADD COLUMN IF NOT EXISTS placas TEXT NOT NULL DEFAULT '[]';

-- 2. Migra os dados existentes de placa1/placa2 para o novo campo placas
--    (só atualiza linhas onde placas ainda está vazio/padrão)
UPDATE motoristas_veiculos
SET placas = (
  SELECT json_agg(p)::text
  FROM (
    SELECT unnest(ARRAY[
      NULLIF(trim(placa1), ''),
      NULLIF(trim(placa2), '')
    ]) AS p
  ) sub
  WHERE p IS NOT NULL
)
WHERE
  (placa1 IS NOT NULL AND trim(placa1) <> '')
  OR (placa2 IS NOT NULL AND trim(placa2) <> '');

-- Se nenhum dado migrado (json_agg retorna null para arrays vazios), força '[]'
UPDATE motoristas_veiculos
SET placas = '[]'
WHERE placas IS NULL OR placas = '';

-- 3. Verificação: lista os registros após migração
SELECT id, nome, placas FROM motoristas_veiculos ORDER BY created_at DESC;
