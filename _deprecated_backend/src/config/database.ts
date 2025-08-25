// Database configuration for PostgreSQL
import { Pool } from 'pg';
import { env } from './env';

// Database connection configuration
const dbConfig = {
  connectionString: env.databaseUrl,
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: true } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Database connection test
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Initialize database (create tables if they don't exist)
export const initializeDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    
    // Read and execute gamification schema
    const fs = require('fs');
    const path = require('path');
    const gamificationSchemaPath = path.join(__dirname, '../../database/schema/gamification.sql');
    if (fs.existsSync(gamificationSchemaPath)) {
      const schema = fs.readFileSync(gamificationSchemaPath, 'utf8');
      await client.query(schema);
    }

    // Read and execute education schema
    const educationSchemaPath = path.join(__dirname, '../../database/schema/education.sql');
    if (fs.existsSync(educationSchemaPath)) {
      const eduSchema = fs.readFileSync(educationSchemaPath, 'utf8');
      await client.query(eduSchema);
    }

    // Read and execute challenges schema
    const challengesSchemaPath = path.join(__dirname, '../../database/schema/challenges.sql');
    if (fs.existsSync(challengesSchemaPath)) {
      const challengesSchema = fs.readFileSync(challengesSchemaPath, 'utf8');
      await client.query(challengesSchema);
    }
    console.log('✅ Database schemas initialized');
    
    // Read and execute seed data
    const seedPath = path.join(__dirname, '../../database/seeds/gamification_data.sql');
    
    if (fs.existsSync(seedPath)) {
      const seedData = fs.readFileSync(seedPath, 'utf8');
      await client.query(seedData);
      console.log('✅ Database seed data loaded');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

// Handle process termination
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);
