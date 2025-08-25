/**
 * Store Index
 * Main entry point for the global state management system
 */

// ============================================================================
// STORE EXPORTS
// ============================================================================

// Core stores
export { useAuthStore, authSelectors, initializeAuthListener } from './authStore';
export { usePortfolioStore, portfolioSelectors } from './portfolioStore';
export { useUIStore, uiSelectors, initializeThemeListener } from './uiStore';
export { useApiCacheStore, apiCacheSelectors, startCacheCleanup, stopCacheCleanup } from './apiCacheStore';

// Store hooks
export {
  useAuth,
  useAuthUser,
  useAuthLoading,
  useAuthError,
  useIsAuthenticated,
  useUserPreferences,
  useUserRole,
  useIsAdmin,
  useIsPremium,
} from './authStore';

export {
  usePortfolio,
  usePortfolios,
  useActivePortfolio,
  usePortfolioLoading,
  usePortfolioError,
  useTotalPortfolioValue,
  useTotalGainLoss,
} from './portfolioStore';

export {
  useUI,
  useModals,
  useNotifications,
  useLoading,
  useSidebar,
  useTheme,
  useLayout,
  useActiveModal,
  useHasModals,
  useHasNotifications,
} from './uiStore';

export {
  useApiCache,
  useCacheStats,
  usePendingRequests,
  useRetryQueue,
} from './apiCacheStore';

// Helper functions
export {
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showInfoNotification,
  openConfirmModal,
  openFormModal,
  withLoading,
} from './uiStore';

export {
  withCache,
  createApiCacheKey,
  invalidateUserCache,
  invalidatePortfolioCache,
  invalidateMarketDataCache,
} from './apiCacheStore';

// Types
export type {
  AuthUser,
  UserPreferences,
  AuthState,
  AuthActions,
  Portfolio,
  Holding,
  PortfolioPerformance,
  PortfolioState,
  PortfolioActions,
  Modal,
  Notification,
  LoadingState,
  UIState,
  UIActions,
  CacheEntry,
  ApiCacheState,
  ApiCacheActions,
  RootState,
  StoreSlice,
  StoreOptions,
  OptimisticUpdate,
} from './types';

// Utilities
export {
  createPersistConfig,
  immerSet,
  immerGet,
  createAsyncAction,
  createCacheKey,
  isCacheValid,
  createCacheEntry,
  markCacheStale,
  createOptimisticUpdate,
  applyOptimisticUpdate,
  createErrorHandler,
  debounce,
  throttle,
  validateEmail,
  validatePassword,
  createNotification,
  safeLocalStorage,
  createRetryFunction,
  deepMerge,
} from './utils';

// ============================================================================
// STORE INITIALIZATION
// ============================================================================

export const initializeStores = () => {
  // Initialize auth listener
  initializeAuthListener();
  
  // Initialize theme listener
  const cleanupTheme = initializeThemeListener();
  
  // Start cache cleanup
  startCacheCleanup();
  
  // Return cleanup function
  return () => {
    cleanupTheme?.();
    stopCacheCleanup();
  };
};

// ============================================================================
// STORE RESET (for testing and logout)
// ============================================================================

export const resetAllStores = () => {
  // Clear persisted data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-store');
    localStorage.removeItem('portfolio-store');
    localStorage.removeItem('ui-store');
  }
  
  // Reset store states
  useAuthStore.setState({
    user: null,
    firebaseUser: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    sessionExpiry: null,
  });
  
  usePortfolioStore.setState({
    portfolios: [],
    activePortfolio: null,
    isLoading: false,
    error: null,
    lastSync: null,
  });
  
  useUIStore.setState({
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
    // Keep theme and layout preferences
  });
  
  useApiCacheStore.getState().clear();
};

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

export const getStoreStates = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      auth: useAuthStore.getState(),
      portfolio: usePortfolioStore.getState(),
      ui: useUIStore.getState(),
      apiCache: useApiCacheStore.getState(),
    };
  }
  return null;
};

export const logStoreStates = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🏪 Store States');
    console.log('Auth:', useAuthStore.getState());
    console.log('Portfolio:', usePortfolioStore.getState());
    console.log('UI:', useUIStore.getState());
    console.log('API Cache:', useApiCacheStore.getState());
    console.groupEnd();
  }
};

// ============================================================================
// STORE PERSISTENCE HELPERS
// ============================================================================

export const exportStoreData = () => {
  if (typeof window !== 'undefined') {
    const data = {
      auth: localStorage.getItem('auth-store'),
      portfolio: localStorage.getItem('portfolio-store'),
      ui: localStorage.getItem('ui-store'),
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  }
  return null;
};

export const importStoreData = (dataString: string) => {
  try {
    const data = JSON.parse(dataString);
    
    if (typeof window !== 'undefined') {
      if (data.auth) localStorage.setItem('auth-store', data.auth);
      if (data.portfolio) localStorage.setItem('portfolio-store', data.portfolio);
      if (data.ui) localStorage.setItem('ui-store', data.ui);
    }
    
    // Reload the page to apply imported data
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    
    return true;
  } catch (error) {
    console.error('Failed to import store data:', error);
    return false;
  }
};

// ============================================================================
// STORE HEALTH CHECK
// ============================================================================

export const checkStoreHealth = () => {
  const health = {
    auth: {
      initialized: !!useAuthStore.getState(),
      hasUser: !!useAuthStore.getState().user,
      isLoading: useAuthStore.getState().isLoading,
      hasError: !!useAuthStore.getState().error,
    },
    portfolio: {
      initialized: !!usePortfolioStore.getState(),
      hasPortfolios: usePortfolioStore.getState().portfolios.length > 0,
      isLoading: usePortfolioStore.getState().isLoading,
      hasError: !!usePortfolioStore.getState().error,
    },
    ui: {
      initialized: !!useUIStore.getState(),
      hasModals: useUIStore.getState().modals.length > 0,
      hasNotifications: useUIStore.getState().notifications.length > 0,
      theme: useUIStore.getState().theme,
    },
    apiCache: {
      initialized: !!useApiCacheStore.getState(),
      cacheSize: Object.keys(useApiCacheStore.getState().cache).length,
      pendingRequests: useApiCacheStore.getState().pendingRequests.size,
      retryQueueSize: useApiCacheStore.getState().retryQueue.length,
    },
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.table(health);
  }
  
  return health;
};
