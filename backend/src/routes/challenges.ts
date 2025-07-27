import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import prisma from '../services/databaseService';

export const challengesRouter = Router();

// Rate limiter for challenges requests (more restrictive than general API limiter)
// 20 requests per hour per IP
const challengesRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many challenges requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all routes in this router
challengesRouter.use(challengesRateLimiter);

// Challenge templates are now stored in the database
// This function fetches them from the database
const getChallengeTemplates = async () => {
  try {
    const challenges = await prisma.challenge.findMany();
    return challenges.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      target: challenge.target,
      reward: challenge.reward as { points: number; badge?: string }
    }));
  } catch (error) {
    console.error('Error fetching challenge templates:', error);
    // Fallback to in-memory templates if database fails
    return [
      {
        id: 'daily_login',
        title: 'Daily Check-in',
        description: 'Log in to the platform every day',
        type: 'daily',
        target: 1,
        reward: { points: 10 }
      },
      {
        id: 'complete_risk_assessment',
        title: 'Know Your Risk',
        description: 'Complete the risk assessment tool',
        type: 'achievement',
        target: 1,
        reward: { points: 100, badge: 'Risk Aware' }
      },
      {
        id: 'weekly_lessons',
        title: 'Learning Streak',
        description: 'Complete 3 lessons this week',
        type: 'weekly',
        target: 3,
        reward: { points: 200, badge: 'Dedicated Learner' }
      },
      {
        id: 'portfolio_tracker',
        title: 'Track Your Progress',
        description: 'Use the portfolio monitor 5 times',
        type: 'achievement',
        target: 5,
        reward: { points: 150 }
      }
    ];
  }
};

// Get user's challenges
challengesRouter.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get challenge templates from database
    const CHALLENGE_TEMPLATES = await getChallengeTemplates();
    
    // Get user's current progress for various activities
    // Note: This would need to be implemented with proper event tracking
    // For now, we'll get user challenge progress directly from the database
    const userChallenges = await prisma.userChallenge.findMany({
      where: { userId }
    });
    
    const completedChallenges = new Set(
      userChallenges.filter(uc => uc.completed).map(uc => uc.challengeId)
    );
    
    const challengeProgress = userChallenges.reduce((acc, uc) => {
      acc[uc.challengeId] = uc.progress;
      return acc;
    }, {} as Record<string, number>);
    
    // Generate challenges with current progress
    const challenges = CHALLENGE_TEMPLATES.map(template => {
      const currentProgress = challengeProgress[template.id] || 0;
      
      return {
        ...template,
        progress: Math.min(currentProgress, template.target),
        completed: completedChallenges.has(template.id),
        expiresAt: template.type === 'daily' ? new Date(Date.now() + 24 * 60 * 60 * 1000) :
                   template.type === 'weekly' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) :
                   undefined
      };
    });
    
    res.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Claim challenge reward
challengesRouter.post('/:challengeId/claim', async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    // Get challenge templates from database
    const CHALLENGE_TEMPLATES = await getChallengeTemplates();
    const challenge = CHALLENGE_TEMPLATES.find(c => c.id === challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    // Check if already claimed
    const existingClaim = await prisma.userChallenge.findFirst({
      where: { 
        userId,
        challengeId
      }
    });
    
    if (existingClaim) {
      return res.status(400).json({ error: 'Challenge already claimed' });
    }
    
    // Mark challenge as completed
    await prisma.userChallenge.create({
      data: {
        userId,
        challengeId,
        completed: true,
        progress: challenge.target
      }
    });
    
    // For points and badges, we would need to implement a user progress system
    // This is a simplified version for now
    
    res.json({ 
      success: true, 
      pointsAwarded: challenge.reward.points,
      badgeAwarded: challenge.reward.badge
    });
  } catch (error) {
    console.error('Error claiming challenge reward:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
