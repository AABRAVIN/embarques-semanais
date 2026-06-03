-- ============================================================
-- Migration: Messages + Message Status (Chat/Broadcast)
-- ============================================================
-- ATENÇÃO: Se a tabela já existe mas com colunas diferentes (ex: "content" no lugar de "message"),
-- execute o bloco "FIX" no final deste arquivo no SQL Editor do Supabase.

-- 1. MESSAGES
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

-- 2. MESSAGE_STATUS (per-user read/delete tracking)
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

-- 3. RLS
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;

-- Messages: SELECT para autenticados
CREATE POLICY select_authenticated ON messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Messages: INSERT para autenticados
CREATE POLICY insert_authenticated ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Message_Status: SELECT para autenticados
CREATE POLICY select_authenticated ON message_status
  FOR SELECT USING (auth.role() = 'authenticated');

-- Message_Status: INSERT para autenticados
CREATE POLICY insert_authenticated ON message_status
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Message_Status: UPDATE para autenticados
CREATE POLICY update_authenticated ON message_status
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- FIX: execute esta seção se a tabela messages já existe mas
--      tem a coluna "content" em vez de "title" + "message"
-- ============================================================
-- ALTER TABLE messages ADD COLUMN IF NOT EXISTS title  TEXT NOT NULL DEFAULT '';
-- ALTER TABLE messages ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
-- UPDATE messages SET message = content WHERE message = '' AND content IS NOT NULL;
-- ALTER TABLE message_status ADD COLUMN IF NOT EXISTS id          UUID PRIMARY KEY DEFAULT gen_random_uuid();
-- ALTER TABLE message_status ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();
-- ALTER TABLE message_status ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now();
