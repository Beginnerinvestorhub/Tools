// apps/web/src/store/riskAssessmentStore.ts
import { create } from 'zustand';
import { RiskAssessmentQuestion, RiskProfile } from '@beginner-investor-hub/api-types';
import { apiClient } from '../lib/apiClient';

interface RiskAssessmentState {
  questions: RiskAssessmentQuestion[];
  answers: { [key: string]: number };
  riskProfile: RiskProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchQuestions: () => Promise<void>;
  handleAnswerChange: (questionId: string, score: number) => void;
  calculateRiskProfile: () => Promise<void>;
  resetAssessment: () => void;
}

export const useRiskAssessmentStore = create<RiskAssessmentState>((set, get) => ({
  questions: [],
  answers: {},
  riskProfile: null,
  isLoading: false,
  error: null,

  fetchQuestions: async () => {
    set({ isLoading: true, error: null });
    try {
      const questions = await apiClient.get<RiskAssessmentQuestion[]>('/risk/questions');
      set({ questions, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Error fetching risk questions:', errorMessage);
      set({ error: 'Could not load assessment questions. Please try refreshing.', isLoading: false });
    }
  },

  handleAnswerChange: (questionId, score) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: score },
      riskProfile: null, // Reset profile on answer change
    }));
  },

  calculateRiskProfile: async () => {
    const { answers } = get();
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.post<RiskProfile>('/risk/calculate', { answers });
      set({ riskProfile: result, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Error calculating risk profile:', errorMessage);
      set({ error: `Calculation Error: ${errorMessage}`, isLoading: false });
    }
  },

  resetAssessment: () => {
    set({
      answers: {},
      riskProfile: null,
      error: null,
      isLoading: false,
    });
  },
}));