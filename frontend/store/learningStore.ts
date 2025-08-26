/**
 * Learning Store
 * Manages personalized learning path state and AI recommendations
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { produce } from 'immer';
import { createAsyncAction, createErrorHandler } from './utils';

// ============================================================================
// TYPES
// ============================================================================

export interface RiskProfile {
  id: number;
  name: string;
  description: string;
  minScore: number;
  maxScore: number;
}

export interface LearningContent {
  id: number;
  title: string;
  contentType: 'lesson' | 'quiz' | 'challenge' | 'article' | 'video';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedDurationMinutes: number;
  pointsValue: number;
  tags: string[];
  progressStatus?: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  progressPercentage?: number;
  completedAt?: string;
}

export interface LearningPath {
  id: number;
  name: string;
  description: string;
  difficultyLevel: string;
  estimatedDurationHours: number;
  overallProgress: number;
}

export interface UserLearningProfile {
  riskProfile: string;
  investmentGoals: string[];
  timeHorizon: string;
  learningStyle: string;
  preferredTopics: string[];
}

export interface AIRecommendation {
  learningPathId?: number;
  nextLessonId?: number;
  recommendedContent: LearningContent[];
  nudgeMessage: string;
  nudgeType: string;
  confidenceScore: number;
  reasoning: string;
  priorityScore: number;
}

export interface LearningStats {
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  currentStreak: number;
  totalPoints: number;
}

export interface LearningState {
  // Onboarding
  onboardingCompleted: boolean;
  onboardingStep: number;
  
  // User Profile
  userProfile: UserLearningProfile | null;
  
  // Learning Path
  currentPath: LearningPath | null;
  pathContent: LearningContent[];
  nextRecommended: LearningContent | null;
  
  // AI Recommendations
  aiRecommendations: AIRecommendation | null;
  lastNudgeTime: string | null;
  
  // Progress & Stats
  stats: LearningStats;
  
  // UI State
  isLoading: boolean;
  error: string | null;
}

export interface LearningActions {
  // Onboarding
  startOnboarding: () => void;
  completeOnboardingStep: (step: number) => void;
  submitOnboardingProfile: (profile: UserLearningProfile) => Promise<void>;
  
  // Learning Path
  fetchPersonalizedPath: () => Promise<void>;
  markLessonCompleted: (contentId: number, timeSpentMinutes?: number) => Promise<void>;
  markChallengeCompleted: (contentId: number, score?: number, timeSpentMinutes?: number) => Promise<void>;
  
  // AI Recommendations
  fetchAIRecommendations: () => Promise<void>;
  recordNudgeResponse: (nudgeId: number, response: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  resetLearningState: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: LearningState = {
  onboardingCompleted: false,
  onboardingStep: 0,
  userProfile: null,
  currentPath: null,
  pathContent: [],
  nextRecommended: null,
  aiRecommendations: null,
  lastNudgeTime: null,
  stats: {
    completedLessons: 0,
    totalLessons: 0,
    progressPercentage: 0,
    currentStreak: 0,
    totalPoints: 0
  },
  isLoading: false,
  error: null
};

// ============================================================================
// API HELPERS
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

async function aiApiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${AI_API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'AI service error' }));
    throw new Error(error.error || `AI HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useLearningStore = create<LearningState & LearningActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ========================================================================
        // ONBOARDING ACTIONS
        // ========================================================================

        startOnboarding: () => {
          set(produce((state) => {
            state.onboardingStep = 1;
            state.error = null;
          }));
        },

        completeOnboardingStep: (step: number) => {
          set(produce((state) => {
            state.onboardingStep = step + 1;
          }));
        },

        submitOnboardingProfile: createAsyncAction(
          'submitOnboardingProfile',
          async (profile: UserLearningProfile) => {
            // Calculate risk score based on profile (simplified logic)
            const riskScoreMap = {
              'conservative': 25,
              'moderate': 50,
              'aggressive': 75
            };
            const riskScore = riskScoreMap[profile.riskProfile as keyof typeof riskScoreMap] || 50;

            const response = await apiCall('/api/learning/onboarding-profile', {
              method: 'POST',
              body: JSON.stringify({
                riskProfileScore: riskScore,
                investmentGoals: profile.investmentGoals,
                timeHorizon: profile.timeHorizon,
                learningStyle: profile.learningStyle,
                preferredTopics: profile.preferredTopics
              }),
            });

            return { profile, currentLearningPathId: response.currentLearningPathId };
          },
          {
            onStart: () => set(produce((state) => {
              state.isLoading = true;
              state.error = null;
            })),
            onSuccess: (result) => set(produce((state) => {
              state.userProfile = result.profile;
              state.onboardingCompleted = true;
              state.onboardingStep = 0;
              state.isLoading = false;
            })),
            onError: (error) => set(produce((state) => {
              state.error = error.message;
              state.isLoading = false;
            }))
          }
        ),

        // ========================================================================
        // LEARNING PATH ACTIONS
        // ========================================================================

        fetchPersonalizedPath: createAsyncAction(
          'fetchPersonalizedPath',
          async () => {
            const response = await apiCall('/api/learning/personalized-path');
            return response;
          },
          {
            onStart: () => set(produce((state) => {
              state.isLoading = true;
              state.error = null;
            })),
            onSuccess: (data) => set(produce((state) => {
              state.currentPath = data.currentPath;
              state.pathContent = data.content;
              state.nextRecommended = data.nextRecommended;
              state.stats = data.stats;
              state.userProfile = data.profile;
              state.isLoading = false;
            })),
            onError: (error) => set(produce((state) => {
              state.error = error.message;
              state.isLoading = false;
            }))
          }
        ),

        markLessonCompleted: createAsyncAction(
          'markLessonCompleted',
          async (contentId: number, timeSpentMinutes = 0) => {
            const response = await apiCall('/api/learning/lesson-completed', {
              method: 'POST',
              body: JSON.stringify({ contentId, timeSpentMinutes }),
            });
            return { contentId, pointsAwarded: response.pointsAwarded };
          },
          {
            onStart: () => set(produce((state) => {
              state.isLoading = true;
              state.error = null;
            })),
            onSuccess: (result) => set(produce((state) => {
              // Update content status
              const contentIndex = state.pathContent.findIndex(c => c.id === result.contentId);
              if (contentIndex !== -1) {
                state.pathContent[contentIndex].progressStatus = 'completed';
                state.pathContent[contentIndex].progressPercentage = 100;
                state.pathContent[contentIndex].completedAt = new Date().toISOString();
              }
              
              // Update stats
              state.stats.completedLessons += 1;
              state.stats.totalPoints += result.pointsAwarded;
              state.stats.progressPercentage = Math.round(
                (state.stats.completedLessons / state.stats.totalLessons) * 100
              );
              
              state.isLoading = false;
            })),
            onError: (error) => set(produce((state) => {
              state.error = error.message;
              state.isLoading = false;
            }))
          }
        ),

        markChallengeCompleted: createAsyncAction(
          'markChallengeCompleted',
          async (contentId: number, score = 0, timeSpentMinutes = 0) => {
            const response = await apiCall('/api/learning/challenge-completed', {
              method: 'POST',
              body: JSON.stringify({ contentId, score, timeSpentMinutes }),
            });
            return { contentId, pointsAwarded: response.pointsAwarded, bonusPoints: response.bonusPoints };
          },
          {
            onStart: () => set(produce((state) => {
              state.isLoading = true;
              state.error = null;
            })),
            onSuccess: (result) => set(produce((state) => {
              // Update content status
              const contentIndex = state.pathContent.findIndex(c => c.id === result.contentId);
              if (contentIndex !== -1) {
                state.pathContent[contentIndex].progressStatus = 'completed';
                state.pathContent[contentIndex].progressPercentage = 100;
                state.pathContent[contentIndex].completedAt = new Date().toISOString();
              }
              
              // Update stats
              state.stats.completedLessons += 1;
              state.stats.totalPoints += result.pointsAwarded;
              state.stats.progressPercentage = Math.round(
                (state.stats.completedLessons / state.stats.totalLessons) * 100
              );
              
              state.isLoading = false;
            })),
            onError: (error) => set(produce((state) => {
              state.error = error.message;
              state.isLoading = false;
            }))
          }
        ),

        // ========================================================================
        // AI RECOMMENDATION ACTIONS
        // ========================================================================

        fetchAIRecommendations: createAsyncAction(
          'fetchAIRecommendations',
          async () => {
            // Get user ID from auth store (simplified)
            const userId = 'current-user-id'; // In real implementation, get from auth
            const response = await aiApiCall(`/nudge/recommend-path?user_id=${userId}`);
            return response;
          },
          {
            onStart: () => set(produce((state) => {
              state.error = null;
            })),
            onSuccess: (data) => set(produce((state) => {
              state.aiRecommendations = data;
              state.lastNudgeTime = new Date().toISOString();
            })),
            onError: (error) => set(produce((state) => {
              state.error = `AI recommendations unavailable: ${error.message}`;
            }))
          }
        ),

        recordNudgeResponse: createAsyncAction(
          'recordNudgeResponse',
          async (nudgeId: number, response: string) => {
            await apiCall('/api/learning/nudge-feedback', {
              method: 'POST',
              body: JSON.stringify({ nudgeId, response }),
            });
            return { nudgeId, response };
          },
          {
            onError: (error) => set(produce((state) => {
              state.error = error.message;
            }))
          }
        ),

        // ========================================================================
        // UTILITY ACTIONS
        // ========================================================================

        clearError: () => {
          set(produce((state) => {
            state.error = null;
          }));
        },

        setLoading: (loading: boolean) => {
          set(produce((state) => {
            state.isLoading = loading;
          }));
        },

        resetLearningState: () => {
          set(initialState);
        }
      }),
      {
        name: 'learning-store',
        version: 1,
        partialize: (state) => ({
          onboardingCompleted: state.onboardingCompleted,
          userProfile: state.userProfile,
          stats: state.stats,
          lastNudgeTime: state.lastNudgeTime
        })
      }
    ),
    { name: 'learning-store' }
  )
);

// ============================================================================
// SELECTORS & HOOKS
// ============================================================================

export const learningSelectors = {
  onboardingCompleted: (state: LearningState & LearningActions) => state.onboardingCompleted,
  onboardingStep: (state: LearningState & LearningActions) => state.onboardingStep,
  userProfile: (state: LearningState & LearningActions) => state.userProfile,
  currentPath: (state: LearningState & LearningActions) => state.currentPath,
  pathContent: (state: LearningState & LearningActions) => state.pathContent,
  nextRecommended: (state: LearningState & LearningActions) => state.nextRecommended,
  aiRecommendations: (state: LearningState & LearningActions) => state.aiRecommendations,
  stats: (state: LearningState & LearningActions) => state.stats,
  isLoading: (state: LearningState & LearningActions) => state.isLoading,
  error: (state: LearningState & LearningActions) => state.error,
};

// Convenience hooks
export const useOnboardingCompleted = () => useLearningStore(learningSelectors.onboardingCompleted);
export const useOnboardingStep = () => useLearningStore(learningSelectors.onboardingStep);
export const useUserLearningProfile = () => useLearningStore(learningSelectors.userProfile);
export const useCurrentLearningPath = () => useLearningStore(learningSelectors.currentPath);
export const useLearningContent = () => useLearningStore(learningSelectors.pathContent);
export const useNextRecommended = () => useLearningStore(learningSelectors.nextRecommended);
export const useAIRecommendations = () => useLearningStore(learningSelectors.aiRecommendations);
export const useLearningStats = () => useLearningStore(learningSelectors.stats);
export const useLearningLoading = () => useLearningStore(learningSelectors.isLoading);
export const useLearningError = () => useLearningStore(learningSelectors.error);