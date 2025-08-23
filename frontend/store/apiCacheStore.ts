/**
 * API Cache Store
 * Intelligent caching system for API responses with TTL, invalidation, and retry logic
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { produce } from 'immer';
import { 
  ApiCacheState, 
  ApiCacheActions, 
  CacheEntry 
} from './types';
import { 
  createCacheKey,
  isCacheValid,
  createCacheEntry,
  markCacheStale,
  createRetryFunction
} from './utils';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: ApiCacheState = {
  cache: {},
  pendingRequests: new Set(),
  retryQueue: [],
};

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  STALE_WHILE_REVALIDATE: 10 * 60 * 1000, // 10 minutes
  MAX_CACHE_SIZE: 1000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RETRY_BACKOFF: 2,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const isExpired = (entry: CacheEntry): boolean => {
  return Date.now() > entry.expiry;
};

const isStale = (entry: CacheEntry): boolean => {
  return entry.stale || Date.now() > (entry.timestamp + CACHE_CONFIG.STALE_WHILE_REVALIDATE);
};

const shouldEvictCache = (cache: Record<string, CacheEntry>): boolean => {
  return Object.keys(cache).length > CACHE_CONFIG.MAX_CACHE_SIZE;
};

const evictOldestEntries = (cache: Record<string, CacheEntry>, keepCount: number = 800) => {
  const entries = Object.entries(cache);
  entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
  
  const toKeep = entries.slice(-keepCount);
  const newCache: Record<string, CacheEntry> = {};
  
  toKeep.forEach(([key, entry]) => {
    newCache[key] = entry;
  });
  
  return newCache;
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useApiCacheStore = create<ApiCacheState & ApiCacheActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // CACHE OPERATIONS
      // ========================================================================

      get: <T>(key: string): T | null => {
        const { cache } = get();
        const entry = cache[key];
        
        if (!entry) {
          return null;
        }
        
        // Return null if expired
        if (isExpired(entry)) {
          // Clean up expired entry
          set(produce((draft) => {
            delete draft.cache[key];
          }));
          return null;
        }
        
        // Mark as stale if needed (but still return data)
        if (!entry.stale && isStale(entry)) {
          set(produce((draft) => {
            if (draft.cache[key]) {
              draft.cache[key] = markCacheStale(draft.cache[key]);
            }
          }));
        }
        
        return entry.data as T;
      },

      set: <T>(key: string, data: T, ttl: number = CACHE_CONFIG.DEFAULT_TTL): void => {
        set(produce((draft) => {
          draft.cache[key] = createCacheEntry(data, ttl);
          
          // Evict old entries if cache is too large
          if (shouldEvictCache(draft.cache)) {
            draft.cache = evictOldestEntries(draft.cache);
          }
        }));
      },

      invalidate: (key: string): void => {
        set(produce((draft) => {
          delete draft.cache[key];
        }));
      },

      invalidatePattern: (pattern: string): void => {
        set(produce((draft) => {
          const regex = new RegExp(pattern);
          Object.keys(draft.cache).forEach(key => {
            if (regex.test(key)) {
              delete draft.cache[key];
            }
          });
        }));
      },

      clear: (): void => {
        set(produce((draft) => {
          draft.cache = {};
          draft.pendingRequests.clear();
          draft.retryQueue = [];
        }));
      },

      // ========================================================================
      // PENDING REQUEST MANAGEMENT
      // ========================================================================

      isPending: (key: string): boolean => {
        return get().pendingRequests.has(key);
      },

      setPending: (key: string, pending: boolean): void => {
        set(produce((draft) => {
          if (pending) {
            draft.pendingRequests.add(key);
          } else {
            draft.pendingRequests.delete(key);
          }
        }));
      },

      // ========================================================================
      // RETRY QUEUE MANAGEMENT
      // ========================================================================

      addToRetryQueue: (
        key: string, 
        request: () => Promise<any>, 
        maxRetries: number = CACHE_CONFIG.MAX_RETRIES
      ): void => {
        set(produce((draft) => {
          // Remove existing retry for this key
          draft.retryQueue = draft.retryQueue.filter(item => item.key !== key);
          
          // Add new retry
          draft.retryQueue.push({
            key,
            request,
            retries: 0,
            maxRetries,
          });
        }));
      },

      processRetryQueue: async (): Promise<void> => {
        const { retryQueue } = get();
        const itemsToRetry = [...retryQueue];
        
        for (const item of itemsToRetry) {
          try {
            const retryFn = createRetryFunction(
              item.request,
              item.maxRetries - item.retries,
              CACHE_CONFIG.RETRY_DELAY,
              CACHE_CONFIG.RETRY_BACKOFF
            );
            
            await retryFn();
            
            // Remove successful retry from queue
            set(produce((draft) => {
              draft.retryQueue = draft.retryQueue.filter(queueItem => queueItem.key !== item.key);
            }));
            
          } catch (error) {
            // Increment retry count
            set(produce((draft) => {
              const queueItem = draft.retryQueue.find(queueItem => queueItem.key === item.key);
              if (queueItem) {
                queueItem.retries++;
                
                // Remove if max retries reached
                if (queueItem.retries >= queueItem.maxRetries) {
                  draft.retryQueue = draft.retryQueue.filter(qi => qi.key !== item.key);
                  console.error(`Max retries reached for ${item.key}:`, error);
                }
              }
            }));
          }
        }
      },
    }),
    { name: 'api-cache-store' }
  )
);

// ============================================================================
// CACHE HELPERS
// ============================================================================

export const createApiCacheKey = (...parts: (string | number | boolean | object)[]): string => {
  return parts.map(part => {
    if (typeof part === 'object') {
      return JSON.stringify(part);
    }
    return String(part);
  }).join(':');
};

export const withCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  const { get: getCache, set: setCache, isPending, setPending } = useApiCacheStore.getState();
  
  // Check cache first
  const cached = getCache<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Check if request is already pending
  if (isPending(key)) {
    // Wait for pending request to complete
    return new Promise((resolve, reject) => {
      const checkPending = () => {
        if (!isPending(key)) {
          const result = getCache<T>(key);
          if (result !== null) {
            resolve(result);
          } else {
            reject(new Error('Pending request failed'));
          }
        } else {
          setTimeout(checkPending, 100);
        }
      };
      checkPending();
    });
  }
  
  // Mark as pending and fetch
  setPending(key, true);
  
  try {
    const result = await fetcher();
    setCache(key, result, ttl);
    return result;
  } catch (error) {
    // Add to retry queue for failed requests
    useApiCacheStore.getState().addToRetryQueue(key, fetcher);
    throw error;
  } finally {
    setPending(key, false);
  }
};

export const invalidateUserCache = (userId: string) => {
  const { invalidatePattern } = useApiCacheStore.getState();
  invalidatePattern(`user:${userId}:.*`);
};

export const invalidatePortfolioCache = (portfolioId?: string) => {
  const { invalidatePattern } = useApiCacheStore.getState();
  if (portfolioId) {
    invalidatePattern(`portfolio:${portfolioId}:.*`);
  } else {
    invalidatePattern(`portfolio:.*`);
  }
};

export const invalidateMarketDataCache = () => {
  const { invalidatePattern } = useApiCacheStore.getState();
  invalidatePattern(`market:.*`);
};

// ============================================================================
// CACHE CLEANUP
// ============================================================================

// Periodic cache cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

export const startCacheCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(() => {
    const { cache } = useApiCacheStore.getState();
    const now = Date.now();
    
    useApiCacheStore.setState(
      produce((draft) => {
        // Remove expired entries
        Object.keys(draft.cache).forEach(key => {
          const entry = draft.cache[key];
          if (now > entry.expiry) {
            delete draft.cache[key];
          }
        });
        
        // Process retry queue
        draft.retryQueue = draft.retryQueue.filter(item => {
          return item.retries < item.maxRetries;
        });
      })
    );
    
    // Process retry queue
    useApiCacheStore.getState().processRetryQueue();
  }, 60000); // Run every minute
};

export const stopCacheCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

// ============================================================================
// SELECTORS
// ============================================================================

export const apiCacheSelectors = {
  cache: (state: ApiCacheState & ApiCacheActions) => state.cache,
  pendingRequests: (state: ApiCacheState & ApiCacheActions) => state.pendingRequests,
  retryQueue: (state: ApiCacheState & ApiCacheActions) => state.retryQueue,
  cacheSize: (state: ApiCacheState & ApiCacheActions) => Object.keys(state.cache).length,
  pendingCount: (state: ApiCacheState & ApiCacheActions) => state.pendingRequests.size,
  retryCount: (state: ApiCacheState & ApiCacheActions) => state.retryQueue.length,
  cacheStats: (state: ApiCacheState & ApiCacheActions) => {
    const now = Date.now();
    const entries = Object.values(state.cache);
    
    return {
      total: entries.length,
      expired: entries.filter(entry => now > entry.expiry).length,
      stale: entries.filter(entry => entry.stale || isStale(entry)).length,
      fresh: entries.filter(entry => !entry.stale && !isStale(entry) && now <= entry.expiry).length,
    };
  },
};

// ============================================================================
// HOOKS
// ============================================================================

export const useApiCache = () => useApiCacheStore();
export const useCacheStats = () => useApiCacheStore(apiCacheSelectors.cacheStats);
export const usePendingRequests = () => useApiCacheStore(apiCacheSelectors.pendingRequests);
export const useRetryQueue = () => useApiCacheStore(apiCacheSelectors.retryQueue);