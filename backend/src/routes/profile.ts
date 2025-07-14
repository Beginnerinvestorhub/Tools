import express from 'express';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

// In-memory store for demo; replace with DB in production
const profiles: Record<string, any> = {};

// GET /api/profile - get the current user's profile
router.get('/', requireAuth, (req, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  res.json(profiles[uid] || {});
});

// POST /api/profile - update the current user's profile
router.post('/', requireAuth, (req, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const { name, riskTolerance, goals } = req.body;
  profiles[uid] = { name, riskTolerance, goals };
  res.json({ success: true });
});

export default router;
