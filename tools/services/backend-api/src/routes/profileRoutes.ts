
import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import UserProfile from '../models/userProfileModel';

export const profileRouter = Router();
profileRouter.use(requireAuth);

// GET /api/profile/
// Gets the current user's profile
profileRouter.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userProfile = await UserProfile.findOne({ user: userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile/
// Updates the current user's profile
profileRouter.put('/', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const profileData = req.body;
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { user: userId },
      profileData,
      { new: true, upsert: true }
    );
    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
