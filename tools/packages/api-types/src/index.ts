// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Investment Types
export interface Investment {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  type: InvestmentType;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum InvestmentType {
  STOCK = 'stock',
  ETF = 'etf',
  BOND = 'bond',
  CRYPTO = 'crypto',
  MUTUAL_FUND = 'mutual_fund'
}

export interface CreateInvestmentRequest {
  symbol: string;
  name: string;
  type: InvestmentType;
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
}

export interface UpdateInvestmentRequest {
  quantity?: number;
  purchasePrice?: number;
  currentPrice?: number;
}

// Portfolio Types
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  investments: Investment[];
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
}

// Market Data Types
export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  lastUpdated: Date;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  timestamp: Date;
}

// Educational Content Types
export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  category: ArticleCategory;
  tags: string[];
  publishedAt: Date;
  updatedAt: Date;
  readTime: number;
  difficulty: DifficultyLevel;
}

export enum ArticleCategory {
  BASICS = 'basics',
  STOCKS = 'stocks',
  BONDS = 'bonds',
  ETFS = 'etfs',
  CRYPTO = 'crypto',
  RETIREMENT = 'retirement',
  TAXES = 'taxes',
  STRATEGY = 'strategy'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

// Watchlist Types
export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWatchlistRequest {
  name: string;
  symbols?: string[];
}

export interface UpdateWatchlistRequest {
  name?: string;
  symbols?: string[];
}

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  portfolioId: string;
  investmentId: string;
  type: TransactionType;
  symbol: string;
  quantity: number;
  price: number;
  totalAmount: number;
  fees?: number;
  date: Date;
  createdAt: Date;
}

export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell',
  DIVIDEND = 'dividend'
}

export interface CreateTransactionRequest {
  portfolioId: string;
  investmentId: string;
  type: TransactionType;
  symbol: string;
  quantity: number;
  price: number;
  fees?: number;
  date: Date;
}

// Search Types
export interface SearchResult {
  symbol: string;
  name: string;
  type: InvestmentType;
  exchange?: string;
}

export interface SearchRequest {
  query: string;
  type?: InvestmentType;
  limit?: number;
}
