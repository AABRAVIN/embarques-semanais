export interface Ocorrencia {
  id: string;
  embarque_id: string | null;
  titulo: string;
  descricao: string;
  tipo: string;
  data: string;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
