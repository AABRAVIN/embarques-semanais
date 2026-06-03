-- ============================================================
-- MIGRAÇÃO: Adicionar colunas para o módulo de Clientes
-- ============================================================

-- Adiciona novas colunas se não existirem (mantém as existentes)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS local TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS frete_acordado TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cond_pagamento TEXT;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Habilita Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
