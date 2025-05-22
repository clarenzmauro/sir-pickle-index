import express from 'express';
import { uploadVideo } from '../controllers/adminController';

const router = express.Router();

// POST /api/admin/upload
// PRD Section 6.3: POST /api/admin/upload
router.post('/upload', uploadVideo as express.RequestHandler);

// We can add basic protection later if needed, as per PRD.
// For MVP, it's a known URL path.

export default router;