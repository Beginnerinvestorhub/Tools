/**
 * Store Utilities
 * Helper functions and utilities for Zustand stores
 */

import { produce } from 'immer';

// ============================================================================
// PERSISTENCE UTILITIES
// ============================================================================

/**
 * A safe storage implementation for Zustand's persist middleware that
 * works with server-side rendering and handles environments where
 * localStorage is not available.
 */
const ssrSafeStorage = {
  getItem: (name: string): string | null => {
    // If window is not defined, we are on the server, return null.
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.warn(`Error reading localStorage key “${name}”:`, error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    // If window is not defined, we are on the server, do nothing.
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.warn(`Error setting localStorage key “${name}”:`, error);
    }
  },
  removeItem: (name: string): void => {
    // If window is not defined, we are on the server, do nothing.
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.warn(`Error removing localStorage key “${name}”:`, error);
    }
  },
};

export const createPersistConfig = (name: string, version: number = 1) => ({
  name,
  version,
  storage: ssrSafeStorage,
  partialize: (state: any) => {
    // Only persist specific parts of the state
    const { isLoading, error, ...persistedState } = state;
    return persistedState;
  },
  migrate: (persistedState: any, version: number) => {
    // Handle state migrations between versions
    if (version === 0) {
      // Migration from version 0 to 1
      return {
        ...persistedState,
        version: 1,
      };
    }
    return persistedState;
  },
});

// ============================================================================
// IMMER UTILITIES
// ============================================================================

export const immerSet = <T>(fn: (draft: T) => void) => 
  (set: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void) =>
    set(produce(fn));

export const immerGet = <T>(get: () => T) => get();

// ============================================================================
// ASYNC ACTION UTILITIES
// ============================================================================

export const createAsyncAction = <T, P extends any[]>(
  actionName: string,
  asyncFn: (...args: P) => Promise<T>,
  options: {
    onStart?: () => void;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
    onFinally?: () => void;
  } = {}
) => {
  return async (...args: P): Promise<T> => {
    try {
      options.onStart?.();
      const result = await asyncFn(...args);
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`${actionName} failed:`, err);
      options.onError?.(err);
      throw err;
    } finally {
      options.onFinally?.();
    }
  };
};

// ============================================================================
// CACHE UTILITIES
// ============================================================================

export const createCacheKey = (...parts: (string | number | boolean)[]): string => {
  return parts.filter(Boolean).join(':');
};

export const isCacheValid = (timestamp: number, ttl: number): boolean => {
  return Date.now() - timestamp < ttl;
};

export const createCacheEntry = <T>(data: T, ttl: number = 5 * 60 * 1000) => ({
  data,
  timestamp: Date.now(),
  expiry: Date.now() + ttl,
  stale: false,
});

export const markCacheStale = <T>(entry: { data: T; timestamp: number; expiry: number; stale: boolean }) => ({
  ...entry,
  stale: true,
});

// ============================================================================
// OPTIMISTIC UPDATE UTILITIES
// ============================================================================

export const createOptimisticUpdate = <T>(
  id: string,
  type: 'create' | 'update' | 'delete',
  data: T,
  rollback: () => void
) => ({
  id,
  type,
  data,
  rollback,
  timestamp: Date.now(),
});

export const applyOptimisticUpdate = <T>(
  items: T[],
  update: { id: string; type: 'create' | 'update' | 'delete'; data: T },
  getId: (item: T) => string
): T[] => {
  switch (update.type) {
    case 'create':
      return [...items, update.data];
    case 'update':
      return items.map(item => 
        getId(item) === update.id ? { ...item, ...update.data } : item
      );
    case 'delete':
      return items.filter(item => getId(item) !== update.id);
    default:
      return items;
  }
};

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export const createErrorHandler = (context: string) => (error: unknown): string => {
  if (error instanceof Error) {
    console.error(`${context}:`, error);
    return error.message;
  }
  
  if (typeof error === 'string') {
    console.error(`${context}:`, error);
    return error;
  }
  
  const errorMessage = `Unknown error in ${context}`;
  console.error(errorMessage, error);
  return errorMessage;
};

// ============================================================================
// NOTIFICATION UTILITIES
// ============================================================================

export const createNotification = (
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message: string,
  duration?: number
) => ({
  type,
  title,
  message,
  duration: duration ?? (type === 'error' ? 0 : 5000), // Errors don't auto-dismiss
  timestamp: Date.now(),
});

// ============================================================================
// LOCAL STORAGE UTILITIES
// ============================================================================

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get localStorage item ${key}:`, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set localStorage item ${key}:`, error);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove localStorage item ${key}:`, error);
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  },
};
