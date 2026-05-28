import { supabase } from "./supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Notification, NotificationInput } from "@/types/notifications";

export async function fetchNotifications(
  userId?: string
): Promise<Notification[]> {
  const query = supabase
    .from("notifications")
    .select("*")
    .or(
      userId
        ? `recipient_id.eq.${userId},recipient_type.eq.todos,recipient_id.is.null`
        : "recipient_type.eq.todos,recipient_id.is.null"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function getUnreadCount(userId?: string): Promise<number> {
  const query = supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  if (userId) {
    query.or(
      `recipient_id.eq.${userId},recipient_type.eq.todos,recipient_id.is.null`
    );
  } else {
    query.or("recipient_type.eq.todos,recipient_id.is.null");
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function sendNotification(
  input: NotificationInput,
  senderId?: string
): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      title: input.title,
      message: input.message,
      sender_id: senderId ?? null,
      recipient_id:
        input.recipient_type === "usuario" ? input.recipient_id : null,
      recipient_type: input.recipient_type,
    } as never)
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}

export async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("id", notificationId);

  if (error) throw error;
}

export function subscribeNotifications(
  userId: string | undefined,
  onPayload: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void
) {
  const channel = supabase
    .channel("notifications-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      },
      (payload) => {
        const record = payload.new as Record<string, unknown>;
        if (
          record.recipient_type === "todos" ||
          record.recipient_id === null ||
          record.recipient_id === userId
        ) {
          onPayload(payload);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
