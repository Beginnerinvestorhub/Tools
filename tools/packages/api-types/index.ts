// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PREMIUM = 'premium'
}

// Risk Assessment Types
export interface RiskProfile {
  id: string;
  userId: string;
  riskTolerance: RiskTolerance;
  investmentHorizon: number; // years
  financialGoals: string[];
  monthlyIncome: number;
  currentSavings: number;
  riskScore: number; // 1-10
  createdAt: Date;
  updatedAt: Date;
}

export enum RiskTolerance {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive'
}

// Market Data Types
export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  timestamp: Date;
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketData: MarketData;
  fundamentals?: StockFundamentals;
}

export interface StockFundamentals {
  pe: number;
  pb: number;
  roe: number;
  dividendYield: number;
  eps: number;
}

// Portfolio Types
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  totalValue: number;
  holdings: Holding[];
  riskScore: number;
  performance: PortfolioPerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface Holding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  weight: number; // percentage of portfolio
  gainLoss: number;
  gainLossPercent: number;
}

export interface PortfolioPerformance {
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  volatility: number;
  sharpeRatio: number;
}

// Recommendation Types
export interface Recommendation {
  id: string;
  userId: string;
  type: RecommendationType;
  symbol: string;
  action: RecommendationAction;
  confidence: number; // 0-1
  reasoning: string;
  targetPrice?: number;
  riskLevel: RiskTolerance;
  createdAt: Date;
  expiresAt: Date;
}

export enum RecommendationType {
  BUY = 'buy',
  SELL = 'sell',
  HOLD = 'hold',
  REBALANCE = 'rebalance'
}

export enum RecommendationAction {
  STRONG_BUY = 'strong_buy',
  BUY = 'buy',
  HOLD = 'hold',
  SELL = 'sell',
  STRONG_SELL = 'strong_sell'
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// API Request/Response Types
export interface GetPortfolioRequest {
  userId: string;
}

export interface CreatePortfolioRequest {
  name: string;
  initialHoldings?: Holding[];
}

export interface UpdateRiskProfileRequest {
  riskTolerance: RiskTolerance;
  investmentHorizon: number;
  financialGoals: string[];
  monthlyIncome: number;
  currentSavings: number;
}

export interface GetRecommendationsRequest {
  userId: string;
  riskTolerance?: RiskTolerance;
  limit?: number;
}

export interface MarketDataRequest {
  symbols: string[];
  period?: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y';
}

// Utility Types
export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}