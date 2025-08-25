
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware'; // Assuming auth middleware exists
import Challenge from '../models/challengeModel';
import UserChallenge from '../models/userChallengeModel';
import LeaderboardEntry from '../models/leaderboardEntryModel';
import User from '../models/userModel';

// Assume a GamificationService exists for more complex logic
// import * as GamificationService from '../services/gamificationService';

export const gamificationRouter = Router();
gamificationRouter.use(requireAuth); // Protect all gamification routes

// GET /api/gamification/challenges
// Fetches all available challenges and the user's progress
gamificationRouter.get('/challenges', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const challenges = await Challenge.find();
    const userChallenges = await UserChallenge.find({ user: userId });

    const progressMap = new Map(userChallenges.map(uc => [uc.challenge.toString(), uc]));

    const response = challenges.map(challenge => ({
      id: challenge._id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      target: challenge.target,
      reward: challenge.reward,
      progress: progressMap.get(challenge._id.toString())?.progress || 0,
      completed: progressMap.get(challenge._id.toString())?.completed || false,
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/gamification/challenges/:challengeId/claim
gamificationRouter.post('/challenges/:challengeId/claim', async (req, res) => {
    // This endpoint would be handled by a more advanced gamification service
    // that checks if the challenge conditions are met before claiming.
    res.status(501).json({ message: 'Not Implemented: Claiming is handled by the event tracking system.' });
});

// GET /api/gamification/leaderboard
gamificationRouter.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await LeaderboardEntry.find()
      .sort({ points: -1 })
      .limit(limit)
      .populate('user', 'username'); // Populate user's username

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/gamification/position
// Gets the authenticated user's rank and points.
gamificationRouter.get('/position', async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const userPoints = (await LeaderboardEntry.findOne({ user: userId }))?.points || 0;
        
        // Count how many users have more points to determine rank
        const rank = await LeaderboardEntry.countDocuments({ points: { $gt: userPoints } }) + 1;

        res.json({ rank, points: userPoints });
    } catch (error) {
        console.error('Error fetching user position:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
