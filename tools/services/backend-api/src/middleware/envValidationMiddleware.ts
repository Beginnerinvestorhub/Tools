// beginnerinvestorhub/tools/services/backend-api/src/middleware/envValidationMiddleware.ts

import { z, ZodError } from 'zod';

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
 * Validates required environment variables at application startup.
 * If validation fails, it logs the errors and exits the process.
 */
export const validateEnvironment = (): void => {
  try {
    // Zod can parse `process.env` directly
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully.');
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('❌ Environment validation failed. Critical environment variables are missing:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      // Exit the process if critical environment variables are missing, regardless of NODE_ENV.
      process.exit(1);
    } else {
      console.error('An unexpected error occurred during environment validation:', error);
      process.exit(1);
    }
  }
};

// You can still export it as default if you prefer that pattern
export default validateEnvironment;
