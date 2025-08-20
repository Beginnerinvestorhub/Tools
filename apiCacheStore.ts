import { create } from 'zustand';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface ApiCacheState {
  cache: Map<string, CacheEntry>;
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttl?: number) => void;
  invalidate: (key: string) => void;
  clear: () => void;
  isExpired: (key: string) => boolean;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const useApiCacheStore = create<ApiCacheState>((set, get) => ({
  cache: new Map(),

  get: <T>(key: string): T | null => {
    const entry = get().cache.get(key);
    if (!entry) return null;
    
    if (get().isExpired(key)) {
      get().invalidate(key);
      return null;
    }
    
    return entry.data as T;
  },

  set: <T>(key: string, data: T, ttl = DEFAULT_TTL) => {
    set((state) => {
      const newCache = new Map(state.cache);
      newCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
      return { cache: newCache };
    });
  },

  invalidate: (key: string) => {
    set((state) => {
      const newCache = new Map(state.cache);
      newCache.delete(key);
      return { cache: newCache };
    });
  },

  clear: () => {
    set({ cache: new Map() });
  },

  isExpired: (key: string): boolean => {
    const entry = get().cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > entry.ttl;
  }
}));