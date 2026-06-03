export interface Cliente {
  id: string;
  nome: string;
  local: string | null;
  frete_acordado: string | null;
  cond_pagamento: string | null;
  created_at: string;
  updated_at: string;
}
