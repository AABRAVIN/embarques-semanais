export interface Notification {
  id: string;
  title: string;
  message: string;
  sender_id: string | null;
  recipient_id: string | null;
  recipient_type: "usuario" | "todos";
  read_at: string | null;
  created_at: string;
}

export interface NotificationInput {
  title: string;
  message: string;
  recipient_id?: string | null;
  recipient_type: "usuario" | "todos";
}
