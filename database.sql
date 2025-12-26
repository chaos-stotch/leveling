-- ============================================
-- Schema do Banco de Dados para Leveling App
-- Supabase PostgreSQL
-- ============================================

-- Tabela principal para armazenar os saves dos usuários
CREATE TABLE IF NOT EXISTS user_saves (
  user_id TEXT PRIMARY KEY,
  save_data JSONB NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_save TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_user_saves_user_id ON user_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saves_last_modified ON user_saves(last_modified);

-- Função para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_saves_updated_at
  BEFORE UPDATE ON user_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Políticas de Segurança (Row Level Security)
-- ============================================

-- Habilitar RLS na tabela
ALTER TABLE user_saves ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ler apenas seus próprios dados
-- Nota: Se você estiver usando autenticação do Supabase, descomente e ajuste:
-- CREATE POLICY "Users can read own data"
--   ON user_saves
--   FOR SELECT
--   USING (auth.uid()::text = user_id);

-- Política: Usuários podem inserir seus próprios dados
-- Nota: Se você estiver usando autenticação do Supabase, descomente e ajuste:
-- CREATE POLICY "Users can insert own data"
--   ON user_saves
--   FOR INSERT
--   WITH CHECK (auth.uid()::text = user_id);

-- Política: Usuários podem atualizar seus próprios dados
-- Nota: Se você estiver usando autenticação do Supabase, descomente e ajuste:
-- CREATE POLICY "Users can update own data"
--   ON user_saves
--   FOR UPDATE
--   USING (auth.uid()::text = user_id);

-- Política: Permitir todas as operações (para uso com anon key)
-- ATENÇÃO: Use apenas se você confiar no controle de acesso via user_id
-- Para produção, recomenda-se usar as políticas acima com autenticação
CREATE POLICY "Allow all operations for anon key"
  ON user_saves
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Comentários nas colunas
-- ============================================

COMMENT ON TABLE user_saves IS 'Armazena os saves de progresso dos usuários';
COMMENT ON COLUMN user_saves.user_id IS 'ID único do usuário (pode ser qualquer string identificadora)';
COMMENT ON COLUMN user_saves.save_data IS 'Dados JSON contendo todo o progresso do jogador';
COMMENT ON COLUMN user_saves.last_modified IS 'Data e hora da última modificação do save';
COMMENT ON COLUMN user_saves.last_save IS 'Data e hora do último save realizado pelo usuário';
COMMENT ON COLUMN user_saves.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN user_saves.updated_at IS 'Data e hora da última atualização do registro';

-- ============================================
-- Exemplo de estrutura do JSON save_data
-- ============================================
/*
{
  "player_data": "{...}",
  "tasks": "[...]",
  "notifications": "[...]",
  "blocked": "true/false",
  "theme": "soloLeveling",
  "shop_items": "[...]",
  "shop_categories": "[...]",
  "purchased_items": "[...]",
  "purchase_history": "[...]",
  "completed_tasks": "[...]",
  "titles": "[...]",
  "earned_titles": "[...]",
  "selected_title": "title_id"
}
*/

-- ============================================
-- Queries úteis
-- ============================================

-- Ver todos os saves
-- SELECT * FROM user_saves ORDER BY last_modified DESC;

-- Ver save de um usuário específico
-- SELECT * FROM user_saves WHERE user_id = 'seu_user_id';

-- Ver estatísticas de saves
-- SELECT 
--   COUNT(*) as total_saves,
--   COUNT(DISTINCT user_id) as total_users,
--   MAX(last_modified) as ultimo_save
-- FROM user_saves;

-- Limpar saves antigos (manter apenas os últimos 30 dias)
-- DELETE FROM user_saves 
-- WHERE last_modified < NOW() - INTERVAL '30 days';

