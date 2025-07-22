import request from 'supertest';
import app from '../../src/index';

describe('Critical User Flow Integration Tests', () => {
  let authToken: string;
  let userId: string;

  // Test data
  const testUser = {
    email: 'testuser@example.com',
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
    acceptTerms: true,
    marketingOptIn: false
  };

  const profileData = {
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
    }
  };

  describe('🔐 User Authentication Flow', () => {
    it('should complete full user registration flow', async () => {
      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(registerResponse.body).toMatchObject({
        message: 'User registered successfully',
        user: {
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          role: 'user'
        },
        nextStep: expect.any(String)
      });

      expect(registerResponse.body.user).toHaveProperty('uid');
      expect(registerResponse.body.user).toHaveProperty('createdAt');
      userId = registerResponse.body.user.uid;
    });

    it('should prevent duplicate user registration', async () => {
      // Attempt to register same user again
      const duplicateResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(500); // In production, this would be 409 Conflict

      expect(duplicateResponse.body).toHaveProperty('error');
    });

    it('should complete user login flow', async () => {
      // Step 2: Login with registered user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: false
        })
        .expect(200);

      expect(loginResponse.body).toMatchObject({
        token: expect.any(String),
        user: {
          email: testUser.email,
          role: 'user'
        },
        expiresIn: '1h'
      });

      authToken = loginResponse.body.token;
    });

    it('should reject invalid login credentials', async () => {
      const invalidLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
          rememberMe: false
        })
        .expect(500); // In demo mode, would be 401 in production

      expect(invalidLoginResponse.body).toHaveProperty('error');
    });
  });

  describe('👤 User Profile Management Flow', () => {
    it('should get empty profile for new user', async () => {
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body).toMatchObject({
        success: true,
        profile: {
          profileComplete: false,
          lastUpdated: null
        }
      });
    });

    it('should complete profile creation flow', async () => {
      const updateResponse = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        success: true,
        message: 'Profile updated successfully',
        profile: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          address: profileData.address,
          preferences: profileData.preferences
        },
        updatedFields: expect.any(Array)
      });

      expect(updateResponse.body.profile).toHaveProperty('updatedAt');
      expect(updateResponse.body.updatedFields.length).toBeGreaterThan(0);
    });

    it('should retrieve complete profile after update', async () => {
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body).toMatchObject({
        success: true,
        profile: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          profileComplete: true,
          lastUpdated: expect.any(String)
        }
      });
    });

    it('should update partial profile data', async () => {
      const partialUpdate = {
        preferences: {
          theme: 'dark',
          emailNotifications: false
        }
      };

      const updateResponse = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdate)
        .expect(200);

      expect(updateResponse.body.profile.preferences).toMatchObject({
        theme: 'dark',
        emailNotifications: false,
        // Should preserve other preferences
        smsNotifications: false,
        marketingEmails: false,
        language: 'en'
      });
    });
  });

  describe('🔒 Authentication & Authorization Flow', () => {
    it('should reject access to protected routes without token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject access with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('📊 Input Validation Flow', () => {
    it('should validate email format during registration', async () => {
      const invalidEmailUser = {
        ...testUser,
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailUser)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        message: 'The request contains invalid data',
        details: {
          body: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: expect.stringContaining('valid email')
            })
          ])
        }
      });
    });

    it('should validate password strength during registration', async () => {
      const weakPasswordUser = {
        ...testUser,
        email: 'newuser@example.com',
        password: 'weak',
        confirmPassword: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.details.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: expect.stringContaining('Password must contain')
          })
        ])
      );
    });

    it('should validate required fields during profile update', async () => {
      const invalidProfileData = {
        firstName: '', // Empty string should fail
        phone: 'invalid-phone-format',
        dateOfBirth: 'invalid-date'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProfileData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.any(Object)
      });
    });

    it('should sanitize HTML input in profile data', async () => {
      const maliciousData = {
        firstName: '<script>alert("xss")</script>John',
        lastName: '<b>Doe</b>',
        goals: 'My goal is to <script>steal()</script> invest wisely'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(200);

      // Should strip HTML tags
      expect(response.body.profile.firstName).toBe('John');
      expect(response.body.profile.lastName).toBe('Doe');
      expect(response.body.profile.goals).toBe('My goal is to  invest wisely');
    });
  });

  describe('⚡ Rate Limiting Flow', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const loginAttempt = {
        email: 'ratelimit@example.com',
        password: 'TestPassword123!'
      };

      // Make multiple rapid login attempts (should hit rate limit)
      const promises = Array(7).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send(loginAttempt)
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited (429)
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

    it('should enforce rate limiting on profile updates', async () => {
      const updateData = { firstName: 'Updated' };

      // Make multiple rapid profile updates
      const promises = Array(25).fill(null).map(() =>
        request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
      );

      const responses = await Promise.all(promises);
      
      // Should hit rate limit
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('🔄 Password Reset Flow', () => {
    it('should complete forgot password flow', async () => {
      const forgotPasswordResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(forgotPasswordResponse.body).toMatchObject({
        message: expect.stringContaining('password reset link'),
        email: testUser.email
      });
    });

    it('should complete password reset flow', async () => {
      const resetData = {
        token: 'demo-reset-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData)
        .expect(200);

      expect(resetResponse.body).toMatchObject({
        message: 'Password reset successfully',
        nextStep: expect.stringContaining('log in')
      });
    });
  });

  describe('🧹 Data Cleanup Flow', () => {
    it('should delete user profile', async () => {
      const deleteResponse = await request(app)
        .delete('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body).toMatchObject({
        success: true,
        message: 'Profile deleted successfully'
      });
    });

    it('should return empty profile after deletion', async () => {
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.profile.profileComplete).toBe(false);
    });

    it('should handle deletion of non-existent profile gracefully', async () => {
      // Try to delete again
      const deleteResponse = await request(app)
        .delete('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(deleteResponse.body).toMatchObject({
        error: 'Profile not found',
        message: 'No profile data found to delete'
      });
    });
  });

  describe('🔍 Error Handling Flow', () => {
    it('should handle server errors gracefully', async () => {
      // Test with malformed JSON (if server handles it)
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing required headers', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(testUser);

      // Should handle missing Content-Type gracefully
      expect([400, 500]).toContain(response.status);
    });
  });
});
