import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  // The private key can be long, so we'll handle its presence check carefully
  'FIREBASE_PRIVATE_KEY',
];

// Validate required environment variables
export const validateEnv = (): void => {
  const missingEnvVars: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    // For FIREBASE_PRIVATE_KEY, we just check for presence, not a non-empty string,
    // as it can be complex. The Firebase SDK will validate it.
    const value = process.env[envVar];
    if (!value) {
      missingEnvVars.push(envVar);
    }
  }
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
    console.error('\nPlease set these environment variables and restart the application.');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are present');
};

// Export validated environment variables
export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    // Replace escaped newlines for Firebase private key
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  allowedOrigins: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    // In production, if not set, default to no origins allowed for safety.
    // In development, default to allowing all origins.
    process.env.NODE_ENV === 'production' ? [] : ['*'],
  logLevel: process.env.LOG_LEVEL || 'info',
};
