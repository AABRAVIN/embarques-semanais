-- ============================================================
-- SCHEMA: Embarques Semanais - Translima
-- ============================================================

-- 1. PROFILES (estende o auth.users do Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'usuario' CHECK (role IN ('admin', 'usuario')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-cria perfil quando um usuário se cadastra via Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', 'Usuário'),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'usuario')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 2. EMBARQUES
CREATE TABLE IF NOT EXISTS embarques (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data              DATE NOT NULL,
  fornecedor        TEXT NOT NULL,
  fornecedor_cidade TEXT NOT NULL,
  cliente           TEXT NOT NULL,
  cliente_cidade    TEXT NOT NULL,
  qtd               TEXT NOT NULL,
  material          TEXT NOT NULL,
  placa             TEXT NOT NULL,
  motorista         TEXT,
  motorista_id      UUID REFERENCES motoristas(id) ON DELETE SET NULL,
  obs               TEXT,
  status            TEXT NOT NULL DEFAULT 'standby'
                    CHECK (status IN ('confirmado','motorista_avisado','standby','sem_motorista','concluido')),
  status_embarque   TEXT,
  status_motorista  TEXT,
  destaque          TEXT NOT NULL DEFAULT '',
  confirmado_at     TIMESTAMPTZ,
  avisado_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. MOTORISTAS
CREATE TABLE IF NOT EXISTS motoristas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  cpf        TEXT NOT NULL,
  cnh        TEXT NOT NULL,
  telefone   TEXT NOT NULL,
  email      TEXT,
  endereco   TEXT,
  status     TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. VEICULOS
CREATE TABLE IF NOT EXISTS veiculos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa      TEXT NOT NULL,
  modelo     TEXT NOT NULL,
  marca      TEXT NOT NULL,
  ano        TEXT,
  tipo       TEXT NOT NULL,
  capacidade TEXT,
  cor        TEXT,
  status     TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo','manutencao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  cidade     TEXT,
  telefone   TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. AGENDA
CREATE TABLE IF NOT EXISTS agenda (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      TEXT NOT NULL,
  descricao   TEXT,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim    TIMESTAMPTZ,
  tipo        TEXT NOT NULL DEFAULT 'evento',
  embarque_id UUID REFERENCES embarques(id) ON DELETE SET NULL,
  motorista_id UUID REFERENCES motoristas(id) ON DELETE SET NULL,
  veiculo_id  UUID REFERENCES veiculos(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','concluido','cancelado')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. OCORRENCIAS
CREATE TABLE IF NOT EXISTS ocorrencias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embarque_id UUID REFERENCES embarques(id) ON DELETE SET NULL,
  titulo      TEXT NOT NULL,
  descricao   TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'info'
              CHECK (tipo IN ('critico','medio','baixo','info','warning','alert')),
  data        TIMESTAMPTZ NOT NULL DEFAULT now(),
  status      TEXT NOT NULL DEFAULT 'aberto'
              CHECK (status IN ('aberto','andamento','resolvido')),
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. FILA_ESPERA (Ordem de Chegada)
CREATE TABLE IF NOT EXISTS fila_espera (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos        INTEGER NOT NULL,
  veiculo    TEXT NOT NULL,
  categoria  TEXT NOT NULL CHECK (categoria IN ('VANDERLEIA','CARRETA LS','BITRUCK','BITREM')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fila_espera_pos ON fila_espera(pos);
CREATE INDEX IF NOT EXISTS idx_fila_espera_categoria ON fila_espera(categoria);

-- RPC: delete_from_fila_espera
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

-- RPC: reorder_fila_espera
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

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  message        TEXT NOT NULL,
  sender_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL DEFAULT 'usuario' CHECK (recipient_type IN ('usuario','todos')),
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_embarques_data         ON embarques(data);
CREATE INDEX IF NOT EXISTS idx_embarques_status       ON embarques(status);
CREATE INDEX IF NOT EXISTS idx_embarques_motorista_id ON embarques(motorista_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created   ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agenda_data_inicio      ON agenda(data_inicio);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_data        ON ocorrencias(data);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_status      ON ocorrencias(status);

-- 11. MESSAGES (Chat / Broadcast)
CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  sender_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created   ON messages(created_at DESC);

-- 12. MESSAGE_STATUS (per-user read/delete tracking)
CREATE TABLE IF NOT EXISTS message_status (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  is_deleted  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_status_user ON message_status(user_id, is_deleted);

-- 10. MOTORISTAS VEICULOS (combined registry for Motoristas e Veiculos page)
CREATE TABLE IF NOT EXISTS motoristas_veiculos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  placa1     TEXT NOT NULL DEFAULT '',
  placa2     TEXT DEFAULT NULL,
  capacidade TEXT NOT NULL,
  carroceria TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS (Row Level Security) básico
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE embarques     ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila_espera ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;

-- Políticas: leitura liberada para usuários autenticados
CREATE POLICY select_authenticated ON profiles      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY select_authenticated ON embarques     FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY select_authenticated ON motoristas    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY select_authenticated ON veiculos      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY select_authenticated ON clientes      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY select_authenticated ON agenda        FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY select_authenticated ON ocorrencias   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY select_authenticated ON notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY select_authenticated ON motoristas_veiculos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY select_authenticated ON fila_espera FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY select_authenticated ON messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY select_authenticated ON message_status FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas de insert/update/delete para admins
CREATE POLICY insert_admin ON profiles      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY insert_admin ON embarques     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY insert_admin ON motoristas    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY insert_admin ON veiculos      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY insert_admin ON clientes      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY insert_admin ON agenda        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY insert_admin ON ocorrencias   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY insert_admin ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY insert_admin ON motoristas_veiculos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY insert_admin ON fila_espera FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY insert_admin ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY insert_admin ON message_status FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY update_admin ON profiles      FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY update_admin ON embarques     FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY update_admin ON motoristas    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY update_admin ON veiculos      FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY update_admin ON clientes      FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY update_admin ON agenda        FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY update_admin ON ocorrencias   FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY update_admin ON notifications FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY update_admin ON motoristas_veiculos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY update_admin ON fila_espera FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY update_admin ON message_status FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY delete_admin ON profiles      FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY delete_admin ON embarques     FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY delete_admin ON motoristas    FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY delete_admin ON veiculos      FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY delete_admin ON clientes      FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY delete_admin ON agenda        FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY delete_admin ON ocorrencias   FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY delete_admin ON notifications FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY delete_admin ON motoristas_veiculos FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY delete_admin ON fila_espera FOR DELETE USING (auth.role() = 'authenticated');
