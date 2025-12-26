-- ============================================
-- Query Simples de Atualização
-- Adiciona campos de títulos aos saves existentes
-- ============================================

-- Atualizar todos os saves existentes para incluir campos de títulos
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
WHERE save_data IS NOT NULL;

-- Verificar resultado
SELECT 
    user_id,
    CASE 
        WHEN save_data->'titles' IS NOT NULL THEN 'OK'
        ELSE 'FALTANDO'
    END as titles_status,
    CASE 
        WHEN save_data->'earned_titles' IS NOT NULL THEN 'OK'
        ELSE 'FALTANDO'
    END as earned_titles_status,
    CASE 
        WHEN save_data->'selected_title' IS NOT NULL THEN 'OK'
        ELSE 'FALTANDO'
    END as selected_title_status
FROM user_saves
LIMIT 10;

