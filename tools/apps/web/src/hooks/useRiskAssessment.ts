// apps/web/src/hooks/useRiskAssessment.ts
import { useState, useCallback, useMemo, useEffect } from 'react';

// Define types for risk assessment questions and profile
// These types should ideally come from your 'packages/api-types' or 'apps/web/src/types'
// For now, we'll define them inline for simplicity.

/**
 * Represents a single risk assessment question.
 */
interface RiskAssessmentQuestion {
  id: string;
  question: string;
  options: { value: string | number; label: string; score: number }[];
}

/**
 * Represents a user's calculated risk profile.
 */
interface RiskProfile {
  score: number;
  level: 'Conservative' | 'Moderate' | 'Aggressive' | 'Very Aggressive';
  description: string;
}

/**
 * Custom hook for managing risk assessment logic.
 * @returns An object containing risk assessment state, questions, and functions to interact with them.
 */
const useRiskAssessment = () => {
  const [questions, setQuestions] = useState<RiskAssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({}); // Stores selected option scores
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading to fetch questions
  const [error, setError] = useState<string | null>(null);

  // Fetch questions from the backend on initial mount, as per architecture
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // This endpoint will need to be created in the backend API
        const response = await fetch('/api/risk/questions');
        if (!response.ok) throw new Error('Failed to fetch questions.');
        const data: RiskAssessmentQuestion[] = await response.json();
        setQuestions(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error('Error fetching risk questions:', errorMessage);
        setError('Could not load assessment questions. Please try refreshing.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  /**
   * Updates the answer for a specific question.
   * @param questionId The ID of the question.
   * @param score The score of the selected option.
   */
  const handleAnswerChange = useCallback((questionId: string, score: number) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: score,
    }));
    // Reset risk profile if answers change, so it can be recalculated
    setRiskProfile(null);
  }, []);

  /**
   * Calculates the risk profile based on current answers.
   * In a real application, this would involve an API call to a backend service.
   */
  const calculateRiskProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // As per the architecture, the frontend calls the backend, which orchestrates the Python engine.
      // This API endpoint will need to be created in the backend.
      const response = await fetch('/api/risk/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Calculation failed.' }));
        throw new Error(errorData.message || 'Failed to calculate risk profile.');
      }

      const result: RiskProfile = await response.json();
      setRiskProfile(result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Error calculating risk profile:', errorMessage);
      setError(`Calculation Error: ${errorMessage}`);
      setRiskProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [answers]);

  // Optional: Function to clear the assessment
  const resetAssessment = useCallback(() => {
    setAnswers({});
    setRiskProfile(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Check if all questions have been answered
  const allQuestionsAnswered = useMemo(() => {
    return questions.every(q => Object.keys(answers).includes(q.id));
  }, [questions, answers]);


  return {
    questions,
    answers,
    riskProfile,
    isLoading,
    error,
    handleAnswerChange,
    calculateRiskProfile,
    resetAssessment,
    allQuestionsAnswered,
  };
};

export default useRiskAssessment;
