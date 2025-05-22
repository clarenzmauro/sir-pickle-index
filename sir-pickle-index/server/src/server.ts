import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import adminRoutes from './routes/adminRoutes';
import videoRoutes from './routes/videoRoutes';
import { generateEmbedding } from './services/embeddingService';

// Temporary test function
const testEmbedding = async () => {
  console.log("Attempting to generate a test embedding...");
  const sampleText = "This is a test sentence for embedding.";
  const embeddingVector = await generateEmbedding(sampleText);

  if (embeddingVector) {
    console.log("Test embedding generated successfully!");
    console.log("Vector (first 10 dimensions):", embeddingVector.slice(0, 10));
    console.log("Vector dimension:", embeddingVector.length); // Should be 768 for text-embedding-004
  } else {
    console.error("Failed to generate test embedding.");
  }
};

dotenv.config(); // Load environment variables from .env file

const app: Express = express();
const port = process.env.PORT || 3001; // Default to 3001 if PORT not set

connectDB();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    message: 'Sir Pickle Index server is healthy!',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/admin', adminRoutes);
app.use('/api', videoRoutes);

// Global error handler (very basic for now)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`[SERVER]: Server is running at http://localhost:${port}`);
  testEmbedding(); // Run the test embedding function
});

export default app; // Optional: export app for testing