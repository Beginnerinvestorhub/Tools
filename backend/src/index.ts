import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createClient } from 'redis';
import rateLimit from 'express-rate-limit';
import { testConnection, initializeDatabase } from './config/database';
import { validateEnv, env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import apiLimiter from './middlewares/rateLimit';

// Validate environment variables
validateEnv();

const app = express();

// Initialize Redis Client for health checks and other operations
const redisClient = env.redisUrl ? createClient({ url: env.redisUrl }) : null;
if (redisClient) {
  redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  redisClient.connect().catch(err => logger.error('Failed to connect to Redis on startup', err));
}

app.use(apiLimiter);

// Middleware: Dev logger
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Middleware: CORS
// In production, if no ALLOWED_ORIGINS is set, restrict to no origins
// Otherwise, use the configured origins
const corsOptions = env.allowedOrigins && env.allowedOrigins.length > 0 
  ? { origin: env.allowedOrigins }
  : process.env.NODE_ENV === 'production'
  ? { origin: false } // Disable CORS in production if no origins configured
  : { origin: '*' }; // Allow all in development if not configured

app.use(cors(corsOptions));

// Middleware: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

app.use(express.json());

// API Routes
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { dashboardRouter } from './routes/dashboard';
import { adminRouter } from './routes/admin';
import newsletterRouter from './routes/newsletter';
import { nudgeRouter } from './routes/nudge';
import stripeRouter from './routes/stripe';
import profileRouter from './routes/profile';
import gamificationRouter from './routes/gamification';
import { educationRouter } from './routes/education';
import { learningRouter } from './routes/learning';
import { leaderboardRouter } from './routes/leaderboard';
import { challengesRouter } from './routes/challenges';
import esgRouter from './routes/esg';

// OpenAPI Documentation
import {
  serveOpenApiSpec,
  serveSwaggerUI,
  serveReDoc,
  serveDocsLanding,
  docsAuth
} from './middleware/swagger';

// API Documentation Routes (with optional authentication)
app.get('/api/docs', docsAuth, serveDocsLanding);
app.get('/api/docs/swagger', docsAuth, serveSwaggerUI);
app.get('/api/docs/redoc', docsAuth, serveReDoc);
app.get('/api/docs/openapi.json', serveOpenApiSpec);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/profile', profileRouter);
app.use('/api/gamification', gamificationRouter);
app.use('/api/education', educationRouter);
app.use('/api/learning', learningRouter);
app.use('/api/nudge', nudgeRouter);
app.use('/api/gamification/leaderboard', leaderboardRouter);
app.use('/api/gamification/challenges', challengesRouter);
app.use('/api/esg', esgRouter);

// Enhanced Health Check with system status
app.get('/api/health', async (_, res) => {
  let redisStatus: 'healthy' | 'unhealthy' | 'unavailable' = 'unavailable';
  if (redisClient) {
    try {
      await redisClient.ping();
      redisStatus = 'healthy';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      redisStatus = 'unhealthy';
    }
  }

  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: process.env.DATABASE_URL ? 'healthy' : 'unavailable', // This could also be improved with a live check
      stripe: process.env.STRIPE_SECRET_KEY ? 'healthy' : 'unavailable',
      redis: redisStatus
    }
  };

  res.json(healthStatus);
});

// Centralized error handling middleware
// This must be the last middleware in the chain
app.use(errorHandler);

// Add handlers for uncaught exceptions and unhandled rejections
// These are safety nets for errors not caught by Express.
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', { error: error.message, stack: error.stack });
  process.exit(1); // Exit process with failure
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', { reason });
  process.exit(1); // Exit process with failure
});

// Initialize Database and Start Server
if (require.main === module) {
  const PORT = env.port;
  
  // Initialize database connection and schema
  const initServer = async () => {
    try {
      if (process.env.DATABASE_URL) {
        const dbConnected = await testConnection();
        if (dbConnected) {
          await initializeDatabase();
          console.log('🗄️ Database initialized successfully');
        }
      } else {
        console.log('⚠️ Skipping database initialization - DATABASE_URL not provided');
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      console.log('⚠️ Server will continue without database functionality');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation available at http://localhost:${PORT}/api/docs`);
      console.log(`🔧 Environment: ${env.nodeEnv}`);
    });
  };
  
  initServer();

  if (env.nodeEnv !== 'production') {
    console.log('🔧 Loaded ENV:', {
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL,
    });
  }
}

export default app;