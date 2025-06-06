import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import adminRoutes from './routes/adminRoutes';
import videoRoutes from './routes/videoRoutes';

dotenv.config(); // Load environment variables from .env file

const app: Express = express();

// Initialize database connection
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

export default app; 