// beginnerinvestorhub/tools/services/backend-api/src/routes/nudgeEngineRoutes.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { ApiError } from '../../packages/api-types/src';

const router = Router();

/**
 * Proxy endpoint for Nudge Engine API
 * This endpoint acts as a proxy to the Nudge Engine API to prevent exposing the API key to the frontend
 */
router.post('/behavioral-nudges', authenticateToken, async (req, res, next) => {
  try {
    // Validate that the NUDGE_ENGINE_API_KEY is set
    const nudgeEngineApiKey = process.env.NUDGE_ENGINE_API_KEY;
    const nudgeEngineUrl = process.env.NUDGE_ENGINE_URL || 'http://localhost:8000';
    
    if (!nudgeEngineApiKey) {
      throw new ApiError(500, 'Nudge Engine API key is not configured');
    }
    
    // Forward the request to the Nudge Engine API
    const response = await fetch(`${nudgeEngineUrl}/api/nudges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nudgeEngineApiKey}`
      },
      body: JSON.stringify(req.body)
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, `Nudge Engine API error: ${errorText}`);
    }
    
    // Return the response from the Nudge Engine API
    const data = await response.json();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * Proxy endpoint for getting user-specific nudges
 */
router.get('/behavioral-nudges/user/:userId', authenticateToken, async (req, res, next) => {
  try {
    // Validate that the NUDGE_ENGINE_API_KEY is set
    const nudgeEngineApiKey = process.env.NUDGE_ENGINE_API_KEY;
    const nudgeEngineUrl = process.env.NUDGE_ENGINE_URL || 'http://localhost:8000';
    
    if (!nudgeEngineApiKey) {
      throw new ApiError(500, 'Nudge Engine API key is not configured');
    }
    
    const { userId } = req.params;

    // Validate userId to prevent path traversal
    const isValidUserId = /^[a-zA-Z0-9_-]+$/.test(userId);
    if (!isValidUserId) {
      throw new ApiError(400, 'Invalid user ID format');
    }
    
    // Forward the request to the Nudge Engine API
    const response = await fetch(`${nudgeEngineUrl}/api/nudges/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${nudgeEngineApiKey}`
      }
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, `Nudge Engine API error: ${errorText}`);
    }
    
    // Return the response from the Nudge Engine API
    const data = await response.json();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
