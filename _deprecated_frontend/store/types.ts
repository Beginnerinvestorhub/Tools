/**
 * Global State Management Types
 * Comprehensive TypeScript definitions for Zustand stores
 */

import { User } from 'firebase/auth';

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role: 'user' | 'admin' | 'premium';
  createdAt: string;
  lastLoginAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    dataSharing: boolean;
  };
  trading: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    investmentGoals: string[];
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface AuthState {
  user: AuthUser | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpiry: number | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, userData: Partial<AuthUser>) => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// ============================================================================
// PORTFOLIO TYPES
// ============================================================================

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  sector: string;
  lastUpdated: string;
}

export interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdings: Holding[];
  cash: number;
  lastUpdated: string;
  performance: PortfolioPerformance;
}

export interface PortfolioPerformance {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  allTime: number;
  chartData: {
    labels: string[];
    values: number[];
  };
}

export interface PortfolioState {
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
  lastSync: number | null;
}

export interface PortfolioActions {
  fetchPortfolios: () => Promise<void>;
  setActivePortfolio: (portfolioId: string) => void;
  updateHolding: (portfolioId: string, holding: Partial<Holding>) => Promise<void>;
  addHolding: (portfolioId: string, holding: Omit<Holding, 'id'>) => Promise<void>;
  removeHolding: (portfolioId: string, holdingId: string) => Promise<void>;
  syncPrices: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface Modal {
  id: string;
  component: string;
  props?: Record<string, any>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  timestamp: number;
}

export interface LoadingState {
  global: boolean;
  auth: boolean;
  portfolio: boolean;
  api: Record<string, boolean>;
}

export interface UIState {
  modals: Modal[];
  notifications: Notification[];
  loading: LoadingState;
  sidebar: {
    isOpen: boolean;
    activeSection: string | null;
  };
  theme: 'light' | 'dark' | 'system';
  layout: {
    headerHeight: number;
    sidebarWidth: number;
    contentPadding: number;
  };
}

export interface UIActions {
  // Modal management
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  
  // Notification management
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  dismissNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  
  // Loading state management
  setLoading: (key: keyof LoadingState | string, loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  
  // Sidebar management
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveSection: (section: string | null) => void;
  
  // Theme management
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Layout management
  updateLayout: (layout: Partial<UIState['layout']>) => void;
}

// ============================================================================
// API CACHE TYPES
// ============================================================================

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
  stale: boolean;
}

export interface ApiCacheState {
  cache: Record<string, CacheEntry>;
  pendingRequests: Set<string>;
  retryQueue: Array<{
    key: string;
    request: () => Promise<any>;
    retries: number;
    maxRetries: number;
  }>;
}

export interface ApiCacheActions {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttl?: number) => void;
  invalidate: (key: string) => void;
  invalidatePattern: (pattern: string) => void;
  clear: () => void;
  isPending: (key: string) => boolean;
  setPending: (key: string, pending: boolean) => void;
  addToRetryQueue: (key: string, request: () => Promise<any>, maxRetries?: number) => void;
  processRetryQueue: () => Promise<void>;
}

// ============================================================================
// GAMIFICATION TYPES
// ============================================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt: string | null;
  progress: number;
  maxProgress: number;
  category: 'trading' | 'learning' | 'social' | 'milestone';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  points: number;
  startDate: string;
  endDate: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  rewards: string[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string | null;
  points: number;
  rank: number;
  badges: string[];
}

export interface GamificationState {
  userPoints: number;
  userLevel: number;
  userRank: number;
  achievements: Achievement[];
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
  streaks: {
    daily: number;
    weekly: number;
    longest: number;
  };
  isLoading: boolean;
  error: string | null;
}

export interface GamificationActions {
  fetchUserStats: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchChallenges: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  completeChallenge: (challengeId: string) => Promise<void>;
  claimAchievement: (achievementId: string) => Promise<void>;
  updateStreak: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// COMBINED STORE TYPE
// ============================================================================

export interface RootState {
  auth: AuthState & AuthActions;
  portfolio: PortfolioState & PortfolioActions;
  ui: UIState & UIActions;
  apiCache: ApiCacheState & ApiCacheActions;
  gamification: GamificationState & GamificationActions;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type StoreSlice<T> = (
  set: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void,
  get: () => T
) => T;

export interface StoreOptions {
  persist?: boolean;
  devtools?: boolean;
  name?: string;
}

export interface OptimisticUpdate<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  rollback: () => void;
  timestamp: number;
}
