export type EmbarqueStatus =
  | "confirmado"
  | "motorista_avisado"
  | "standby"
  | "sem_motorista"
  | "concluido";

export interface Embarque {
  id: string;
  data: string;
  fornecedor: string;
  fornecedor_cidade: string;
  cliente: string;
  cliente_cidade: string;
  qtd: string;
  material: string;
  placa: string;
  motorista: string | null;
  motorista_id: string | null;
  obs: string | null;
  status: EmbarqueStatus | string;
  destaque: string;
  confirmado_at?: string | null;
  avisado_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
