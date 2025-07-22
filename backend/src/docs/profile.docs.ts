/**
 * OpenAPI Documentation for Profile Routes
 * User profile management and settings endpoints
 */

import { OpenAPIV3 } from 'openapi-types';

export const profilePaths: OpenAPIV3.PathsObject = {
  '/api/profile': {
    get: {
      tags: ['User Management'],
      summary: 'Get current user profile',
      description: `
Retrieve the complete profile information for the authenticated user.

**Features:**
- Complete user profile data
- Investment preferences and goals
- Risk tolerance settings
- Account status and verification info

**Security:**
- Requires valid JWT token
- Users can only access their own profile
      `,
      operationId: 'getUserProfile',
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Profile retrieved successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/UserProfile'
                      }
                    }
                  }
                ]
              },
              examples: {
                completeProfile: {
                  summary: 'Complete user profile',
                  value: {
                    success: true,
                    message: 'Profile retrieved successfully',
                    data: {
                      firstName: 'John',
                      lastName: 'Doe',
                      dateOfBirth: '1990-01-15',
                      phoneNumber: '+1234567890',
                      address: {
                        street: '123 Main Street',
                        city: 'New York',
                        state: 'NY',
                        zipCode: '10001',
                        country: 'United States'
                      },
                      investmentExperience: 'beginner',
                      riskTolerance: 'moderate',
                      investmentGoals: ['retirement', 'wealth_building']
                    },
                    timestamp: '2024-01-20T10:30:00.000Z'
                  }
                },
                incompleteProfile: {
                  summary: 'Incomplete user profile',
                  value: {
                    success: true,
                    message: 'Profile retrieved successfully',
                    data: {
                      firstName: 'Jane',
                      lastName: 'Smith',
                      investmentExperience: null,
                      riskTolerance: null,
                      investmentGoals: []
                    },
                    timestamp: '2024-01-20T10:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        '401': {
          $ref: '#/components/responses/UnauthorizedError'
        },
        '500': {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },

    put: {
      tags: ['User Management'],
      summary: 'Update user profile',
      description: `
Update the user's profile information with comprehensive validation.

**Features:**
- Partial or complete profile updates
- Input validation and sanitization
- Investment preference tracking
- Address validation
- Phone number format validation

**Security:**
- Requires valid JWT token
- All inputs are sanitized to prevent XSS
- Rate limiting: 20 requests per 15 minutes
      `,
      operationId: 'updateUserProfile',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserProfile'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Profile updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Profile updated successfully' },
                  data: {
                    $ref: '#/components/schemas/UserProfile'
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Invalid input data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Invalid input data' }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Unauthorized access' }
                }
              }
            }
          }
        }
      }
    }
  }
};

export default profilePaths;
