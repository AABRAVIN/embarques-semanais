export interface Agenda {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  tipo: string;
  embarque_id: string | null;
  motorista_id: string | null;
  veiculo_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
