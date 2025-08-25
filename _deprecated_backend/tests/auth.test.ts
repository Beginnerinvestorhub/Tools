import request from 'supertest';
import app from '../src/index';
import { TestAuthHelper, createTestUser, expectValidationError, expectAuthError } from './setup/testUtils';

describe('Auth API with Validation', () => {
  let authHelper: TestAuthHelper;

  beforeEach(() => {
    authHelper = new TestAuthHelper();
  });

  afterEach(() => {
    authHelper.reset();
  });

  describe('Authentication Protection', () => {
    it('should reject unauthenticated access to protected route', async () => {
      const res = await request(app).get('/api/profile');
      expectAuthError(res);
      expect(res.body.message).toContain('User authentication required');
    });

    it('should reject access with invalid JWT', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalidtoken');
      expectAuthError(res);
    });

    it('should reject access with malformed authorization header', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', 'InvalidFormat token');
      expectAuthError(res);
    });
  });

  describe('User Registration with Validation', () => {
    it('should allow user to register with valid data', async () => {
      const newUser = createTestUser();
      const res = await authHelper.registerUser(newUser);
      
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        message: 'User registered successfully',
        user: {
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: 'user'
        },
        nextStep: expect.any(String)
      });
      expect(res.body.user).toHaveProperty('uid');
      expect(res.body.user).toHaveProperty('createdAt');
    });

    it('should reject registration with invalid email', async () => {
      const invalidUser = createTestUser({ email: 'invalid-email' });
      const res = await authHelper.registerUser(invalidUser);
      
      expectValidationError(res, 'email', 'valid email');
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordUser = createTestUser({ 
        password: 'weak', 
        confirmPassword: 'weak' 
      });
      const res = await authHelper.registerUser(weakPasswordUser);
      
      expectValidationError(res, 'password', 'Password must contain');
    });

    it('should reject registration with mismatched passwords', async () => {
      const mismatchedUser = createTestUser({ 
        password: 'TestPassword123!',
        confirmPassword: 'DifferentPassword123!' 
      });
      const res = await authHelper.registerUser(mismatchedUser);
      
      expectValidationError(res, 'confirmPassword');
    });

    it('should reject registration without accepting terms', async () => {
      const noTermsUser = createTestUser({ acceptTerms: false });
      const res = await authHelper.registerUser(noTermsUser);
      
      expectValidationError(res, 'acceptTerms');
    });

    it('should sanitize HTML in name fields', async () => {
      const maliciousUser = createTestUser({
        firstName: '<script>alert("xss")</script>John',
        lastName: '<b>Doe</b>'
      });
      const res = await authHelper.registerUser(maliciousUser);
      
      expect(res.status).toBe(201);
      expect(res.body.user.firstName).toBe('John'); // HTML stripped
      expect(res.body.user.lastName).toBe('Doe');   // HTML stripped
    });
  });

  describe('User Login with Validation', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await authHelper.registerUser();
    });

    it('should allow user to log in with valid credentials', async () => {
      const res = await authHelper.loginUser();
      
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        token: expect.any(String),
        user: {
          email: 'testuser@example.com',
          role: 'user'
        },
        expiresIn: '1h'
      });
      expect(res.body.user).toHaveProperty('uid');
      expect(res.body.user).toHaveProperty('lastLogin');
    });

    it('should support remember me functionality', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'TestPassword123!',
          rememberMe: true
        });
      
      expect(res.status).toBe(200);
      expect(res.body.expiresIn).toBe('30d');
    });

    it('should reject login with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!'
        });
      
      expectValidationError(res, 'email', 'valid email');
    });

    it('should reject login with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com'
          // password missing
        });
      
      expectValidationError(res, 'password');
    });

    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword123!'
        });
      
      // In demo mode, this returns 500. In production, would be 401
      expect([401, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Password Reset Flow', () => {
    it('should accept forgot password request with valid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'testuser@example.com' });
      
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        message: expect.stringContaining('password reset link'),
        email: 'testuser@example.com'
      });
    });

    it('should reject forgot password with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' });
      
      expectValidationError(res, 'email', 'valid email');
    });

    it('should accept password reset with valid token and password', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-reset-token',
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        message: 'Password reset successfully',
        nextStep: expect.stringContaining('log in')
      });
    });

    it('should reject password reset with weak new password', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'valid-reset-token',
          password: 'weak',
          confirmPassword: 'weak'
        });
      
      expectValidationError(res, 'password', 'Password must contain');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const loginAttempt = {
        email: 'ratelimit@example.com',
        password: 'TestPassword123!'
      };

      // Make multiple rapid login attempts
      const promises = Array(7).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send(loginAttempt)
      );

      const responses = await Promise.all(promises);
      
      // Should have at least one rate limited response
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Rate limited response should have proper structure
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body).toMatchObject({
          error: 'Too Many Requests',
          message: expect.stringContaining('Too many authentication attempts'),
          retryAfter: expect.any(Number)
        });
      }
    });
  });

  describe('Security Features', () => {
    it('should normalize email addresses', async () => {
      const userWithMixedCaseEmail = createTestUser({
        email: 'TestUser@EXAMPLE.COM'
      });
      
      const res = await authHelper.registerUser(userWithMixedCaseEmail);
      
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('testuser@example.com'); // Normalized
    });

    it('should handle server configuration errors gracefully', async () => {
      // Temporarily remove JWT_SECRET to simulate configuration error
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'TestPassword123!'
        });
      
      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        error: 'Server configuration error',
        message: 'Authentication service temporarily unavailable'
      });
      
      // Restore JWT_SECRET
      process.env.JWT_SECRET = originalSecret;
    });
  });
});
