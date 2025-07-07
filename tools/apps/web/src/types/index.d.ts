// apps/web/src/types/index.d.ts

// =============================================================================
// API and Data Models
// These types should ideally mirror your backend API responses.
// In a monorepo setup, consider also sharing these from a 'packages/api-types'
// if they are truly universal across frontend/backend.
// =============================================================================

/**
 * Represents a user's risk profile, often calculated by the backend.
 */
export interface RiskProfile {
  score: number;
  level: 'Conservative' | 'Moderate' | 'Aggressive' | 'Very Aggressive';
  description: string;
  // Add other relevant fields like recommended asset allocation, etc.
  recommendedAllocation?: {
    stocks: number; // percentage
    bonds: number;  // percentage
    cash: number;   // percentage
  };
}

/**
 * Represents a single question in the risk assessment questionnaire.
 */
export interface RiskAssessmentQuestion {
  id: string;
  question: string;
  options: { value: string | number; label: string; score: number }[];
  type: 'single-choice' | 'multi-choice' | 'number-input'; // Example of different question types
  // Add more properties if needed, e.g., validation rules
}

/**
 * Represents the input answers for a risk assessment submission.
 * Keys are question IDs, values are the selected option scores or input values.
 */
export interface RiskAssessmentAnswers {
  [questionId: string]: number | string | (number | string)[]; // Can be single score, text, or array of selected values
}

/**
 * Basic User Interface for authentication.
 * This might be extended with more user details (e.g., name, email, roles).
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  // Add any other user-specific properties from your authentication system
}

// =============================================================================
// General UI/Component Types
// =============================================================================

// Example: Generic props for a component that needs children
export interface ChildrenProps {
  children: React.ReactNode;
}

// Example: A common state for loading/error
export interface AsyncState {
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// Utility Types (if not in utils.ts or specific to types)
// =============================================================================

// You might put some specific utility types here that aren't functions.
// For example:
// type ValueOf<T> = T[keyof T];
// type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]>; };


