import { PrismaClient } from '@prisma/client';

// A more robust singleton pattern for Prisma Client.
// This prevents multiple instances in development due to module caching issues.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // For production, you might want to integrate a structured logger.
    // Example: log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Function to connect to the database (optional, as Prisma connects lazily on first query)
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    // In production, consider using a structured logger (e.g., Pino, Winston)
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // If the database is critical for startup, exit the process.
    process.exit(1);
  }
};

// Function to disconnect from the database
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    // In production, consider using a structured logger
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Graceful shutdown logic
async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Closing database connection...`);
  await disconnectDatabase();
  process.exit(0);
}

// Listen for termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default prisma;
