// beginnerinvestorhub/tools/services/backend-api/src/routes/simulationRoutes.ts

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as simulationController from '../controllers/simulationController';
import { authenticateToken } from '../middleware/authMiddleware'; // Assuming you'll create this middleware

const router = Router();

/**
 * @swagger
 * /api/simulation/run:
 * post:
 * summary: Run a new portfolio simulation
 * tags: [Simulation]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/PortfolioSimulationRequest'
 * responses:
 * 200:
 * description: Portfolio simulation results
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/PortfolioSimulationResult'
 * 400:
 * description: Bad request (e.g., invalid simulation parameters)
 * 401:
 * description: Unauthorized (e.g., missing or invalid token)
 * 500:
 * description: Internal server error
 */
router.post('/run', authenticateToken, simulationController.runPortfolioSimulation);

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
// Define rate limiter: maximum of 100 requests per 15 minutes
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

router.get('/history', authenticateToken, rateLimiter, simulationController.getHistoricalSimulations);

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

