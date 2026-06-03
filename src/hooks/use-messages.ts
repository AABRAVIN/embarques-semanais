import { useState, useEffect, useCallback } from "react";
import type { Message, MessageInput } from "@/types/messages";
import {
  fetchMessages,
  getUnreadMessageCount,
  sendMessage,
  markMessageAsRead,
  hideMessage,
  subscribeMessages,
} from "@/lib/messages";

export function useMessages(userId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [msgs, count] = await Promise.all([
        fetchMessages(userId),
        getUnreadMessageCount(userId),
      ]);
      setMessages(msgs);
      setUnreadCount(count);
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = subscribeMessages(userId, () => {
      loadData();
    });
    return unsubscribe;
  }, [userId, loadData]);

  useEffect(() => {
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  async function send(input: MessageInput) {
    await sendMessage(input, userId);
  }

  async function markRead(messageId: string) {
    if (!userId) return;
    await markMessageAsRead(messageId, userId);
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function hide(messageId: string) {
    if (!userId) return;
    await hideMessage(messageId, userId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  return {
    messages,
    unreadCount,
    loading,
    send,
    markRead,
    hide,
    refresh: loadData,
  };
}
