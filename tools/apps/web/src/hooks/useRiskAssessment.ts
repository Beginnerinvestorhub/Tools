// apps/web/src/hooks/useRiskAssessment.ts
import { useState, useCallback, useMemo } from 'react';

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

// Example risk assessment questions
const EXAMPLE_QUESTIONS: RiskAssessmentQuestion[] = [
  {
    id: 'q1',
    question: 'What is your primary investment goal?',
    options: [
      { value: 'preservation', label: 'Capital Preservation', score: 1 },
      { value: 'income', label: 'Generating Income', score: 2 },
      { value: 'growth', label: 'Long-term Growth', score: 3 },
      { value: 'speculation', label: 'Aggressive Growth/Speculation', score: 4 },
    ],
  },
  {
    id: 'q2',
    question: 'What is your investment time horizon?',
    options: [
      { value: 'short', label: 'Less than 1 year', score: 1 },
      { value: 'medium', label: '1-5 years', score: 2 },
      { value: 'long', label: '5-10 years', score: 3 },
      { value: 'very_long', label: 'More than 10 years', score: 4 },
    ],
  },
  {
    id: 'q3',
    question: 'How would you react to a 20% drop in your portfolio value?',
    options: [
      { value: 'panic', label: 'Panic and sell everything', score: 1 },
      { value: 'worry', label: 'Feel worried, but hold', score: 2 },
      { value: 'opportunity', label: 'See it as a buying opportunity', score: 3 },
      { value: 'unconcerned', label: 'Largely unconcerned, focus on long-term', score: 4 },
    ],
  },
  // Add more questions as needed
];

/**
 * Custom hook for managing risk assessment logic.
 * @returns An object containing risk assessment state, questions, and functions to interact with them.
 */
const useRiskAssessment = () => {
  const [answers, setAnswers] = useState<{ [key: string]: number }>({}); // Stores selected option scores
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo(() => EXAMPLE_QUESTIONS, []);

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
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);

      // Simple mapping logic for demonstration.
      // In a real app, this logic would likely be on the backend (risk-calculation-engine/risk_assessment_engine.py)
      let level: RiskProfile['level'];
      let description: string;

      if (totalScore <= 5) {
        level = 'Conservative';
        description = 'You prioritize capital preservation and are comfortable with lower returns for minimal risk.';
      } else if (totalScore <= 9) {
        level = 'Moderate';
        description = 'You seek a balance between growth and capital preservation, comfortable with some market fluctuations.';
      } else if (totalScore <= 13) {
        level = 'Aggressive';
        description = 'You are willing to take on significant risk for potentially higher returns, comfortable with market volatility.';
      } else {
        level = 'Very Aggressive';
        description = 'You are highly comfortable with risk and seek maximum growth, even at the expense of significant volatility.';
      }

      setRiskProfile({
        score: totalScore,
        level,
        description,
      });
    } catch (err) {
      console.error('Error calculating risk profile:', err);
      setError('Failed to calculate risk profile. Please try again.');
      setRiskProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [answers]); // Recalculate only if answers change

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

