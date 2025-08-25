import request from 'supertest';
import app from '../../src/index';

// Test data factories
export const createTestUser = (overrides: Partial<any> = {}) => ({
  email: 'testuser@example.com',
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!',
  firstName: 'John',
  lastName: 'Doe',
  acceptTerms: true,
  marketingOptIn: false,
  ...overrides
});

export const createTestProfile = (overrides: Partial<any> = {}) => ({
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1-555-123-4567',
  dateOfBirth: '1990-01-15T00:00:00.000Z',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US'
  },
  preferences: {
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    theme: 'light',
    language: 'en'
  },
  ...overrides
});

// Authentication helpers
export class TestAuthHelper {
  private authToken: string | null = null;
  private userId: string | null = null;

  async registerUser(userData = createTestUser()) {
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    if (response.status === 201) {
      this.userId = response.body.user.uid;
    }
    
    return response;
  }

  async loginUser(credentials = { email: 'testuser@example.com', password: 'TestPassword123!' }) {
    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials);
    
    if (response.status === 200) {
      this.authToken = response.body.token;
      this.userId = response.body.user.uid;
    }
    
    return response;
  }

  async registerAndLogin(userData = createTestUser()) {
    await this.registerUser(userData);
    return await this.loginUser({
      email: userData.email,
      password: userData.password
    });
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  getUserId(): string | null {
    return this.userId;
  }

  getAuthHeaders() {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
  }

  async makeAuthenticatedRequest(method: 'get' | 'post' | 'put' | 'delete', endpoint: string, data?: any) {
    const req = request(app)[method](endpoint);
    
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    
    if (data && (method === 'post' || method === 'put')) {
      req.send(data);
    }
    
    return req;
  }

  reset() {
    this.authToken = null;
    this.userId = null;
  }
}

// Validation test helpers
export const expectValidationError = (response: any, field: string, message?: string) => {
  expect(response.status).toBe(400);
  expect(response.body).toMatchObject({
    error: 'Validation failed',
    message: 'The request contains invalid data',
    details: expect.any(Object)
  });

  if (message) {
    const fieldErrors = response.body.details.body || response.body.details.query || response.body.details.params;
    const fieldError = fieldErrors?.find((error: any) => error.field === field);
    expect(fieldError?.message).toContain(message);
  }
};

export const expectRateLimitError = (response: any) => {
  expect(response.status).toBe(429);
  expect(response.body).toMatchObject({
    error: 'Too Many Requests',
    message: expect.any(String),
    retryAfter: expect.any(Number)
  });
};

export const expectAuthError = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body).toMatchObject({
    error: 'Unauthorized',
    message: expect.any(String)
  });
};

// Database cleanup helpers (for when using real database)
export const cleanupTestData = async () => {
  // In a real implementation, this would clean up test data from the database
  // For now, since we're using in-memory storage, this is a no-op
  console.log('Test data cleanup completed');
};

// Mock data generators
export const generateMockPortfolioData = () => ({
  assets: [
    { name: 'AAPL', value: 10000, allocation: 40 },
    { name: 'GOOGL', value: 7500, allocation: 30 },
    { name: 'BONDS', value: 7500, allocation: 30 }
  ],
  history: [
    { date: '2024-01-01', total: 25000 },
    { date: '2024-01-02', total: 25500 },
    { date: '2024-01-03', total: 26000 }
  ]
});

export const generateMockRiskAssessment = () => ({
  age: 30,
  income: 75000,
  investmentExperience: 'intermediate',
  riskTolerance: 'moderate',
  investmentGoals: ['retirement', 'general'],
  investmentHorizon: 20,
  liquidityNeeds: 'medium',
  financialSituation: {
    monthlyIncome: 6250,
    monthlyExpenses: 4000,
    emergencyFund: 15000,
    existingInvestments: 25000,
    debt: 5000
  },
  questionnaire: [
    {
      questionId: 'q1',
      answer: 'moderate'
    },
    {
      questionId: 'q2',
      answer: 3
    }
  ]
});

// Performance testing helpers
export const measureResponseTime = async (requestFn: () => Promise<any>) => {
  const start = Date.now();
  const response = await requestFn();
  const end = Date.now();
  
  return {
    response,
    responseTime: end - start
  };
};

// Load testing helper
export const performLoadTest = async (
  requestFn: () => Promise<any>,
  concurrency: number = 10,
  duration: number = 5000
) => {
  const results: Array<{ success: boolean; responseTime: number; status?: number }> = [];
  const startTime = Date.now();
  
  const makeRequest = async () => {
    try {
      const { response, responseTime } = await measureResponseTime(requestFn);
      results.push({
        success: response.status < 400,
        responseTime,
        status: response.status
      });
    } catch (error) {
      results.push({
        success: false,
        responseTime: -1
      });
    }
  };

  // Run concurrent requests for the specified duration
  const promises: Promise<void>[] = [];
  
  while (Date.now() - startTime < duration) {
    // Maintain concurrency level
    while (promises.length < concurrency) {
      promises.push(makeRequest());
    }
    
    // Wait for at least one request to complete
    await Promise.race(promises);
    
    // Remove completed promises
    for (let i = promises.length - 1; i >= 0; i--) {
      const promise = promises[i];
      if (await Promise.race([promise, Promise.resolve('pending')]) !== 'pending') {
        promises.splice(i, 1);
      }
    }
  }
  
  // Wait for remaining requests to complete
  await Promise.all(promises);
  
  // Calculate statistics
  const successfulRequests = results.filter(r => r.success);
  const failedRequests = results.filter(r => !r.success);
  const responseTimes = successfulRequests.map(r => r.responseTime);
  
  return {
    totalRequests: results.length,
    successfulRequests: successfulRequests.length,
    failedRequests: failedRequests.length,
    successRate: (successfulRequests.length / results.length) * 100,
    averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    results
  };
};

// Environment setup for tests
export const setupTestEnvironment = () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  
  // Mock console methods to reduce noise in tests
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  // Clean up after each test
  afterEach(async () => {
    await cleanupTestData();
  });
};

export default {
  createTestUser,
  createTestProfile,
  TestAuthHelper,
  expectValidationError,
  expectRateLimitError,
  expectAuthError,
  cleanupTestData,
  generateMockPortfolioData,
  generateMockRiskAssessment,
  measureResponseTime,
  performLoadTest,
  setupTestEnvironment
};
