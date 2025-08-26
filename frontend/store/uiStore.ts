/**
 * UI Store
 * Comprehensive UI state management for modals, notifications, loading states, and layout
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { produce } from 'immer';
import { 
  UIState, 
  UIActions, 
  Modal, 
  Notification, 
  LoadingState 
} from './types';
import { 
  createPersistConfig,
  createNotification
} from './utils';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: UIState = {
  modals: [],
  notifications: [],
  loading: {
    global: false,
    auth: false,
    portfolio: false,
    api: {},
  },
  sidebar: {
    isOpen: false,
    activeSection: null,
  },
  theme: 'system',
  layout: {
    headerHeight: 64,
    sidebarWidth: 256,
    contentPadding: 24,
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  if (typeof window !== 'undefined') {
    const actualTheme = theme === 'system' ? getSystemTheme() : theme;
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', actualTheme === 'dark' ? '#1f2937' : '#4338ca');
    }
  }
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ========================================================================
        // MODAL MANAGEMENT
        // ========================================================================

        openModal: (modal: Omit<Modal, 'id'>): string => {
          const id = generateId();
          const newModal: Modal = {
            ...modal,
            id,
            size: modal.size || 'md',
            closable: modal.closable !== false,
          };

          set(produce((draft) => {
            draft.modals.push(newModal);
          }));

          return id;
        },

        closeModal: (modalId: string) => {
          set(produce((draft) => {
            draft.modals = draft.modals.filter(modal => modal.id !== modalId);
          }));
        },

        closeAllModals: () => {
          set(produce((draft) => {
            draft.modals = [];
          }));
        },

        // ========================================================================
        // NOTIFICATION MANAGEMENT
        // ========================================================================

        showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>): string => {
          const id = generateId();
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp: Date.now(),
            duration: notification.duration ?? (notification.type === 'error' ? 0 : 5000),
          };

          set(produce((draft) => {
            draft.notifications.push(newNotification);
          }));

          // Auto-dismiss notification if duration is set
          if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
              get().dismissNotification(id);
            }, newNotification.duration);
          }

          return id;
        },

        dismissNotification: (notificationId: string) => {
          set(produce((draft) => {
            draft.notifications = draft.notifications.filter(
              notification => notification.id !== notificationId
            );
          }));
        },

        clearNotifications: () => {
          set(produce((draft) => {
            draft.notifications = [];
          }));
        },

        // ========================================================================
        // LOADING STATE MANAGEMENT
        // ========================================================================

        setLoading: (key: keyof LoadingState | string, loading: boolean) => {
          set(produce((draft) => {
            if (key in draft.loading && key !== 'api') {
              (draft.loading as any)[key] = loading;
            } else {
              // Handle API loading states
              draft.loading.api[key] = loading;
            }
          }));
        },

        setGlobalLoading: (loading: boolean) => {
          set(produce((draft) => {
            draft.loading.global = loading;
          }));
        },

        // ========================================================================
        // SIDEBAR MANAGEMENT
        // ========================================================================

        toggleSidebar: () => {
          set(produce((draft) => {
            draft.sidebar.isOpen = !draft.sidebar.isOpen;
          }));
        },

        setSidebarOpen: (open: boolean) => {
          set(produce((draft) => {
            draft.sidebar.isOpen = open;
          }));
        },

        setActiveSection: (section: string | null) => {
          set(produce((draft) => {
            draft.sidebar.activeSection = section;
          }));
        },

        // ========================================================================
        // THEME MANAGEMENT
        // ========================================================================

        setTheme: (theme: 'light' | 'dark' | 'system') => {
          set(produce((draft) => {
            draft.theme = theme;
          }));

          // Apply theme immediately
          applyTheme(theme);
        },

        // ========================================================================
        // LAYOUT MANAGEMENT
        // ========================================================================

        updateLayout: (layout: Partial<UIState['layout']>) => {
          set(produce((draft) => {
            Object.assign(draft.layout, layout);
          }));
        },
      }),
      {
        ...createPersistConfig('ui-store', 1),
        partialize: (state) => ({
          // Only persist theme, sidebar state, and layout
          theme: state.theme,
          sidebar: state.sidebar,
          layout: state.layout,
        }),
      }
    ),
    { name: 'ui-store' }
  )
);

// ============================================================================
// THEME SYSTEM LISTENER
// ============================================================================

// Initialize theme system listener for system theme changes
let mediaQueryListener: NodeJS.Timeout | null = null;

export const initializeThemeListener = () => {
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQueryListener = (e: MediaQueryListEvent) => {
      const { theme } = useUIStore.getState();
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', mediaQueryListener);

    // Apply initial theme
    const { theme } = useUIStore.getState();
    applyTheme(theme);

    // Cleanup function
    return () => {
      if (mediaQueryListener) {
        mediaQuery.removeEventListener('change', mediaQueryListener);
        mediaQueryListener = null;
      }
    };
  }
};

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

export const showSuccessNotification = (title: string, message: string, duration?: number) => {
  return useUIStore.getState().showNotification({
    type: 'success',
    title,
    message,
    duration,
  });
};

export const showErrorNotification = (title: string, message: string, actions?: Notification['actions']) => {
  return useUIStore.getState().showNotification({
    type: 'error',
    title,
    message,
    duration: 0, // Errors don't auto-dismiss
    actions,
  });
};

export const showWarningNotification = (title: string, message: string, duration?: number) => {
  return useUIStore.getState().showNotification({
    type: 'warning',
    title,
    message,
    duration,
  });
};

export const showInfoNotification = (title: string, message: string, duration?: number) => {
  return useUIStore.getState().showNotification({
    type: 'info',
    title,
    message,
    duration,
  });
};

// ============================================================================
// MODAL HELPERS
// ============================================================================

export const openConfirmModal = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  return useUIStore.getState().openModal({
    component: 'ConfirmModal',
    props: {
      title,
      message,
      onConfirm,
      onCancel,
    },
    size: 'sm',
  });
};

export const openFormModal = (
  component: string,
  props: Record<string, any>,
  size: Modal['size'] = 'md'
) => {
  return useUIStore.getState().openModal({
    component,
    props,
    size,
  });
};

// ============================================================================
// LOADING HELPERS
// ============================================================================

export const withLoading = async <T>(
  key: string,
  asyncFn: () => Promise<T>
): Promise<T> => {
  const { setLoading } = useUIStore.getState();
  
  try {
    setLoading(key, true);
    return await asyncFn();
  } finally {
    setLoading(key, false);
  }
};

// ============================================================================
// SELECTORS
// ============================================================================

export const uiSelectors = {
  modals: (state: UIState & UIActions) => state.modals,
  notifications: (state: UIState & UIActions) => state.notifications,
  loading: (state: UIState & UIActions) => state.loading,
  isLoading: (state: UIState & UIActions, key?: string) => {
    if (!key) return state.loading.global;
    if (key in state.loading && key !== 'api') {
      return (state.loading as any)[key];
    }
    return state.loading.api[key] || false;
  },
  sidebar: (state: UIState & UIActions) => state.sidebar,
  theme: (state: UIState & UIActions) => state.theme,
  layout: (state: UIState & UIActions) => state.layout,
  hasModals: (state: UIState & UIActions) => state.modals.length > 0,
  hasNotifications: (state: UIState & UIActions) => state.notifications.length > 0,
  activeModal: (state: UIState & UIActions) => state.modals[state.modals.length - 1] || null,
  recentNotifications: (state: UIState & UIActions) => 
    state.notifications.slice(-5).reverse(),
};

// ============================================================================
// HOOKS
// ============================================================================

export const useUI = () => useUIStore();
export const useModals = () => useUIStore(uiSelectors.modals);
export const useNotifications = () => useUIStore(uiSelectors.notifications);
export const useLoading = (key?: string) => useUIStore(state => uiSelectors.isLoading(state, key));
export const useSidebar = () => useUIStore(uiSelectors.sidebar);
export const useTheme = () => useUIStore(uiSelectors.theme);
export const useLayout = () => useUIStore(uiSelectors.layout);
export const useActiveModal = () => useUIStore(uiSelectors.activeModal);
export const useHasModals = () => useUIStore(uiSelectors.hasModals);
export const useHasNotifications = () => useUIStore(uiSelectors.hasNotifications);