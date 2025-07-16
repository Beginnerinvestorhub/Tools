// beginnerinvestorhub/tools/services/backend-api/src/routes/simulationRoutes.ts

import { Router } from 'express';
import * as simulationController from '../controllers/simulationController';
import { authenticateToken } from '../middleware/authMiddleware'; // Assuming you'll create this middleware
import RateLimit from 'express-rate-limit';

const router = Router();

// Define rate limiter: maximum of 10 requests per minute
const simulationRateLimiter = RateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // max 10 requests per windowMs
    message: "Too many simulation requests from this IP, please try again later."
});

/**
 * @swagger
 * /api/simulation/run:
 * post:
 * summary: Run a new portfolio simulation
 * tags: [Simulation]
 * security:
 * - bearerAuth: []
 * requestBody:

/**
 * @swagger
 * /api/simulation/history:
 * get:
 * summary: Get historical portfolio simulations for the authenticated user
 * tags: [Simulation]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of historical simulations
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/PortfolioSimulationResult'
 * 401:
 * description: Unauthorized (e.g., missing or invalid token)
 * 500:
 * description: Internal server error
 */
router.get('/history', authenticateToken, simulationController.getHistoricalSimulations);

/**
 * @swagger
 * /api/simulation/{id}:
 * get:
 * summary: Get details of a specific historical simulation by ID
 * tags: [Simulation]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: string
 * required: true
 * description: The ID of the simulation to retrieve
 * responses:
 * 200:
 * description: Details of the specified simulation
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/PortfolioSimulationResult'
 * 401:
 * description: Unauthorized (e.g., missing or invalid token)
 * 404:
 * description: Simulation not found or unauthorized access
 * 500:
 * description: Internal server error
 */
router.get('/:id', authenticateToken, simulationController.getSimulationById);

export default router;

