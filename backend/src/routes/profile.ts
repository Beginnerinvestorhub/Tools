import express from 'express';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

// In-memory profile store (replace with DB in production)
const profiles: Record<string, { name?: string; riskTolerance?: string; goals?: string }> = {};

// GET /api/profile - get current user's profile
router.get('/', requireAuth, (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  res.json(profiles[userId] || {});
});

// POST /api/profile - update current user's profile
  /**
   * Updates the current user's profile with the provided details.
  /**
   * Extracts user ID from the request object, assuming it's populated by authentication middleware.
   *
   * Extracts user ID from the request, verifies authentication,
   * and updates the in-memory profile store with the new data.
   * Responds with success status if update is successful.
   * 
   * @param {Request} req - The Express request object, containing user ID and profile data in the body.
   * @param {Response} res - The Express response object, used to send back the success status or error.
   */
router.post('/', requireAuth, (req, res) => {
  // Extracts the user's ID from the request object, assuming it's populated by authentication middleware.
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, riskTolerance, goals } = req.body;
  profiles[userId] = { name, riskTolerance, goals };

  res.json({ success: true });
});

export default router;
