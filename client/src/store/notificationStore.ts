import { create } from 'zustand';

export interface OrderNotification {
  id: string;
  orderId: string;
  status: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface NotificationStore {
  notifications: OrderNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<OrderNotification, 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (notificationId: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => {
      const newNotification: OrderNotification = {
        ...notification,
        timestamp: Date.now(),
        read: false,
      };
      const newNotifications = [newNotification, ...state.notifications].slice(0, 50); // Keep last 50
      const newUnreadCount = newNotifications.filter((n) => !n.read).length;
      return {
        notifications: newNotifications,
        unreadCount: newUnreadCount,
      };
    }),

  markAsRead: (notificationId) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      const newUnreadCount = updated.filter((n) => !n.read).length;
      return {
        notifications: updated,
        unreadCount: newUnreadCount,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearNotifications: () =>
    set(() => ({
      notifications: [],
      unreadCount: 0,
    })),

  removeNotification: (notificationId) =>
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== notificationId);
      const newUnreadCount = updated.filter((n) => !n.read).length;
      return {
        notifications: updated,
        unreadCount: newUnreadCount,
      };
    }),
}));
