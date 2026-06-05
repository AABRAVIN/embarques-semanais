-- ============================================================
-- TABELA: embarques_historico
-- Mesma estrutura da tabela embarques (ativa), para consultas
-- rápidas via SQL. Os registros são inseridos aqui durante o
-- arquivamento, antes de serem removidos da tabela ativa.
-- ============================================================

CREATE TABLE IF NOT EXISTS embarques_historico (
  id                UUID PRIMARY KEY,
  data              DATE NOT NULL,
  fornecedor        TEXT NOT NULL,
  fornecedor_cidade TEXT NOT NULL,
  cliente           TEXT NOT NULL,
  cliente_cidade    TEXT NOT NULL,
  qtd               TEXT NOT NULL,
  material          TEXT NOT NULL,
  placa             TEXT NOT NULL,
  motorista         TEXT,
  motorista_id      UUID,
  obs               TEXT,
  status            TEXT NOT NULL DEFAULT 'standby',
  status_embarque   TEXT,
  status_motorista  TEXT,
  destaque          TEXT NOT NULL DEFAULT '',
  confirmado_at     TIMESTAMPTZ,
  avisado_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ,
  arquivado_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_historico_data ON embarques_historico(data DESC);
CREATE INDEX IF NOT EXISTS idx_historico_cliente_cidade ON embarques_historico(cliente_cidade);
CREATE INDEX IF NOT EXISTS idx_historico_status_embarque ON embarques_historico(status_embarque);
CREATE INDEX IF NOT EXISTS idx_historico_arquivado_at ON embarques_historico(arquivado_at DESC);

-- RLS
ALTER TABLE embarques_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_authenticated ON embarques_historico
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY insert_authenticated ON embarques_historico
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permissões
GRANT ALL ON embarques_historico TO authenticated, service_role;
