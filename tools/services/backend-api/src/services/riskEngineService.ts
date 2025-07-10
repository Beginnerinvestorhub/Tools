// beginnerinvestorhub/tools/services/backend-api/src/services/riskEngineService.ts

import { ApiError } from '../../../../packages/api-types/src';
import * as dbService from './dbService'; // To save/retrieve risk profiles and simulations
import axios from 'axios';
import { PortfolioSimulationRequest, PortfolioSimulationResult } from '../../../../packages/api-types/src/simulationTypes';

// Configuration for the Python Risk Calculation Engine
const RISK_CALC_ENGINE_URL = process.env.RISK_CALC_ENGINE_URL || 'http://localhost:5001'; // Default to a local port

/**
 * Processes a user's risk assessment answers, calculates a risk profile, and saves it.
 * @param userId The ID of the user submitting the assessment.
 * @param assessmentRequest The risk assessment answers.
 * @returns The calculated and saved risk profile.
 * @throws ApiError if calculation fails or database operation fails.
 */
export const processRiskAssessment = async (userId: string, assessmentRequest: any): Promise<any> => {
    try {
        const response = await axios.post(`${RISK_CALC_ENGINE_URL}/assess-risk`, {
            userId: userId,
            answers: assessmentRequest.answers,
        });
        const { score, level, recommendations } = response.data;
        const riskProfileData = {
            user: userId,
            riskScore: score,
            riskLevel: level,
            recommendations: recommendations || [],
            answers: assessmentRequest.answers,
        };
        const savedRiskProfile = await dbService.createOrUpdateRiskProfile(userId, riskProfileData);
        return savedRiskProfile;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            throw new ApiError(error.response.status, `Risk calculation engine error: ${error.response.data.message || error.message}`);
        }
        throw new ApiError(500, 'Failed to process risk assessment. Please try again.');
    }
};

/**
 * Retrieves the risk profile for a given user.
 * @param userId The ID of the user.
 * @returns The user's risk profile or null if not found.
 */
export const getRiskProfileByUserId = async (userId: string): Promise<RiskProfile | null> => {
    return await dbService.getRiskProfileByUserId(userId);
};

/**
 * Simulates a portfolio based on user input and saves the simulation results.
 * @param userId The ID of the user running the simulation.
 * @param simulationRequest The parameters for the portfolio simulation.
 * @returns The results of the portfolio simulation.
 * @throws ApiError if simulation fails or database operation fails.
 */
export const simulatePortfolio = async (userId: string, simulationRequest: PortfolioSimulationRequest): Promise<PortfolioSimulationResult> => {
    try {
        // 1. Fetch relevant market data for the assets
        // This could involve a call to your market-data-ingestion service's DB or directly to dbService
        // const assetSymbols = simulationRequest.assets.map(asset => asset.symbol);
        // const marketData = await dbService.getMarketDataForAssets(assetSymbols);
        // In a real app, you'd format this data as needed by the risk engine.

        // 2. Send simulation request to the Python Risk Calculation Engine
        const response = await axios.post(`${RISK_CALC_ENGINE_URL}/simulate-portfolio`, {
            userId: userId, // Pass userId for context
            simulationParams: simulationRequest,
            // marketData: marketData // Pass relevant market data
        });

        const {
            portfolioValueHistory,
            expectedReturn,
            riskMetrics,
            suggestedAllocation, // The Python engine might return a suggested allocation
            // ... other simulation results
        } = response.data; // Expected response from Python service

        // Map raw data to SimulationDataPoint if necessary
        const processedPortfolioValueHistory: SimulationDataPoint[] = portfolioValueHistory.map((point: any) => ({
            timestamp: new Date(point.timestamp), // Ensure it's a Date object
            value: point.value,
        }));


        const simulationResult: PortfolioSimulationResult = {
            userId,
            request: simulationRequest,
            portfolioValueHistory: processedPortfolioValueHistory,
            expectedReturn,
            riskMetrics,
            // Include other results from the Python engine
            suggestedAllocation: suggestedAllocation || [],
            // Add other fields as per your PortfolioSimulationResult interface
            summary: `Simulation for ${simulationRequest.simulationPeriod} years completed.`,
        };

        // 3. Save the simulation result in your database
        const savedSimulation = await dbService.createSimulation(simulationResult);

        return savedSimulation;
    } catch (error: any) {
        console.error('Error simulating portfolio:', error.message);
        if (axios.isAxiosError(error) && error.response) {
            throw new ApiError(error.response.status, `Simulation engine error: ${error.response.data.message || error.message}`);
        }
        throw new ApiError(500, 'Failed to run portfolio simulation. Please try again.');
    }
};

/**
 * Retrieves all historical simulations for a specific user.
 * @param userId The ID of the user.
 * @returns An array of portfolio simulation results.
 */
export const getUserSimulations = async (userId: string): Promise<PortfolioSimulationResult[]> => {
    return await dbService.getSimulationsByUserId(userId);
};

/**
 * Retrieves details of a specific simulation.
 * @param userId The ID of the user who owns the simulation.
 * @param simulationId The ID of the simulation to retrieve.
 * @returns The simulation details or null if not found/unauthorized.
 */
export const getSimulationDetails = async (userId: string, simulationId: string): Promise<PortfolioSimulationResult | null> => {
    const simulation = await dbService.getSimulationById(simulationId);
    if (!simulation || simulation.userId !== userId) {
        return null; // Not found or not authorized
    }
    return simulation;
};

/**
 * Retrieves a suggested portfolio allocation based on the user's risk profile.
 * @param userId The ID of the user.
 * @returns A suggested portfolio allocation.
 * @throws ApiError if risk profile not found or allocation fails.
 */
export const getSuggestedPortfolio = async (userId: string): Promise<any> => {
    // 1. Get the user's risk profile
    const riskProfile = await dbService.getRiskProfileByUserId(userId);

    if (!riskProfile) {
        throw new ApiError(404, 'Risk profile not found. Please complete your risk assessment first.');
    }

    try {
        // 2. Send risk profile to the Python Risk Calculation Engine for portfolio suggestion
        const response = await axios.post(`${RISK_CALC_ENGINE_URL}/suggest-portfolio`, {
            riskScore: riskProfile.score,
            riskLevel: riskProfile.level,
            // Pass any other parameters needed by the suggestion engine
        });

        const { allocation, description } = response.data; // Expected response from Python service

        const suggestedPortfolio: SuggestedPortfolio = {
            riskProfileId: riskProfile.id,
            basedOnRiskLevel: riskProfile.level,
            allocation: allocation as AssetAllocation[], // Ensure it matches AssetAllocation[]
            description: description || 'A diversified portfolio based on your risk profile.',
        };

        return suggestedPortfolio;
    } catch (error: any) {
        console.error('Error getting suggested portfolio:', error.message);
        if (axios.isAxiosError(error) && error.response) {
            throw new ApiError(error.response.status, `Suggestion engine error: ${error.response.data.message || error.message}`);
        }
        throw new ApiError(500, 'Failed to get suggested portfolio. Please try again.');
    }
};

