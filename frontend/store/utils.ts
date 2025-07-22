/**
 * Store Utilities
 * Helper functions and utilities for Zustand stores
 */

import { produce } from 'immer';

// ============================================================================
// PERSISTENCE UTILITIES
// ============================================================================

export const createPersistConfig = (name: string, version: number = 1) => ({
  name,
  version,
  storage: {
    getItem: (name: string) => {
      try {
        const item = localStorage.getItem(name);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.warn(`Failed to parse localStorage item ${name}:`, error);
        return null;
      }
    },
    setItem: (name: string, value: any) => {
      try {
        localStorage.setItem(name, JSON.stringify(value));
      } catch (error) {
        console.warn(`Failed to set localStorage item ${name}:`, error);
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.warn(`Failed to remove localStorage item ${name}:`, error);
      }
    },
  },
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
// DEBOUNCE UTILITIES
// ============================================================================

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
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

// ============================================================================
// RETRY UTILITIES
// ============================================================================

export const createRetryFunction = <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  backoff: number = 2
) => {
  return async (): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, delay * Math.pow(backoff, attempt))
        );
      }
    }
    
    throw lastError!;
  };
};

// ============================================================================
// DEEP MERGE UTILITY
// ============================================================================

export const deepMerge = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  
  return result;
};
