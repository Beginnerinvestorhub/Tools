import { z } from 'zod';

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 18;
  }, 'Must be at least 18 years old'),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Risk assessment validation
export const riskAssessmentSchema = z.object({
  age: z.number().min(18).max(100),
  income: z.number().min(0),
  investmentExperience: z.enum(['beginner', 'intermediate', 'advanced']),
  riskTolerance: z.number().min(1).max(10),
  investmentGoals: z.array(z.string()),
  timeHorizon: z.enum(['short', 'medium', 'long']),
  liquidityNeeds: z.enum(['low', 'medium', 'high']),
});

// Portfolio simulation validation
export const portfolioSimulationSchema = z.object({
  initialAmount: z.number().min(1, 'Initial amount must be positive'),
  timeframe: z.number().min(1).max(50, 'Timeframe must be between 1-50 years'),
  riskLevel: z.number().min(0).max(1),
  allocations: z.record(z.string(), z.number().min(0).max(1)),
  rebalanceFrequency: z.enum(['monthly', 'quarterly', 'annually']),
});

// Investment goal validation
export const investmentGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  targetAmount: z.number().min(1, 'Target amount must be positive'),
  targetDate: z.string().refine((date) => {
    return new Date(date) > new Date();
  }, 'Target date must be in the future'),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.enum(['retirement', 'emergency', 'education', 'home', 'other']),
});

// API request validation
export const apiRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  timestamp: z.string().datetime('Invalid timestamp format'),
  action: z.string().min(1, 'Action is required'),
  data: z.record(z.any()).optional(),
});

export type UserRegistration = z.infer<typeof userRegistrationSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type RiskAssessment = z.infer<typeof riskAssessmentSchema>;
export type PortfolioSimulation = z.infer<typeof portfolioSimulationSchema>;
export type InvestmentGoal = z.infer<typeof investmentGoalSchema>;
export type ApiRequest = z.infer<typeof apiRequestSchema>;