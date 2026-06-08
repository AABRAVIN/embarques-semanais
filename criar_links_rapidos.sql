-- Criar tabela de links rápidos para o menu lateral
CREATE TABLE IF NOT EXISTS links_rapidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  ordem INT NOT NULL DEFAULT 0
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE links_rapidos ENABLE ROW LEVEL SECURITY;

-- Política: todos os usuários autenticados podem ler
CREATE POLICY "links_rapidos_select" ON links_rapidos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política: apenas admins podem inserir
CREATE POLICY "links_rapidos_insert" ON links_rapidos
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Política: apenas admins podem atualizar
CREATE POLICY "links_rapidos_update" ON links_rapidos
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Política: apenas admins podem excluir
CREATE POLICY "links_rapidos_delete" ON links_rapidos
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
