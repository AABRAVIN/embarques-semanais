export interface Message {
  id: string;
  content: string;
  sender_id: string | null;
  recipient_id: string | null;
  created_at: string;
}

export interface MessageInput {
  content: string;
  recipient_id?: string | null;
}

export interface MessageStatus {
  message_id: string;
  user_id: string;
  is_read: boolean;
  is_deleted: boolean;
}
