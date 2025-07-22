/**
 * Portfolio Store
 * Comprehensive portfolio and investment state management
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { 
  PortfolioState, 
  PortfolioActions, 
  Portfolio, 
  Holding, 
  PortfolioPerformance 
} from './types';
import { 
  createAsyncAction, 
  createErrorHandler, 
  immerSet,
  createPersistConfig,
  createCacheKey,
  createOptimisticUpdate,
  applyOptimisticUpdate
} from './utils';
import { useAuthStore } from './authStore';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: PortfolioState = {
  portfolios: [],
  activePortfolio: null,
  isLoading: false,
  error: null,
  lastSync: null,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const portfolioApi = {
  async fetchPortfolios(): Promise<Portfolio[]> {
    const token = await useAuthStore.getState().firebaseUser?.getIdToken();
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch portfolios');
    }
    
    const data = await response.json();
    return data.portfolios || [];
  },

  async updateHolding(portfolioId: string, holdingId: string, updates: Partial<Holding>): Promise<Holding> {
    const token = await useAuthStore.getState().firebaseUser?.getIdToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/portfolio/${portfolioId}/holdings/${holdingId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to update holding');
    }
    
    return response.json();
  },

  async addHolding(portfolioId: string, holding: Omit<Holding, 'id'>): Promise<Holding> {
    const token = await useAuthStore.getState().firebaseUser?.getIdToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/portfolio/${portfolioId}/holdings`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(holding),
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to add holding');
    }
    
    return response.json();
  },

  async removeHolding(portfolioId: string, holdingId: string): Promise<void> {
    const token = await useAuthStore.getState().firebaseUser?.getIdToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/portfolio/${portfolioId}/holdings/${holdingId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to remove holding');
    }
  },

  async syncPrices(): Promise<{ updated: number; timestamp: number }> {
    const token = await useAuthStore.getState().firebaseUser?.getIdToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/portfolio/sync-prices`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to sync prices');
    }
    
    return response.json();
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculatePortfolioMetrics = (portfolio: Portfolio): Portfolio => {
  const totalValue = portfolio.holdings.reduce((sum, holding) => sum + holding.marketValue, 0) + portfolio.cash;
  const totalGainLoss = portfolio.holdings.reduce((sum, holding) => sum + holding.gainLoss, 0);
  const totalGainLossPercent = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;

  return {
    ...portfolio,
    totalValue,
    totalGainLoss,
    totalGainLossPercent,
    lastUpdated: new Date().toISOString(),
  };
};

const updateHoldingMetrics = (holding: Holding): Holding => {
  const marketValue = holding.quantity * holding.currentPrice;
  const gainLoss = marketValue - (holding.quantity * holding.averagePrice);
  const gainLossPercent = holding.averagePrice > 0 ? (gainLoss / (holding.quantity * holding.averagePrice)) * 100 : 0;

  return {
    ...holding,
    marketValue,
    gainLoss,
    gainLossPercent,
    lastUpdated: new Date().toISOString(),
  };
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const usePortfolioStore = create<PortfolioState & PortfolioActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ========================================================================
        // PORTFOLIO ACTIONS
        // ========================================================================

        fetchPortfolios: createAsyncAction(
          'fetchPortfolios',
          async () => {
            const portfolios = await portfolioApi.fetchPortfolios();
            const calculatedPortfolios = portfolios.map(calculatePortfolioMetrics);
            
            set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              draft.portfolios = calculatedPortfolios;
              draft.lastSync = Date.now();
              draft.error = null;
              
              // Set active portfolio if none is set
              if (!draft.activePortfolio && calculatedPortfolios.length > 0) {
                draft.activePortfolio = calculatedPortfolios[0];
              }
            }));

            return calculatedPortfolios;
          },
          {
            onStart: () => set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              draft.isLoading = true;
              draft.error = null;
            })),
            onFinally: () => set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              draft.isLoading = false;
            })),
            onError: (error) => set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              draft.error = createErrorHandler('Fetch Portfolios')(error);
            })),
          }
        ),

        setActivePortfolio: (portfolioId: string) => {
          set(immerSet<PortfolioState & PortfolioActions>((draft) => {
            const portfolio = draft.portfolios.find(p => p.id === portfolioId);
            if (portfolio) {
              draft.activePortfolio = portfolio;
            }
          }));
        },

        // ========================================================================
        // HOLDING ACTIONS
        // ========================================================================

        updateHolding: createAsyncAction(
          'updateHolding',
          async (portfolioId: string, holdingUpdates: Partial<Holding>) => {
            const { portfolios } = get();
            const portfolio = portfolios.find(p => p.id === portfolioId);
            const holding = portfolio?.holdings.find(h => h.id === holdingUpdates.id);
            
            if (!portfolio || !holding) {
              throw new Error('Portfolio or holding not found');
            }

            // Apply optimistic update
            const optimisticUpdate = createOptimisticUpdate(
              holding.id,
              'update',
              { ...holding, ...holdingUpdates },
              () => {
                // Rollback function
                set(immerSet<PortfolioState & PortfolioActions>((draft) => {
                  const targetPortfolio = draft.portfolios.find(p => p.id === portfolioId);
                  if (targetPortfolio) {
                    const holdingIndex = targetPortfolio.holdings.findIndex(h => h.id === holding.id);
                    if (holdingIndex !== -1) {
                      targetPortfolio.holdings[holdingIndex] = holding;
                    }
                  }
                }));
              }
            );

            // Apply optimistic update to UI
            set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              const targetPortfolio = draft.portfolios.find(p => p.id === portfolioId);
              if (targetPortfolio) {
                const holdingIndex = targetPortfolio.holdings.findIndex(h => h.id === holding.id);
                if (holdingIndex !== -1) {
                  const updatedHolding = updateHoldingMetrics({
                    ...holding,
                    ...holdingUpdates,
                  });
                  targetPortfolio.holdings[holdingIndex] = updatedHolding;
                  
                  // Recalculate portfolio metrics
                  const updatedPortfolio = calculatePortfolioMetrics(targetPortfolio);
                  Object.assign(targetPortfolio, updatedPortfolio);
                  
                  // Update active portfolio if it's the same
                  if (draft.activePortfolio?.id === portfolioId) {
                    draft.activePortfolio = updatedPortfolio;
                  }
                }
              }
            }));

            try {
              // Make API call
              const updatedHolding = await portfolioApi.updateHolding(portfolioId, holding.id, holdingUpdates);
              
              // Update with server response
              set(immerSet<PortfolioState & PortfolioActions>((draft) => {
                const targetPortfolio = draft.portfolios.find(p => p.id === portfolioId);
                if (targetPortfolio) {
                  const holdingIndex = targetPortfolio.holdings.findIndex(h => h.id === holding.id);
                  if (holdingIndex !== -1) {
                    targetPortfolio.holdings[holdingIndex] = updateHoldingMetrics(updatedHolding);
                    
                    // Recalculate portfolio metrics
                    const recalculatedPortfolio = calculatePortfolioMetrics(targetPortfolio);
                    Object.assign(targetPortfolio, recalculatedPortfolio);
                    
                    // Update active portfolio if it's the same
                    if (draft.activePortfolio?.id === portfolioId) {
                      draft.activePortfolio = recalculatedPortfolio;
                    }
                  }
                }
              }));

              return updatedHolding;
            } catch (error) {
              // Rollback optimistic update
              optimisticUpdate.rollback();
              throw error;
            }
          },
          {
            onError: (error) => set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              draft.error = createErrorHandler('Update Holding')(error);
            })),
          }
        ),

        addHolding: createAsyncAction(
          'addHolding',
          async (portfolioId: string, holdingData: Omit<Holding, 'id'>) => {
            const { portfolios } = get();
            const portfolio = portfolios.find(p => p.id === portfolioId);
            
            if (!portfolio) {
              throw new Error('Portfolio not found');
            }

            // Create temporary holding for optimistic update
            const tempHolding: Holding = {
              ...holdingData,
              id: `temp-${Date.now()}`,
              lastUpdated: new Date().toISOString(),
            };

            const updatedTempHolding = updateHoldingMetrics(tempHolding);

            // Apply optimistic update
            set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              const targetPortfolio = draft.portfolios.find(p => p.id === portfolioId);
              if (targetPortfolio) {
                targetPortfolio.holdings.push(updatedTempHolding);
                
                // Recalculate portfolio metrics
                const updatedPortfolio = calculatePortfolioMetrics(targetPortfolio);
                Object.assign(targetPortfolio, updatedPortfolio);
                
                // Update active portfolio if it's the same
                if (draft.activePortfolio?.id === portfolioId) {
                  draft.activePortfolio = updatedPortfolio;
                }
              }
            }));

            try {
              // Make API call
              const newHolding = await portfolioApi.addHolding(portfolioId, holdingData);
              
              // Replace temporary holding with real one
              set(immerSet<PortfolioState & PortfolioActions>((draft) => {
                const targetPortfolio = draft.portfolios.find(p => p.id === portfolioId);
                if (targetPortfolio) {
                  const tempIndex = targetPortfolio.holdings.findIndex(h => h.id === tempHolding.id);
                  if (tempIndex !== -1) {
                    targetPortfolio.holdings[tempIndex] = updateHoldingMetrics(newHolding);
                    
                    // Recalculate portfolio metrics
                    const recalculatedPortfolio = calculatePortfolioMetrics(targetPortfolio);
                    Object.assign(targetPortfolio, recalculatedPortfolio);
                    
                    // Update active portfolio if it's the same
                    if (draft.activePortfolio?.id === portfolioId) {
                      draft.activePortfolio = recalculatedPortfolio;
                    }
                  }
                }
              }));

              return newHolding;
            } catch (error) {
              // Remove temporary holding on error
              set(immerSet<PortfolioState & PortfolioActions>((draft) => {
                const targetPortfolio = draft.portfolios.find(p => p.id === portfolioId);
                if (targetPortfolio) {
                  targetPortfolio.holdings = targetPortfolio.holdings.filter(h => h.id !== tempHolding.id);
                  
                  // Recalculate portfolio metrics
                  const recalculatedPortfolio = calculatePortfolioMetrics(targetPortfolio);
                  Object.assign(targetPortfolio, recalculatedPortfolio);
                  
                  // Update active portfolio if it's the same
                  if (draft.activePortfolio?.id === portfolioId) {
                    draft.activePortfolio = recalculatedPortfolio;
                  }
                }
              }));
              throw error;
            }
          },
          {
            onError: (error) => set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              draft.error = createErrorHandler('Add Holding')(error);
            })),
          }
        ),

        removeHolding: createAsyncAction(
          'removeHolding',
          async (portfolioId: string, holdingId: string) => {
            const { portfolios } = get();
            const portfolio = portfolios.find(p => p.id === portfolioId);
            const holding = portfolio?.holdings.find(h => h.id === holdingId);
            
            if (!portfolio || !holding) {
              throw new Error('Portfolio or holding not found');
            }

            // Apply optimistic update (remove holding)
            set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              const targetPortfolio = draft.portfolios.find(p => p.id === portfolioId);
              if (targetPortfolio) {
                targetPortfolio.holdings = targetPortfolio.holdings.filter(h => h.id !== holdingId);
                
                // Recalculate portfolio metrics
                const updatedPortfolio = calculatePortfolioMetrics(targetPortfolio);
                Object.assign(targetPortfolio, updatedPortfolio);
                
                // Update active portfolio if it's the same
                if (draft.activePortfolio?.id === portfolioId) {
                  draft.activePortfolio = updatedPortfolio;
                }
              }
            }));

            try {
              // Make API call
              await portfolioApi.removeHolding(portfolioId, holdingId);
            } catch (error) {
              // Rollback optimistic update (add holding back)
              set(immerSet<PortfolioState & PortfolioActions>((draft) => {
                const targetPortfolio = draft.portfolios.find(p => p.id === portfolioId);
                if (targetPortfolio) {
                  targetPortfolio.holdings.push(holding);
                  
                  // Recalculate portfolio metrics
                  const recalculatedPortfolio = calculatePortfolioMetrics(targetPortfolio);
                  Object.assign(targetPortfolio, recalculatedPortfolio);
                  
                  // Update active portfolio if it's the same
                  if (draft.activePortfolio?.id === portfolioId) {
                    draft.activePortfolio = recalculatedPortfolio;
                  }
                }
              }));
              throw error;
            }
          },
          {
            onError: (error) => set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              draft.error = createErrorHandler('Remove Holding')(error);
            })),
          }
        ),

        // ========================================================================
        // SYNC ACTIONS
        // ========================================================================

        syncPrices: createAsyncAction(
          'syncPrices',
          async () => {
            const result = await portfolioApi.syncPrices();
            
            // Refresh portfolios after sync
            await get().fetchPortfolios();
            
            set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              draft.lastSync = result.timestamp;
            }));

            return result;
          },
          {
            onError: (error) => set(immerSet<PortfolioState & PortfolioActions>((draft) => {
              draft.error = createErrorHandler('Sync Prices')(error);
            })),
          }
        ),

        // ========================================================================
        // UTILITY ACTIONS
        // ========================================================================

        clearError: () => set(immerSet<PortfolioState & PortfolioActions>((draft) => {
          draft.error = null;
        })),
      }),
      createPersistConfig('portfolio-store', 1)
    ),
    { name: 'portfolio-store' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const portfolioSelectors = {
  portfolios: (state: PortfolioState & PortfolioActions) => state.portfolios,
  activePortfolio: (state: PortfolioState & PortfolioActions) => state.activePortfolio,
  isLoading: (state: PortfolioState & PortfolioActions) => state.isLoading,
  error: (state: PortfolioState & PortfolioActions) => state.error,
  lastSync: (state: PortfolioState & PortfolioActions) => state.lastSync,
  totalValue: (state: PortfolioState & PortfolioActions) => 
    state.portfolios.reduce((sum, portfolio) => sum + portfolio.totalValue, 0),
  totalGainLoss: (state: PortfolioState & PortfolioActions) => 
    state.portfolios.reduce((sum, portfolio) => sum + portfolio.totalGainLoss, 0),
  holdingsBySymbol: (state: PortfolioState & PortfolioActions, symbol: string) =>
    state.portfolios.flatMap(p => p.holdings).filter(h => h.symbol === symbol),
  portfolioById: (state: PortfolioState & PortfolioActions, id: string) =>
    state.portfolios.find(p => p.id === id),
};

// ============================================================================
// HOOKS
// ============================================================================

export const usePortfolio = () => usePortfolioStore();
export const usePortfolios = () => usePortfolioStore(portfolioSelectors.portfolios);
export const useActivePortfolio = () => usePortfolioStore(portfolioSelectors.activePortfolio);
export const usePortfolioLoading = () => usePortfolioStore(portfolioSelectors.isLoading);
export const usePortfolioError = () => usePortfolioStore(portfolioSelectors.error);
export const useTotalPortfolioValue = () => usePortfolioStore(portfolioSelectors.totalValue);
export const useTotalGainLoss = () => usePortfolioStore(portfolioSelectors.totalGainLoss);
