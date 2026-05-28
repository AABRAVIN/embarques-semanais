export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  ano: string | null;
  tipo: string;
  capacidade: string | null;
  cor: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
