import { useState, useEffect, useCallback } from "react";
import type { Notification, NotificationInput } from "@/types/notifications";
import {
  fetchNotifications,
  getUnreadCount,
  sendNotification,
  markAsRead,
  subscribeNotifications,
} from "@/lib/notifications";

const CURRENT_USER_ID = undefined;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [notifs, count] = await Promise.all([
        fetchNotifications(CURRENT_USER_ID),
        getUnreadCount(CURRENT_USER_ID),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = subscribeNotifications(CURRENT_USER_ID, () => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  async function send(input: NotificationInput) {
    await sendNotification(input, CURRENT_USER_ID);
  }

  async function markRead(id: string) {
    await markAsRead(id);
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
  }

  return {
    notifications,
    unreadCount,
    loading,
    send,
    markRead,
    refresh: loadData,
  };
}
