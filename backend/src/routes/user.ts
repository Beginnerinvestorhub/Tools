import { Router, Request } from 'express';
import { requireAuth } from '../utils/requireAuth';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: any;
}

export const userRouter = Router();

userRouter.get('/me', requireAuth(['user', 'admin', 'paiduser']), (req: AuthRequest, res) => {
  // Example: Return user profile
  res.json({ user: req.user });
});

userRouter.put('/me', requireAuth(['user', 'admin', 'paiduser']), (req: AuthRequest, res) => {
  // Example: Update user profile
  res.json({ success: true });
});
