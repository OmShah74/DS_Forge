import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface Confirmation {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

interface NotificationState {
    toasts: Toast[];
    confirmation: Confirmation | null;
    addToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
    notifySystem: (title: string, body: string) => void;
    showConfirm: (config: Confirmation) => void;
    closeConfirm: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    toasts: [],
    confirmation: null,
    addToast: (message, type = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, message, type, duration };
        set((state) => ({ toasts: [...state.toasts, newToast] }));

        if (duration !== Infinity) {
            setTimeout(() => {
                get().removeToast(id);
            }, duration);
        }
    },
    removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
    notifySystem: (title, body) => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: '/favicon.ico' });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    new Notification(title, { body, icon: '/favicon.ico' });
                }
            });
        }
    },
    showConfirm: (config) => {
        set({ confirmation: config });
    },
    closeConfirm: () => {
        set({ confirmation: null });
    },
}));
