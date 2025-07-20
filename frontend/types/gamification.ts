// Gamification system types and interfaces

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  points: number;
  rarity: BadgeRarity;
  unlockedAt?: Date;
  isUnlocked: boolean;
}

export enum BadgeCategory {
  EDUCATION = 'education',
  INVESTMENT = 'investment',
  ENGAGEMENT = 'engagement',
  SOCIAL = 'social',
  MILESTONE = 'milestone'
}

export enum BadgeRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface UserProgress {
  userId: string;
  totalPoints: number;
  level: number;
  experiencePoints: number;
  experienceToNextLevel: number;
  badges: Badge[];
  streaks: {
    loginStreak: number;
    learningStreak: number;
    lastLoginDate?: Date;
    lastLearningDate?: Date;
  };
  achievements: Achievement[];
  stats: UserStats;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  progress: number;
  target: number;
  isCompleted: boolean;
  completedAt?: Date;
  reward: {
    points: number;
    badge?: string;
  };
}

export enum AchievementType {
  FIRST_RISK_ASSESSMENT = 'first_risk_assessment',
  PORTFOLIO_CREATED = 'portfolio_created',
  TOOLS_MASTERY = 'tools_mastery',
  LEARNING_STREAK = 'learning_streak',
  LOGIN_STREAK = 'login_streak',
  ESG_SCREENING = 'esg_screening',
  DIVERSIFICATION = 'diversification',
  KNOWLEDGE_LEVEL = 'knowledge_level'
}

export interface UserStats {
  toolsUsed: string[];
  assessmentsCompleted: number;
  portfoliosCreated: number;
  educationModulesCompleted: number;
  totalTimeSpent: number; // in minutes
  averageSessionTime: number; // in minutes
  favoriteTools: string[];
}

export interface GamificationEvent {
  type: string;
  userId: string;
  data: any;
  timestamp: Date;
  pointsAwarded?: number;
  badgeUnlocked?: string;
  achievementCompleted?: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  level: number;
  badges: number;
  rank: number;
  avatar?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  participants: number;
  rewards: {
    points: number;
    badge?: string;
  };
  requirements: ChallengeRequirement[];
}

export enum ChallengeType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal',
  SPECIAL = 'special'
}

export interface ChallengeRequirement {
  type: string;
  target: number;
  description: string;
}
