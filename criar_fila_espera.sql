-- ============================================================
-- Migration: Criar / Corrigir tabela fila_espera
-- ============================================================

-- 1. Cria a tabela se não existir
CREATE TABLE IF NOT EXISTS fila_espera (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos        INTEGER NOT NULL,
  placa      TEXT,
  veiculo    TEXT,
  categoria  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Renomeia placa -> veiculo se a coluna placa existe e veiculo não existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fila_espera' AND column_name = 'placa'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fila_espera' AND column_name = 'veiculo'
  ) THEN
    ALTER TABLE fila_espera RENAME COLUMN placa TO veiculo;
  END IF;
END $$;

-- 3. Se ambas as colunas existem (placa + veiculo), copia dados e droppa placa
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fila_espera' AND column_name = 'placa'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fila_espera' AND column_name = 'veiculo'
  ) THEN
    -- Copia valores da placa para veiculo onde veiculo está vazio/nulo
    UPDATE fila_espera SET veiculo = placa WHERE veiculo IS NULL OR veiculo = '';
    -- Droppa a coluna placa
    ALTER TABLE fila_espera DROP COLUMN placa;
  END IF;
END $$;

-- 4. Garante que veiculo existe e tem NOT NULL
ALTER TABLE fila_espera ADD COLUMN IF NOT EXISTS veiculo TEXT;
UPDATE fila_espera SET veiculo = '' WHERE veiculo IS NULL;
ALTER TABLE fila_espera ALTER COLUMN veiculo SET NOT NULL;

-- 5. Garante que as outras colunas existem
ALTER TABLE fila_espera ADD COLUMN IF NOT EXISTS pos INTEGER;
UPDATE fila_espera SET pos = 0 WHERE pos IS NULL;
ALTER TABLE fila_espera ALTER COLUMN pos SET NOT NULL;

ALTER TABLE fila_espera ADD COLUMN IF NOT EXISTS categoria TEXT;
UPDATE fila_espera SET categoria = 'VANDERLEIA' WHERE categoria IS NULL;
ALTER TABLE fila_espera ALTER COLUMN categoria SET NOT NULL;

ALTER TABLE fila_espera ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 6. Recria a constraint CHECK de categoria (seguro, só droppa se existir)
ALTER TABLE fila_espera DROP CONSTRAINT IF EXISTS fila_espera_categoria_check;
ALTER TABLE fila_espera ADD CONSTRAINT fila_espera_categoria_check
  CHECK (categoria IN ('VANDERLEIA','CARRETA LS','BITRUCK','BITREM'));

-- 7. Cria índices para performance
CREATE INDEX IF NOT EXISTS idx_fila_espera_pos ON fila_espera(pos);
CREATE INDEX IF NOT EXISTS idx_fila_espera_categoria ON fila_espera(categoria);

-- 8. RLS
ALTER TABLE fila_espera ENABLE ROW LEVEL SECURITY;

-- Políticas: leitura para autenticados
DROP POLICY IF EXISTS select_authenticated ON fila_espera;
CREATE POLICY select_authenticated ON fila_espera
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas: insert/update/delete para autenticados
DROP POLICY IF EXISTS insert_authenticated ON fila_espera;
CREATE POLICY insert_authenticated ON fila_espera
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS update_authenticated ON fila_espera;
CREATE POLICY update_authenticated ON fila_espera
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS delete_authenticated ON fila_espera;
CREATE POLICY delete_authenticated ON fila_espera
  FOR DELETE USING (auth.role() = 'authenticated');

-- 9. RPC: delete_from_fila_espera
CREATE OR REPLACE FUNCTION delete_from_fila_espera(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_pos INTEGER;
  v_cat TEXT;
BEGIN
  SELECT pos, categoria INTO v_pos, v_cat FROM fila_espera WHERE id = p_id;
  DELETE FROM fila_espera WHERE id = p_id;
  UPDATE fila_espera SET pos = pos - 1 WHERE categoria = v_cat AND pos > v_pos;
END;
$$;

-- 10. RPC: reorder_fila_espera
CREATE OR REPLACE FUNCTION reorder_fila_espera(p_id UUID, p_new_pos INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_old_pos INTEGER;
  v_cat TEXT;
  v_max_pos INTEGER;
BEGIN
  SELECT pos, categoria INTO v_old_pos, v_cat FROM fila_espera WHERE id = p_id;
  SELECT COALESCE(MAX(pos), 0) INTO v_max_pos FROM fila_espera WHERE categoria = v_cat;
  p_new_pos := GREATEST(1, LEAST(p_new_pos, v_max_pos));
  IF p_new_pos = v_old_pos THEN RETURN; END IF;
  IF p_new_pos < v_old_pos THEN
    UPDATE fila_espera SET pos = pos + 1 WHERE categoria = v_cat AND pos >= p_new_pos AND pos < v_old_pos;
  ELSE
    UPDATE fila_espera SET pos = pos - 1 WHERE categoria = v_cat AND pos > v_old_pos AND pos <= p_new_pos;
  END IF;
  UPDATE fila_espera SET pos = p_new_pos WHERE id = p_id;
END;
$$;
