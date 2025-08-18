import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Required environment variables (relaxed for development)
const requiredEnvVars = process.env.NODE_ENV === 'production' ? [
  'DATABASE_URL',
  'JWT_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
] : []; // No required vars for development

// Validate required environment variables
export const validateEnv = (): void => {
  const missingEnvVars: string[] = [];
  
  for (const envVar of requiredEnvVars) {
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
  
  console.log('✅ Environment configuration loaded');
};

// Export validated environment variables with defaults for development
export const env = {
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  allowedOrigins: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    process.env.NODE_ENV === 'production' ? [] : ['*'],
  logLevel: process.env.LOG_LEVEL || 'info',
};
