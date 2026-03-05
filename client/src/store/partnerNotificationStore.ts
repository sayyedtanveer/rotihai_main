import { create } from 'zustand';

export interface PartnerOrderNotification {
    id: string;
    orderId: string;
    status: string;
    message: string;
    timestamp: number;
    read: boolean;
    total?: number;
    customerName?: string;
}

interface PartnerNotificationStore {
    notifications: PartnerOrderNotification[];
    unreadCount: number;
    addNotification: (notification: Omit<PartnerOrderNotification, 'timestamp' | 'read'>) => void;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

export const usePartnerNotificationStore = create<PartnerNotificationStore>((set) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (notification) =>
        set((state) => {
            // Deduplicate by orderId + status
            const exists = state.notifications.some(
                (n) => n.orderId === notification.orderId && n.status === notification.status
            );
            if (exists) return state;

            const newNotification: PartnerOrderNotification = {
                ...notification,
                timestamp: Date.now(),
                read: false,
            };

            const updated = [newNotification, ...state.notifications].slice(0, 50);
            return {
                notifications: updated,
                unreadCount: updated.filter((n) => !n.read).length,
            };
        }),

    markAsRead: (notificationId) =>
        set((state) => {
            const updated = state.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
            );
            return {
                notifications: updated,
                unreadCount: updated.filter((n) => !n.read).length,
            };
        }),

    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        })),

    clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
