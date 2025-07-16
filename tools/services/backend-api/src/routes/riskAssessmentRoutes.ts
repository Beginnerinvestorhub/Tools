// beginnerinvestorhub/tools/services/backend-api/src/routes/riskAssessmentRoutes.ts

import { Router } from 'express';
import * as riskAssessmentController from '../controllers/riskAssessmentController';
import { authenticateToken } from '../middleware/authMiddleware'; // Assuming you'll create this middleware
import RateLimit from 'express-rate-limit';

const router = Router();

// Define rate-limiting middleware: max 100 requests per 15 minutes
const rateLimiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // maximum 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * @swagger
 * /api/risk-assessment:
 * post:
 * summary: Submit or update a user's risk assessment
 * tags: [Risk Assessment]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/RiskAssessmentRequest'
 * responses:
 * 200:
 * description: Risk assessment submitted successfully, returns the calculated risk profile
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: Risk assessment submitted successfully
 * riskProfile:
 * $ref: '#/components/schemas/RiskProfile'
 * 400:
 * description: Bad request (e.g., missing or invalid answers)
 * 401:
 * description: Unauthorized (e.g., missing or invalid token)
 * 500:
 * description: Internal server error
 */
router.post('/', rateLimiter, authenticateToken, riskAssessmentController.submitRiskAssessment);

/**
 * @swagger
 * /api/risk-assessment:
 * get:
 * summary: Get the authenticated user's risk profile
 * tags: [Risk Assessment]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: User's risk profile retrieved successfully
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/RiskProfile'
 * 401:
 * description: Unauthorized (e.g., missing or invalid token)
 * 404:
 * description: Risk profile not found for this user
 * 500:
 * description: Internal server error
 */
router.get('/', rateLimiter, authenticateToken, riskAssessmentController.getRiskProfile);

/**
 * @swagger
 * /api/risk-assessment/suggest-portfolio:
 * get:
 * summary: Get a suggested portfolio based on the user's risk profile
 * tags: [Risk Assessment]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Suggested portfolio based on the user's risk profile
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/SuggestedPortfolio' # You might need to define this schema
 * 401:
 * description: Unauthorized (e.g., missing or invalid token)
 * 404:
 * description: No suitable portfolio found (e.g., risk assessment not completed)
 * 500:
 * description: Internal server error
 */
router.get('/suggest-portfolio', rateLimiter, authenticateToken, riskAssessmentController.suggestPortfolio);

export default router;

