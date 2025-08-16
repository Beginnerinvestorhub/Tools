// beginnerinvestorhub/tools/services/backend-api/src/middleware/envValidationMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

interface EnvError {
  path: (string | number)[];
  message: string;
}

/**
 * Schema for validating required environment variables
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('4000'),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  RISK_CALC_ENGINE_URL: z.string().url(),
});

/**
 * Middleware to validate required environment variables at startup
 * @param req The Express request object
 * @param res The Express response object
 * @param next The Express next middleware function
 */
export const validateEnvironment = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate environment variables
      envSchema.parse({
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        FRONTEND_URL: process.env.FRONTEND_URL,
        RISK_CALC_ENGINE_URL: process.env.RISK_CALC_ENGINE_URL,
      });
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Environment validation failed:');
        error.errors.forEach((err: any) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        
        // In production, we should exit the process if environment variables are missing
        if (process.env.NODE_ENV === 'production') {
          console.error('Critical environment variables are missing. Shutting down...');
          process.exit(1);
        }
        
        next(new Error('Environment validation failed'));
      } else {
        next(error);
      }
    }
  };
};

export default validateEnvironment;
