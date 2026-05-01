import { create } from 'zustand';
import { userApi } from '../api/userApi';
import { API_BASE_URL } from '../api/axios';
import type { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  nextCursor: string | null;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  eventSource: EventSource | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  connectSSE: () => void;
  disconnectSSE: () => void;
  addNotification: (n: Notification) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  nextCursor: null,
  hasMore: true,
  loading: false,
  loadingMore: false,
  eventSource: null,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const { notifications, nextCursor } = await userApi.getNotifications(undefined, 10);
      const unreadCount = notifications.filter((n) => !n.read).length;
      set({
        notifications,
        nextCursor,
        hasMore: !!nextCursor,
        unreadCount,
        loading: false,
      });
    } catch (error) {
      console.error('[NotificationStore] Failed to fetch notifications:', error);
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { nextCursor, loadingMore, hasMore } = get();
    if (loadingMore || !hasMore || !nextCursor) return;

    set({ loadingMore: true });
    try {
      const { notifications: newNotifications, nextCursor: newCursor } =
        await userApi.getNotifications(nextCursor, 10);

      set((state) => {
        const allNotifications = [...state.notifications, ...newNotifications];
        return {
          notifications: allNotifications,
          nextCursor: newCursor,
          hasMore: !!newCursor,
          loadingMore: false,
          // Recalculate total unread from full list
          unreadCount: allNotifications.filter((n) => !n.read).length,
        };
      });
    } catch (error) {
      console.error('[NotificationStore] Failed to load more:', error);
      set({ loadingMore: false });
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      await userApi.markNotificationRead(id);
    } catch (error) {
      console.error('[NotificationStore] Failed to mark as read:', error);
      // Rollback on error
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: false } : n
        ),
        unreadCount: state.unreadCount + 1,
      }));
    }
  },

  markAllAsRead: async () => {
    const previousNotifications = get().notifications;
    const previousUnread = get().unreadCount;

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));

    try {
      await userApi.markAllNotificationsRead();
    } catch (error) {
      console.error('[NotificationStore] Failed to mark all as read:', error);
      // Rollback
      set({ notifications: previousNotifications, unreadCount: previousUnread });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  connectSSE: () => {
    const existing = get().eventSource;
    if (existing) {
      existing.close();
    }

    const token = localStorage.getItem('wp_token');
    if (!token) return;

    const url = `${API_BASE_URL}/users/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.addEventListener('connected', (e) => {
      console.log('[SSE] Connected:', (e as MessageEvent).data);
    });

    es.addEventListener('new_notification', (e) => {
      try {
        const notification: Notification = JSON.parse((e as MessageEvent).data);
        get().addNotification(notification);
      } catch (err) {
        console.error('[SSE] Failed to parse notification:', err);
      }
    });

    es.onerror = (err) => {
      console.warn('[SSE] Connection error, will auto-reconnect:', err);
      // EventSource tự reconnect theo spec.
      // Nếu token hết hạn (server trả 403), EventSource sẽ close.
    };

    set({ eventSource: es });
  },

  disconnectSSE: () => {
    const es = get().eventSource;
    if (es) {
      es.close();
      set({ eventSource: null });
      console.log('[SSE] Disconnected.');
    }
  },

  reset: () => {
    get().disconnectSSE();
    set({
      notifications: [],
      unreadCount: 0,
      nextCursor: null,
      hasMore: true,
      loading: false,
      loadingMore: false,
      eventSource: null,
    });
  },
}));
