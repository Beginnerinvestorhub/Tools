// beginnerinvestorhub/tools/services/backend-api/src/app.ts

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/authRoutes';
import riskAssessmentRoutes from './routes/riskAssessmentRoutes';
import simulationRoutes from './routes/simulationRoutes';
import healthRoutes from './routes/healthRoutes';
import nudgeEngineRoutes from './routes/nudgeEngineRoutes';
import { gamificationRouter } from './routes/gamificationRoutes';
import { learningRouter } from './routes/learningRoutes';
import { profileRouter } from './routes/profileRoutes';

// Import middleware
import { validateEnvironment } from './middleware/envValidationMiddleware';

// Import your custom ApiError class
import { ApiError } from '../../packages/api-types/src'; // Adjust path if needed

// Load environment variables from .env file
dotenv.config();

// Validate environment variables
validateEnvironment();

const app: Application = express();

// Global rate limiting
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(globalRateLimiter);



// Middleware
// Enable CORS for specific origins only in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://yourdomain.com'] 
    : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Add security headers with enhanced Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.firebaseio.com", "https://www.googleapis.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  dnsPrefetchControl: {
    allow: false,
  },
  frameguard: {
    action: 'deny',
  },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: {
    policy: 'no-referrer',
  },
  xssFilter: true,
}));

// Log HTTP requests in a developer-friendly format
app.use(morgan('dev'));

// Parse JSON request bodies
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/risk-assessment', riskAssessmentRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/nudge-engine', nudgeEngineRoutes);
app.use('/api/gamification', gamificationRouter);
app.use('/api/learning', learningRouter);
app.use('/api/profile', profileRouter);

// Root route for API health check
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Beginner Investor Hub Backend API is running!' });
});

// Catch-all for undefined routes (404 Not Found)
app.use((req: Request, res: Response, next: NextFunction) => {
  // If no route handled the request, it's a 404
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404); // Set status to 404
  next(error); // Pass the error to the error handling middleware
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // If the status code was already set by a previous middleware/route, use it, otherwise default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Set the response status code
  res.status(statusCode);

  // Determine the error message and stack trace
  let errorMessage = err.message;
  let errorStack = undefined;

  // Check if it's a custom ApiError
  if (err instanceof ApiError) {
    errorMessage = err.message;
    // ApiError typically doesn't need its own stack unless for deep debugging specific custom errors
    // but we'll include the original error's stack if available and in development mode.
    errorStack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  } else {
    // For generic errors, provide the message and stack (if in development)
    errorStack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  }

  // Send the JSON response
  res.json({
    message: errorMessage,
    stack: errorStack,
  });
});

export default app;

