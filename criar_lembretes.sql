-- ============================================================
-- Migration: Lembretes (Post-it style personal notes)
-- ============================================================

-- 1. LEMBRETES
CREATE TABLE IF NOT EXISTS lembretes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo   TEXT NOT NULL,
  cor        TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lembretes_user ON lembretes(user_id, created_at DESC);

-- 2. RLS
ALTER TABLE lembretes ENABLE ROW LEVEL SECURITY;

-- Cada usuário vê apenas os seus próprios lembretes
CREATE POLICY select_own ON lembretes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own ON lembretes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY update_own ON lembretes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY delete_own ON lembretes
  FOR DELETE USING (auth.uid() = user_id);
