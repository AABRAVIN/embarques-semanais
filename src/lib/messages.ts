import { supabase } from "./supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Message, MessageInput } from "@/types/messages";

export async function fetchMessages(
  userId?: string
): Promise<Message[]> {
  let query = supabase
    .from("messages")
    .select("*, message_status(*)")
    .or(
      userId
        ? `recipient_id.eq.${userId},recipient_id.is.null`
        : "recipient_id.is.null"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const { data, error } = await query;
  if (error) throw error;

  const raw = (data ?? []) as unknown as (Message & {
    message_status: { is_deleted: boolean; user_id: string }[];
  })[];

  if (!userId) return raw as Message[];

  return raw.filter((msg) => {
    const myStatus = msg.message_status?.find((s) => s.user_id === userId);
    return !myStatus?.is_deleted;
  }) as Message[];
}

export async function getUnreadMessageCount(userId?: string): Promise<number> {
  if (!userId) return 0;

  const { data: msgs, error } = await supabase
    .from("messages")
    .select("id")
    .or(`recipient_id.eq.${userId},recipient_id.is.null`) as never;

  if (error) throw error;
  const msgList = (msgs ?? []) as { id: string }[];
  if (!msgList.length) return 0;

  const msgIds = msgList.map((m) => m.id);

  const { data: statuses, error: statusErr } = await supabase
    .from("message_status")
    .select("message_id, is_read, is_deleted")
    .eq("user_id", userId)
    .in("message_id", msgIds) as never;

  if (statusErr) throw statusErr;

  const statusList = (statuses ?? []) as { message_id: string; is_read: boolean; is_deleted: boolean }[];
  const readOrDeletedIds = new Set(
    statusList.filter((s) => s.is_read || s.is_deleted).map((s) => s.message_id)
  );
  return msgIds.filter((id) => !readOrDeletedIds.has(id)).length;
}

export async function sendMessage(
  input: MessageInput,
  senderId?: string
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      content: input.content,
      sender_id: senderId ?? null,
      recipient_id: input.recipient_id ?? null,
    } as never)
    .select()
    .single();

  if (error) throw error;

  if (senderId) {
    const { error: statusError } = await supabase
      .from("message_status")
      .upsert(
        {
          message_id: data.id,
          user_id: senderId,
          is_read: true,
        } as never,
        { onConflict: "message_id, user_id" }
      );

    if (statusError) throw statusError;
  }

  return data as Message;
}

export async function markMessageAsRead(
  messageId: string,
  userId: string
) {
  const { error } = await supabase.from("message_status").upsert(
    {
      message_id: messageId,
      user_id: userId,
      is_read: true,
    } as never,
    { onConflict: "message_id, user_id" }
  );

  if (error) throw error;
}

export async function hideMessage(
  messageId: string,
  userId: string
) {
  const { error } = await supabase.from("message_status").upsert(
    {
      message_id: messageId,
      user_id: userId,
      is_deleted: true,
    } as never,
    { onConflict: "message_id, user_id" }
  );

  if (error) throw error;
}

export function subscribeMessages(
  userId: string | undefined,
  onPayload: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void
) {
  const channel = supabase
    .channel("messages-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        const record = payload.new as Record<string, unknown>;
        if (
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
