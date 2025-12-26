-- ============================================
-- Script de Atualização do Banco de Dados
-- Adiciona suporte para Sistema de Títulos
-- ============================================

-- Verificar se a tabela existe e tem a estrutura correta
DO $$
BEGIN
    -- Verificar se a tabela user_saves existe
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_saves') THEN
        RAISE NOTICE 'Tabela user_saves não existe. Execute o script database.sql primeiro.';
    ELSE
        RAISE NOTICE 'Tabela user_saves encontrada.';
    END IF;
END $$;

-- ============================================
-- Migração de Dados Existentes (se necessário)
-- ============================================

-- Atualizar saves existentes para incluir campos de títulos vazios
-- Isso garante compatibilidade com dados antigos
UPDATE user_saves
SET save_data = jsonb_set(
    jsonb_set(
        jsonb_set(
            COALESCE(save_data, '{}'::jsonb),
            '{titles}',
            COALESCE(save_data->'titles', '[]'::jsonb)
        ),
        '{earned_titles}',
        COALESCE(save_data->'earned_titles', '[]'::jsonb)
    ),
    '{selected_title}',
    COALESCE(save_data->'selected_title', 'null'::jsonb)
)
WHERE save_data IS NOT NULL
  AND (
    save_data->'titles' IS NULL 
    OR save_data->'earned_titles' IS NULL 
    OR save_data->'selected_title' IS NULL
  );

-- ============================================
-- Queries de Verificação
-- ============================================

-- Verificar quantos usuários têm títulos configurados
-- SELECT 
--   COUNT(*) as total_users,
--   COUNT(CASE WHEN save_data->'titles' IS NOT NULL AND jsonb_array_length(COALESCE(save_data->'titles', '[]'::jsonb)) > 0 THEN 1 END) as users_with_titles,
--   COUNT(CASE WHEN save_data->'earned_titles' IS NOT NULL AND jsonb_array_length(COALESCE(save_data->'earned_titles', '[]'::jsonb)) > 0 THEN 1 END) as users_with_earned_titles
-- FROM user_saves;

-- Verificar estrutura de um save específico
-- SELECT 
--   user_id,
--   jsonb_pretty(save_data) as save_data_formatted,
--   last_modified
-- FROM user_saves
-- WHERE user_id = 'seu_user_id';

-- ============================================
-- Queries de Limpeza (Opcional)
-- ============================================

-- Remover títulos ganhos que não existem mais na lista de títulos
-- (Útil se você deletou títulos no admin)
-- UPDATE user_saves
-- SET save_data = jsonb_set(
--     save_data,
--     '{earned_titles}',
--     (
--         SELECT jsonb_agg(elem)
--         FROM jsonb_array_elements_text(save_data->'earned_titles') elem
--         WHERE elem::text IN (
--             SELECT jsonb_array_elements_text(save_data->'titles')->>'id'
--         )
--     )
-- )
-- WHERE save_data->'earned_titles' IS NOT NULL;

-- Limpar título selecionado se não estiver mais na lista de títulos ganhos
-- UPDATE user_saves
-- SET save_data = jsonb_set(
--     save_data,
--     '{selected_title}',
--     'null'::jsonb
-- )
-- WHERE save_data->'selected_title' IS NOT NULL
--   AND save_data->'selected_title'::text != 'null'
--   AND save_data->'selected_title'::text NOT IN (
--       SELECT jsonb_array_elements_text(save_data->'earned_titles')
--   );

-- ============================================
-- Queries de Estatísticas
-- ============================================

-- Estatísticas de títulos
-- SELECT 
--   COUNT(DISTINCT user_id) as total_users,
--   AVG(jsonb_array_length(COALESCE(save_data->'earned_titles', '[]'::jsonb))) as avg_earned_titles,
--   MAX(jsonb_array_length(COALESCE(save_data->'earned_titles', '[]'::jsonb))) as max_earned_titles,
--   COUNT(CASE WHEN save_data->'selected_title' IS NOT NULL AND save_data->'selected_title'::text != 'null' THEN 1 END) as users_with_selected_title
-- FROM user_saves;

-- Listar todos os títulos únicos configurados por todos os usuários
-- SELECT DISTINCT
--   title->>'id' as title_id,
--   title->>'name' as title_name,
--   COUNT(*) as times_configured
-- FROM user_saves,
--   jsonb_array_elements(COALESCE(save_data->'titles', '[]'::jsonb)) title
-- GROUP BY title->>'id', title->>'name'
-- ORDER BY times_configured DESC;

-- ============================================
-- Backup antes de atualizar (Recomendado)
-- ============================================

-- Criar backup da tabela antes de fazer alterações
-- CREATE TABLE user_saves_backup AS 
-- SELECT * FROM user_saves;

-- ============================================
-- Rollback (se necessário)
-- ============================================

-- Restaurar do backup
-- DROP TABLE IF EXISTS user_saves;
-- ALTER TABLE user_saves_backup RENAME TO user_saves;

