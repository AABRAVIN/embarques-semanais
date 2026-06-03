export interface Database {
  public: {
    Tables: {
      fila_espera: {
        Row: {
          id: string
          pos: number
          veiculo: string
          categoria: "VANDERLEIA" | "CARRETA LS" | "BITRUCK" | "BITREM"
          created_at: string
        }
        Insert: {
          id?: string
          pos: number
          veiculo: string
          categoria: "VANDERLEIA" | "CARRETA LS" | "BITRUCK" | "BITREM"
          created_at?: string
        }
        Update: {
          id?: string
          pos?: number
          veiculo?: string
          categoria?: "VANDERLEIA" | "CARRETA LS" | "BITRUCK" | "BITREM"
          created_at?: string
        }
        Relationships: []
      }
      embarques: {
        Row: {
          id: string
          data: string
          fornecedor: string
          fornecedor_cidade: string
          cliente: string
          cliente_cidade: string
          qtd: string
          material: string
          placa: string
          motorista: string | null
          motorista_id: string | null
          obs: string | null
          status: string
          status_embarque: string | null
          status_motorista: string | null
          destaque: string
          confirmado_at: string | null
          avisado_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data: string
          fornecedor: string
          fornecedor_cidade: string
          cliente: string
          cliente_cidade: string
          qtd: string
          material: string
          placa: string
          motorista?: string | null
          motorista_id?: string | null
          obs?: string | null
          status: string
          status_embarque?: string | null
          status_motorista?: string | null
          destaque: string
          confirmado_at?: string | null
          avisado_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          fornecedor?: string
          fornecedor_cidade?: string
          cliente?: string
          cliente_cidade?: string
          qtd?: string
          material?: string
          placa?: string
          motorista?: string | null
          motorista_id?: string | null
          obs?: string | null
          status?: string
          status_embarque?: string | null
          status_motorista?: string | null
          destaque?: string
          confirmado_at?: string | null
          avisado_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      motoristas_veiculos: {
        Row: {
          id: string
          nome: string
          placas: string
          capacidade: string
          carroceria: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          placas: string
          capacidade: string
          carroceria: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          placas?: string
          capacidade?: string
          carroceria?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          nome: string
          email: string
          avatar_url: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          email: string
          avatar_url?: string | null
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          content: string
          sender_id: string | null
          recipient_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          sender_id?: string | null
          recipient_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          sender_id?: string | null
          recipient_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      message_status: {
        Row: {
          message_id: string
          user_id: string
          is_read: boolean
          is_deleted: boolean
        }
        Insert: {
          message_id: string
          user_id: string
          is_read?: boolean
          is_deleted?: boolean
        }
        Update: {
          message_id?: string
          user_id?: string
          is_read?: boolean
          is_deleted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "message_status_message_id_fkey"
            columns: ["message_id"]
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_status_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          title: string
          message: string
          sender_id: string | null
          recipient_id: string | null
          recipient_type: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          message: string
          sender_id?: string | null
          recipient_id?: string | null
          recipient_type: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          message?: string
          sender_id?: string | null
          recipient_id?: string | null
          recipient_type?: string
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      ocorrencias: {
        Row: {
          id: string
          embarque_id: string | null
          titulo: string
          descricao: string
          tipo: string
          data: string
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          embarque_id?: string | null
          titulo: string
          descricao: string
          tipo?: string
          data?: string
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          embarque_id?: string | null
          titulo?: string
          descricao?: string
          tipo?: string
          data?: string
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_embarque_id_fkey"
            columns: ["embarque_id"]
            referencedRelation: "embarques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocorrencias_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      lembretes: {
        Row: {
          id: string
          user_id: string
          conteudo: string
          cor: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conteudo: string
          cor?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conteudo?: string
          cor?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lembretes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      delete_from_fila_espera: {
        Args: { p_id: string }
        Returns: void
      }
      reorder_fila_espera: {
        Args: { p_id: string; p_new_pos: number }
        Returns: void
      }
      delete_user: {
        Args: { user_id: string }
        Returns: void
      }
      update_user_password: {
        Args: { user_id: string; new_password: string }
        Returns: void
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
