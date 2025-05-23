import express from 'express';
import { askQuestion, searchVideosByKeyword } from '../controllers/videoController'; 

const router = express.Router();

// GET /api/search?keyword=searchterm
// PRD Section 6.3: GET /api/search
router.get('/search', searchVideosByKeyword);

// POST /api/ask
// PRD Section 6.3: POST /api/ask
router.post('/ask', askQuestion);

export default router;