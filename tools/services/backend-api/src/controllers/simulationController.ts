// /data/data/com.termux/files/home/beginnerinvestorhub/tools/services/backend-api/src/controllers/simulationController.ts

import { Request, Response, NextFunction } from 'express';
import * as riskEngineService from '../services/riskEngineService';
import { ApiError } from '../../../../packages/api-types/src'; // Adjust path if needed
import { PortfolioSimulationRequest, PortfolioSimulationResult } from '../../../../packages/api-types/src';
import logger from '../utils/logger';

/**
 * Initiates a portfolio simulation.
 * @param req The Express request object containing simulation parameters.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const runPortfolioSimulation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const simulationRequest: PortfolioSimulationRequest = req.body;
        const userId = (req as any).user?.id; // userId is now enforced by requireUserId middleware

        // Basic validation for simulation request
        if (!simulationRequest.initialInvestment || simulationRequest.initialInvestment <= 0) {
            logger.warn('Simulation failed: Invalid initial investment', { userId, value: simulationRequest.initialInvestment });
            throw new ApiError(400, 'Initial investment must be a positive number.');
        }
        if (!simulationRequest.assets || simulationRequest.assets.length === 0) {
            logger.warn('Simulation failed: No assets provided', { userId });
            throw new ApiError(400, 'At least one asset is required for simulation.');
        }
        if (!simulationRequest.simulationPeriod || simulationRequest.simulationPeriod <= 0) {
            logger.warn('Simulation failed: Invalid simulation period', { userId, value: simulationRequest.simulationPeriod });
            throw new ApiError(400, 'Simulation period must be a positive number of years.');
        }

        const simulationResult: PortfolioSimulationResult = await riskEngineService.simulatePortfolio(userId, simulationRequest);
        logger.info('Portfolio simulation successful', { userId });
        res.status(200).json(simulationResult);
    } catch (error) {
        logger.error('Portfolio simulation error', { error });
        next(error);
    }
};

/**
 * Retrieves a list of historical simulations for the authenticated user.
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const getHistoricalSimulations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id; // userId is now enforced by requireUserId middleware
        const simulations = await riskEngineService.getUserSimulations(userId);
        logger.info('Historical simulations retrieved', { userId, count: simulations.length });
        res.status(200).json(simulations);
    } catch (error) {
        logger.error('Get historical simulations error', { error });
        next(error);
    }
};

/**
 * Retrieves a specific historical simulation by its ID.
 * @param req The Express request object containing the simulation ID.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const getSimulationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id; // Assuming user ID is attached by auth middleware

        if (!userId) {
            throw new ApiError(401, 'Unauthorized: User ID not found.');
        }
        if (!id) {
            throw new ApiError(400, 'Simulation ID is required.');
        }

        const simulation = await riskEngineService.getSimulationDetails(userId, id);
        if (!simulation) {
            throw new ApiError(404, 'Simulation not found or you do not have access.');
        }
        res.status(200).json(simulation);
    } catch (error) {
        next(error);
    }
};

