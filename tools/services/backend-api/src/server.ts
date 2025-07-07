import app from './app'; // Import the configured Express app
import { connectDB } from './services/dbService'; // Assuming you'll have a dbService

// Load environment variables (already done in app.ts, but good to ensure here too if server.ts is direct entry)
// dotenv.config(); // Not strictly needed here if app.ts is guaranteed to run first, but harmless.

const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// Function to start the server
const startServer = async () => {
  try {
    // Connect to the database
    // Ensure DATABASE_URI is set in your .env file
    await connectDB();
    console.log('Database connected successfully!');

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1); // Exit process with failure
  }
};

// Call the function to start the server
startServer();

