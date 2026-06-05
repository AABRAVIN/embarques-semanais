-- ============================================================
-- TRIGGER DE AUDITORIA (handle_audit_log)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'criacao', NULL, 'Registro criado', v_user_id);

  ELSIF TG_OP = 'UPDATE' THEN
    -- Campos de embarques
    IF TG_TABLE_NAME = 'embarques' THEN
      IF NEW.motorista IS DISTINCT FROM OLD.motorista THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'motorista', OLD.motorista, NEW.motorista, v_user_id);
      END IF;
      IF NEW.obs IS DISTINCT FROM OLD.obs THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'obs', OLD.obs, NEW.obs, v_user_id);
      END IF;
      IF NEW.status_embarque IS DISTINCT FROM OLD.status_embarque THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'status_embarque', OLD.status_embarque, NEW.status_embarque, v_user_id);
      END IF;
      IF NEW.status_motorista IS DISTINCT FROM OLD.status_motorista THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'status_motorista', OLD.status_motorista, NEW.status_motorista, v_user_id);
      END IF;
      IF NEW.placa IS DISTINCT FROM OLD.placa THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'placa', OLD.placa, NEW.placa, v_user_id);
      END IF;
      IF NEW.data IS DISTINCT FROM OLD.data THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'data', OLD.data::TEXT, NEW.data::TEXT, v_user_id);
      END IF;
    END IF;

    -- Campos de ocorrencias
    IF TG_TABLE_NAME = 'ocorrencias' THEN
      IF NEW.titulo IS DISTINCT FROM OLD.titulo THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'titulo', OLD.titulo, NEW.titulo, v_user_id);
      END IF;
      IF NEW.descricao IS DISTINCT FROM OLD.descricao THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'descricao', OLD.descricao, NEW.descricao, v_user_id);
      END IF;
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'status', OLD.status, NEW.status, v_user_id);
      END IF;
      IF NEW.tipo IS DISTINCT FROM OLD.tipo THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'tipo', OLD.tipo, NEW.tipo, v_user_id);
      END IF;
    END IF;

    -- Campos de clientes
    IF TG_TABLE_NAME = 'clientes' THEN
      IF NEW.nome IS DISTINCT FROM OLD.nome THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'nome', OLD.nome, NEW.nome, v_user_id);
      END IF;
      IF NEW.local IS DISTINCT FROM OLD.local THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'local', OLD.local, NEW.local, v_user_id);
      END IF;
      IF NEW.frete_acordado IS DISTINCT FROM OLD.frete_acordado THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'frete_acordado', OLD.frete_acordado, NEW.frete_acordado, v_user_id);
      END IF;
      IF NEW.cond_pagamento IS DISTINCT FROM OLD.cond_pagamento THEN
        INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'cond_pagamento', OLD.cond_pagamento, NEW.cond_pagamento, v_user_id);
      END IF;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO logs (tabela, registro_id, campo, valor_antigo, valor_novo, usuario_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'exclusao', 'Registro excluído', NULL, v_user_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- TRIGGERS
DROP TRIGGER IF EXISTS trg_audit_embarques ON embarques;
CREATE TRIGGER trg_audit_embarques
  AFTER INSERT OR UPDATE OR DELETE ON embarques
  FOR EACH ROW EXECUTE FUNCTION handle_audit_log();

DROP TRIGGER IF EXISTS trg_audit_ocorrencias ON ocorrencias;
CREATE TRIGGER trg_audit_ocorrencias
  AFTER INSERT OR UPDATE OR DELETE ON ocorrencias
  FOR EACH ROW EXECUTE FUNCTION handle_audit_log();

DROP TRIGGER IF EXISTS trg_audit_clientes ON clientes;
CREATE TRIGGER trg_audit_clientes
  AFTER INSERT OR UPDATE OR DELETE ON clientes
  FOR EACH ROW EXECUTE FUNCTION handle_audit_log();

-- ============================================================
-- INDEX para busca eficiente por data
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);

-- ============================================================
-- LIMPEZA AUTOMÁTICA (logs com mais de 60 dias)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM logs WHERE created_at < NOW() - INTERVAL '60 days';
END;
$$;

-- Comentário: Para agendar a limpeza automática, habilite a extensão pg_cron
-- no Supabase (Database > Extensions) e execute:
--   SELECT cron.schedule('cleanup-logs', '0 3 * * *', 'SELECT cleanup_old_logs();');
--
-- Isso executará a limpeza diariamente às 03:00.
