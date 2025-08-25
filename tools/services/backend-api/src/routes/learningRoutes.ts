
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import LearningPath from '../models/learningPathModel';
import UserProfile from '../models/userProfileModel';

export const learningRouter = Router();
learningRouter.use(requireAuth);

// GET /api/learning/path
// Gets the user's current learning path and progress.
learningRouter.get('/path', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const learningPath = await LearningPath.findOne({ user: userId });

    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not started. Complete your profile to begin.' });
    }

    // In a real implementation, we would populate lesson/challenge details here.
    res.json(learningPath);
  } catch (error) {
    console.error('Error fetching learning path:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/learning/complete-lesson
learningRouter.post('/complete-lesson', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({ error: 'lessonId is required' });
    }

    const learningPath = await LearningPath.findOneAndUpdate(
      { user: userId },
      { $addToSet: { completedLessons: lessonId }, $inc: { progress: 5 } }, // Increment progress by 5 for a lesson
      { new: true, upsert: true }
    );

    // Here you would also call the GamificationService to award points.
    // await GamificationService.trackEvent(userId, 'lesson_completed', { lessonId });

    res.json(learningPath);
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/learning/profile
// Creates or updates the user's learning profile based on onboarding answers.
learningRouter.post('/profile', async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const { investmentGoals, timeHorizon, learningStyle, riskTolerance } = req.body;

        const userProfile = await UserProfile.findOneAndUpdate(
            { user: userId },
            {
                investmentGoals,
                timeHorizon,
                learningStyle,
                riskTolerance,
            },
            { new: true, upsert: true }
        );

        // In a real system, this would trigger logic to assign a LearningPath.

        res.json(userProfile);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
