import { Router, Request } from 'express';
import { requireAuth } from '../utils/requireAuth';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: any;
}

export const userRouter = Router();

  /**
   * GET /api/user/me - get current user's profile
   * Requires authentication with user, admin, or paiduser role
   * @param {Request} req - The Express request object, containing user ID and other details in the body.
   * @param {Response} res - The Express response object, used to send back the user profile.
   */
userRouter.get('/me', requireAuth(['user', 'admin', 'paiduser']), (req: AuthRequest, res) => {
  // Example: Return user profile
  res.json({ user: req.user });
});

userRouter.put(
  '/me',
  requireAuth(['user', 'admin', 'paiduser']),
  async (req: AuthRequest, res) => {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updates = req.body;
    try {
      // Update user profile here
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);
