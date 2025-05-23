import express from 'express';
import { askQuestion, searchVideosByKeyword } from '../controllers/videoController'; 

const router = express.Router();

// GET /api/search?keyword=searchterm
// PRD Section 6.3: GET /api/search
router.get('/search', searchVideosByKeyword as express.RequestHandler);

// POST /api/ask
// PRD Section 6.3: POST /api/ask
router.post('/ask', askQuestion as express.RequestHandler);

export default router;