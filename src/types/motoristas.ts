export interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  telefone: string;
  email: string | null;
  endereco: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
