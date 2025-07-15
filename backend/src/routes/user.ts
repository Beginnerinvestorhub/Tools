import { Router, Request } from 'express';
import { requireAuth } from '../utils/requireAuth';
import rateLimit from 'express-rate-limit';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: any;
}

export const userRouter = Router();

// Rate limiter: maximum 100 requests per 15 minutes
const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

userRouter.get('/me', userRateLimiter, requireAuth(['user', 'admin', 'paiduser']), (req: AuthRequest, res) => {
  // Example: Return user profile
  res.json({ user: req.user });
});

userRouter.put('/me', userRateLimiter, requireAuth(['user', 'admin', 'paiduser']), (req: AuthRequest, res) => {
  // Example: Update user profile
  res.json({ success: true });
});
