import { Router } from 'express';
import { requireAuth } from '../utils/requireAuth';
import rateLimit from 'express-rate-limit';

export const dashboardRouter = Router();

// Configure rate limiter: maximum 100 requests per 15 minutes
const dashboardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter
dashboardRouter.use(dashboardRateLimiter);

dashboardRouter.get('/', requireAuth(['user', 'paiduser']), (req, res) => {
  // Example: Return dashboard data
  res.json({ data: 'dashboard data' });
});
