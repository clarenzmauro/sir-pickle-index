import express from 'express';
import { uploadVideo } from '../controllers/adminController';
import { login, verifyToken } from '../controllers/authController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Authentication routes
router.post('/auth/login', login as express.RequestHandler);
router.get('/auth/verify', verifyToken as express.RequestHandler);

// Protected admin routes
router.post('/upload', authenticateAdmin, uploadVideo as express.RequestHandler);

export default router;