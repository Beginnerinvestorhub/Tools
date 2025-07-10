// /data/data/com.termux/files/home/beginnerinvestorhub/tools/services/backend-api/src/controllers/riskAssessmentController.ts

import { Request, Response, NextFunction } from 'express';
import * as riskEngineService from '../services/riskEngineService';
import { ApiError } from '../../../../packages/api-types/src'; // Adjust path if needed
import { RiskAssessmentRequest, RiskProfile } from '../../../../packages/api-types/src';
import logger from '../utils/logger';

/**
 * Handles the creation or update of a user's risk assessment.
 * @param req The Express request object containing risk assessment answers.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const submitRiskAssessment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assessmentRequest: RiskAssessmentRequest = req.body;
        const userId = (req as any).user?.id; // userId is now enforced by requireUserId middleware

        if (!assessmentRequest.answers || !Array.isArray(assessmentRequest.answers) || assessmentRequest.answers.length === 0) {
            logger.warn('Risk assessment submission failed: No answers provided', { userId });
            throw new ApiError(400, 'Risk assessment answers are required.');
        }

        const riskProfile: RiskProfile = await riskEngineService.processRiskAssessment(userId, assessmentRequest);
        logger.info('Risk assessment submitted successfully', { userId });
        res.status(200).json({ message: 'Risk assessment submitted successfully', riskProfile });
    } catch (error) {
        logger.error('Risk assessment submission error', { error });
        next(error);
    }
};

/**
 * Retrieves the risk profile for the authenticated user.
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const getRiskProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id; // userId is now enforced by requireUserId middleware
        const riskProfile = await riskEngineService.getRiskProfileByUserId(userId);
        if (!riskProfile) {
            logger.warn('Risk profile not found for user', { userId });
            throw new ApiError(404, 'Risk profile not found for this user.');
        }
        logger.info('Risk profile retrieved successfully', { userId });
        res.status(200).json(riskProfile);
    } catch (error) {
        logger.error('Get risk profile error', { error });
        next(error);
    }
};

/**
 * Suggests a portfolio based on the user's risk profile.
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const suggestPortfolio = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id; // Assuming user ID is attached by auth middleware

        if (!userId) {
            throw new ApiError(401, 'Unauthorized: User ID not found.');
        }

        const suggestedPortfolio = await riskEngineService.getSuggestedPortfolio(userId);
        if (!suggestedPortfolio) {
            // This might happen if a risk profile doesn't exist yet
            throw new ApiError(404, 'No suitable portfolio found. Please complete your risk assessment first.');
        }
        res.status(200).json(suggestedPortfolio);
    } catch (error) {
        next(error);
    }
};

