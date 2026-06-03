export interface Lembrete {
  id: string;
  user_id: string;
  conteudo: string;
  cor: string | null;
  created_at: string;
}

export interface LembreteInput {
  conteudo: string;
  cor?: string | null;
}
