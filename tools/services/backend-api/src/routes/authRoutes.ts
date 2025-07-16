// beginnerinvestorhub/tools/services/backend-api/src/routes/authRoutes.ts

import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware'; // This is crucial now!

const router = Router();

// ... (register route remains the same) ...
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 * post:
 * summary: Login a user and retrieve profile data (expects Firebase ID Token from frontend)
 * tags: [Auth]
 * requestBody:
 * description: No request body for direct email/password. Expects authentication via Firebase ID Token in header.
 * required: false
 * responses:
 * 200:
 * description: Login successful, returns user profile
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: Login successful
 * user:
 * $ref: '#/components/schemas/User'
 * 401:
 * description: Unauthorized (e.g., invalid or missing Firebase ID token)
 * 404:
 * description: User profile not found after successful token verification
 * 500:
 * description: Internal server error
 * security:
 * - bearerAuth: [] # Indicate that this endpoint expects a Bearer token (Firebase ID Token)
 */
// Apply authenticateToken middleware to the login route as well
// It will verify the ID token, and if valid, the controller just fetches the profile.
router.post('/login', authenticateToken, authController.login);

// ... (logout and getCurrentUser routes remain the same, relying on authenticateToken) ...
const logoutRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs for logout
    message: { error: 'Too many logout requests, please try again later.' },
});

router.post('/logout', logoutRateLimiter, authenticateToken, authController.logout);
import rateLimit from 'express-rate-limit';

const meRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
});

router.get('/me', meRateLimiter, authenticateToken, authController.getCurrentUser);

export default router;

