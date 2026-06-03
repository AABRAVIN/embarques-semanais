-- ============================================================
-- TABLE: logs (Auditoria de alterações)
-- ============================================================
CREATE TABLE IF NOT EXISTS logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela      TEXT NOT NULL,
  registro_id UUID NOT NULL,
  campo       TEXT NOT NULL,
  valor_antigo TEXT,
  valor_novo  TEXT,
  usuario_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_registro ON logs(registro_id);
CREATE INDEX IF NOT EXISTS idx_logs_criado   ON logs(created_at DESC);

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_authenticated ON logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY insert_authenticated ON logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- HABILITAR REALTIME NAS TABELAS
-- Necessário para que os eventos postgres_changes sejam disparados
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE embarques;
ALTER PUBLICATION supabase_realtime ADD TABLE ocorrencias;

-- Nota: Se as tabelas já fazem parte da publicação, esses comandos
-- são ignorados com segurança (não geram erro).
