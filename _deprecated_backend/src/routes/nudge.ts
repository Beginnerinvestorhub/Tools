import { Router } from 'express';
import rateLimit from 'express-rate-limit';

export const nudgeRouter = Router();

// Rate limiter for nudge requests (more restrictive than general API limiter)
// 10 requests per hour per IP
const nudgeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many nudge requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all routes in this router
nudgeRouter.use(nudgeRateLimiter);

// POST /api/nudge - Get AI behavioral nudge
nudgeRouter.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    
    // In a real implementation, this would call the AI behavioral nudge engine
    // For now, we'll return a simple response
    const nudge = `Thanks for your message: "${message}". Keep up the great work on your investment journey!`;
    
    res.json({ nudge });
  } catch (error) {
    console.error('Error generating nudge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
