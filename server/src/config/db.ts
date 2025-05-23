import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(
    'FATAL ERROR: MONGO_URI is not defined in .env file.'
  );
  process.exit(1); // Exit the application if DB URI is missing
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DATABASE]: MongoDB connected successfully.');

    // Optional: Listen for connection events
    mongoose.connection.on('error', (err) => {
      console.error(`[DATABASE]: MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[DATABASE]: MongoDB disconnected.');
    });
  } catch (error) {
    console.error(`[DATABASE]: Could not connect to MongoDB: ${error}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;