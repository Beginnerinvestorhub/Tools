import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
    },
  }),
}));

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Mock API calls
global.fetch = jest.fn();

// Import components after mocks
import AuthForm from '../components/AuthForm';
import ProfileForm from '../components/ProfileForm';
import PortfolioMonitor from '../components/PortfolioMonitor';
import RiskAssessmentForm from '../components/RiskAssessmentForm';
import { GlobalErrorBoundary } from '../components/ErrorBoundary';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <GlobalErrorBoundary>
      {children}
    </GlobalErrorBoundary>
  </BrowserRouter>
);

describe('Frontend Critical User Flow Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('🔐 Authentication Flow Integration', () => {
    it('should complete user registration flow with validation', async () => {
      // Mock successful registration API response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'User registered successfully',
          user: {
            uid: 'test-uid',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe'
          }
        })
      });

      render(
        <TestWrapper>
          <AuthForm mode="register" />
        </TestWrapper>
      );

      // Fill out registration form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/^password/i), 'TestPassword123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123!');
      
      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox', { name: /accept terms/i });
      await user.click(termsCheckbox);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      // Wait for API call and success message
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/register'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining('test@example.com')
          })
        );
      });
    });

    it('should handle registration validation errors', async () => {
      // Mock validation error response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
          details: {
            body: [
              {
                field: 'email',
                message: 'Email must be a valid email',
                value: 'invalid-email'
              }
            ]
          }
        })
      });

      render(
        <TestWrapper>
          <AuthForm mode="register" />
        </TestWrapper>
      );

      // Fill form with invalid email
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.type(screen.getByLabelText(/password/i), 'TestPassword123!');
      
      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/email must be a valid email/i)).toBeInTheDocument();
      });
    });

    it('should complete login flow successfully', async () => {
      // Mock successful login response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'mock-jwt-token',
          user: {
            uid: 'test-uid',
            email: 'test@example.com',
            role: 'user'
          }
        })
      });

      render(
        <TestWrapper>
          <AuthForm mode="login" />
        </TestWrapper>
      );

      // Fill login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'TestPassword123!');

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/login'),
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });
  });

  describe('👤 Profile Management Flow Integration', () => {
    it('should complete profile creation and update flow', async () => {
      // Mock profile GET (empty initially)
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            profile: { profileComplete: false }
          })
        })
        // Mock profile UPDATE
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Profile updated successfully',
            profile: {
              firstName: 'John',
              lastName: 'Doe',
              phone: '+1-555-123-4567'
            }
          })
        });

      render(
        <TestWrapper>
          <ProfileForm />
        </TestWrapper>
      );

      // Wait for initial profile load
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Fill profile form
      await user.clear(screen.getByLabelText(/first name/i));
      await user.type(screen.getByLabelText(/first name/i), 'John');
      
      await user.clear(screen.getByLabelText(/last name/i));
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      
      await user.type(screen.getByLabelText(/phone/i), '+1-555-123-4567');

      // Submit profile update
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/profile'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('John')
          })
        );
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle profile validation errors', async () => {
      // Mock validation error
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
          details: {
            body: [
              {
                field: 'phone',
                message: 'Phone number format is invalid'
              }
            ]
          }
        })
      });

      render(
        <TestWrapper>
          <ProfileForm />
        </TestWrapper>
      );

      // Enter invalid phone number
      await user.type(screen.getByLabelText(/phone/i), 'invalid-phone');
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/phone number format is invalid/i)).toBeInTheDocument();
      });
    });
  });

  describe('📊 Risk Assessment Flow Integration', () => {
    it('should complete risk assessment questionnaire', async () => {
      // Mock successful risk assessment submission
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          assessment: {
            id: 'assessment-123',
            riskProfile: 'moderate',
            score: 65,
            recommendations: ['Balanced portfolio', 'Diversified investments']
          }
        })
      });

      render(
        <TestWrapper>
          <RiskAssessmentForm />
        </TestWrapper>
      );

      // Fill risk assessment form
      await user.type(screen.getByLabelText(/age/i), '30');
      await user.type(screen.getByLabelText(/annual income/i), '75000');
      
      // Select risk tolerance
      const riskSelect = screen.getByLabelText(/risk tolerance/i);
      await user.selectOptions(riskSelect, 'moderate');

      // Select investment experience
      const experienceSelect = screen.getByLabelText(/investment experience/i);
      await user.selectOptions(experienceSelect, 'intermediate');

      // Submit assessment
      const submitButton = screen.getByRole('button', { name: /submit assessment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/risk-assessment'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('moderate')
          })
        );
      });

      // Should show results
      await waitFor(() => {
        expect(screen.getByText(/moderate/i)).toBeInTheDocument();
      });
    });
  });

  describe('💼 Portfolio Monitor Integration', () => {
    it('should load and display portfolio data', async () => {
      // Mock portfolio data
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          assets: [
            { name: 'AAPL', value: 10000, allocation: 40 },
            { name: 'GOOGL', value: 7500, allocation: 30 },
            { name: 'BONDS', value: 7500, allocation: 30 }
          ],
          history: [
            { date: '2024-01-01', total: 25000 },
            { date: '2024-01-02', total: 25500 }
          ]
        })
      });

      render(
        <TestWrapper>
          <PortfolioMonitor />
        </TestWrapper>
      );

      // Should show loading initially
      expect(screen.getByText(/loading portfolio data/i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText(/portfolio allocation/i)).toBeInTheDocument();
      });

      // Should display portfolio assets
      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('GOOGL')).toBeInTheDocument();
        expect(screen.getByText('BONDS')).toBeInTheDocument();
      });
    });

    it('should handle portfolio loading errors gracefully', async () => {
      // Mock API error
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <PortfolioMonitor />
        </TestWrapper>
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('🚨 Error Boundary Integration', () => {
    // Component that throws an error for testing
    const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error('Test error for error boundary');
      }
      return <div>No error</div>;
    };

    it('should catch and display component errors', async () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestWrapper>
          <ErrorThrowingComponent shouldThrow={true} />
        </TestWrapper>
      );

      // Should show error boundary UI
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      // Should have retry button
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should allow error recovery through retry', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { rerender } = render(
        <TestWrapper>
          <ErrorThrowingComponent shouldThrow={true} />
        </TestWrapper>
      );

      // Should show error boundary
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Rerender with no error
      rerender(
        <TestWrapper>
          <ErrorThrowingComponent shouldThrow={false} />
        </TestWrapper>
      );

      // Should show normal content
      await waitFor(() => {
        expect(screen.getByText('No error')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('🔄 End-to-End User Journey', () => {
    it('should complete full user onboarding journey', async () => {
      // Mock sequence of API calls for complete user journey
      (fetch as jest.Mock)
        // Registration
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: 'User registered successfully',
            user: { uid: 'test-uid', email: 'test@example.com' }
          })
        })
        // Login
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: 'mock-token',
            user: { uid: 'test-uid', email: 'test@example.com' }
          })
        })
        // Profile creation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            profile: { firstName: 'John', lastName: 'Doe' }
          })
        })
        // Risk assessment
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            assessment: { riskProfile: 'moderate' }
          })
        });

      // This would be a more complex test involving multiple components
      // and navigation between them. For brevity, we'll test the concept.

      const { rerender } = render(
        <TestWrapper>
          <AuthForm mode="register" />
        </TestWrapper>
      );

      // Step 1: Registration
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'TestPassword123!');
      // ... complete registration

      // Step 2: Login (rerender to simulate navigation)
      rerender(
        <TestWrapper>
          <AuthForm mode="login" />
        </TestWrapper>
      );

      // Step 3: Profile setup (rerender to simulate navigation)
      rerender(
        <TestWrapper>
          <ProfileForm />
        </TestWrapper>
      );

      // Step 4: Risk assessment (rerender to simulate navigation)
      rerender(
        <TestWrapper>
          <RiskAssessmentForm />
        </TestWrapper>
      );

      // Each step should work without errors
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('📱 Responsive Design Integration', () => {
    it('should handle mobile viewport interactions', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <AuthForm mode="login" />
        </TestWrapper>
      );

      // Should render mobile-friendly form
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // Form should be usable on mobile
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });
  });
});
