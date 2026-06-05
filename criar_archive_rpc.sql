-- ============================================================
-- RPC: archive_concluded_embarques
-- Arquiva embarques concluídos com mais de 30 dias no bucket
-- backup-historico e os remove da tabela ativa.
-- ============================================================

-- Primeiro, garantir que o bucket existe (criar via UI do Supabase
-- Storage, bucket privado chamado "backup-historico")

CREATE OR REPLACE FUNCTION public.archive_concluded_embarques(dias INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
  v_json JSONB;
  v_file_name TEXT;
  v_bucket_id TEXT := 'backup-historico';
BEGIN
  -- Seleciona embarques concluídos há mais de N dias
  SELECT jsonb_agg(to_jsonb(e)) INTO v_json
  FROM (
    SELECT * FROM public.embarques
    WHERE status_embarque = 'concluido'
      AND updated_at < NOW() - (dias || ' days')::INTERVAL
    ORDER BY updated_at DESC
  ) e;

  -- Se não há registros, retorna 0
  IF v_json IS NULL THEN
    RETURN 0;
  END IF;

  v_count := jsonb_array_length(v_json);

  -- Nome do arquivo: embarques_YYYY-MM-DD_HHmmss.json
  v_file_name := 'embarques_' || TO_CHAR(NOW(), 'YYYY-MM-DD_HH24MISS') || '.json';

  -- Faz upload para o bucket (requer que o bucket exista)
  BEGIN
    PERFORM storage.insert_object(
      v_bucket_id,
      v_file_name,
      'application/json',
      convert_to(v_json::text, 'UTF8')
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao fazer upload para o bucket %: %', v_bucket_id, SQLERRM;
  END;

  -- Deleta os registros arquivados
  DELETE FROM public.embarques
  WHERE status_embarque = 'concluido'
    AND updated_at < NOW() - (dias || ' days')::INTERVAL;

  RETURN v_count;
END;
$$;

-- ============================================================
-- Permissões para acesso via API (PostgREST/Supabase)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.archive_concluded_embarques(INTEGER) TO anon, authenticated;

-- Recarrega o schema da API para expor a nova função
NOTIFY pgrst, 'reload schema';

-- Garante permissão total nas tabelas do schema public
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, service_role;
