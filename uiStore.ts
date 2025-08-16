import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title: string;
}

interface UIState {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  notifications: [],

  /**
   * Displays a notification, preventing duplicates from being shown simultaneously.
   */
  showNotification: (notification) => {
    const { notifications } = get();
    const newId = `notif_${Date.now()}`;

    // Deduplication check: Don't show if a notification with the same title and message is already visible.
    const isDuplicate = notifications.some(
      (n) => n.title === notification.title && n.message === notification.message
    );

    if (isDuplicate) {
      console.log('Duplicate notification prevented.');
      return;
    }

    set((state) => ({
      notifications: [...state.notifications, { ...notification, id: newId }],
    }));
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));