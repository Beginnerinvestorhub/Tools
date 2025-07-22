/**
 * Documentation Aggregator
 * Combines all route documentation into a single OpenAPI specification
 */

import { OpenAPIV3 } from 'openapi-types';
import { openApiSpec } from '../config/openapi';
import authPaths from './auth.docs';
import profilePaths from './profile.docs';

// ==============================================================================
// ADDITIONAL ROUTE DOCUMENTATION (Simplified for remaining routes)
// ==============================================================================

const dashboardPaths: OpenAPIV3.PathsObject = {
  '/api/dashboard': {
    get: {
      tags: ['Portfolio'],
      summary: 'Get user dashboard data',
      description: 'Retrieve comprehensive dashboard data including portfolio summary, recent transactions, and market insights.',
      operationId: 'getDashboard',
      security: [{ BearerAuth: [] }],
      responses: {
        '200': {
          description: 'Dashboard data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      portfolioSummary: {
                        type: 'object',
                        properties: {
                          totalValue: { type: 'number', example: 25000.5 },
                          dayChange: { type: 'number', example: 125.75 },
                          dayChangePercent: { type: 'number', example: 0.51 },
                          totalGainLoss: { type: 'number', example: 2500.25 }
                        }
                      },
                      recentTransactions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            type: { type: 'string', enum: ['buy', 'sell'] },
                            symbol: { type: 'string' },
                            quantity: { type: 'number' },
                            price: { type: 'number' },
                            date: { type: 'string', format: 'date-time' }
                          }
                        }
                      },
                      marketInsights: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            title: { type: 'string' },
                            content: { type: 'string' },
                            date: { type: 'string', format: 'date-time' }
                          }
                        }
                      }
                    }
                  }
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

// ==============================================================================
// COMBINED DOCUMENTATION EXPORT
// ==============================================================================

export const combinedPaths: OpenAPIV3.PathsObject = {
  ...authPaths,
  ...profilePaths,
  ...dashboardPaths
};

export default combinedPaths;
