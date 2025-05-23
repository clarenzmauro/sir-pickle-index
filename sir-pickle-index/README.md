# Sir Pickle Index

A semantic search application for Sir Pickle video transcripts with AI-powered Q&A capabilities.

## Features

- **AI Q&A**: Ask questions about Sir Pickle content and get AI-generated answers
- **Keyword Search**: Search for specific terms in video transcripts
- **Category Filtering**: Filter search results by video categories
- **Admin Dashboard**: Upload new video transcripts and manage content

## Quick Start

### Development Setup
```bash
# Install all dependencies
npm run install:all

# Start both client and server in development mode
npm run dev

# Or start individually
npm run dev:client    # React app on http://localhost:5173
npm run dev:server    # Express API on http://localhost:3001
```

### Build for Production
```bash
# Build both client and server
npm run build

# Or build individually
npm run build:client
npm run build:server
```

### Deployment Check
```bash
# Verify all files are ready for deployment
npm run deploy-check
```

## Deployment

This project is configured for deployment on **Vercel** with full-stack support.

### Quick Deploy to Vercel

1. **Prerequisites**:
   - Vercel account
   - MongoDB Atlas database
   - Google AI API key

2. **Deploy**:
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

3. **Set Environment Variables** in Vercel dashboard:
   - `MONGODB_URI`
   - `GOOGLE_API_KEY`
   - `JWT_SECRET`
   - `NODE_ENV=production`

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## Admin Access

To access the admin dashboard for uploading new video transcripts:

1. Navigate to your application URL
2. Add `?admin=true` to the URL (e.g., `http://localhost:5173?admin=true`)
3. This will load the admin interface where you can:
   - Upload video titles
   - Set publication dates
   - Add video URLs
   - Set categories and tags
   - Upload full transcripts

The admin page will automatically chunk the transcript and generate embeddings for semantic search.

## Environment Variables

Copy `env.example` to `.env` in the server directory and fill in your values:
```env
MONGODB_URI=your_mongodb_connection_string
GOOGLE_API_KEY=your_google_ai_api_key
JWT_SECRET=your_jwt_secret
PORT=3001
NODE_ENV=development
```

## API Endpoints

- `POST /api/ask` - Ask AI questions about content
- `GET /api/search` - Keyword search with optional filtering
- `POST /api/admin/upload` - Upload new video transcripts (admin only)

## Project Structure

```
sir-pickle-index/
├── api/                    # Vercel serverless functions
├── client/                 # React frontend
├── server/                 # Express backend
├── scripts/               # Deployment utilities
├── package.json           # Root package.json (monorepo)
├── vercel.json           # Vercel configuration
└── DEPLOYMENT.md         # Detailed deployment guide
```

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB with vector embeddings
- **AI Services**: Google AI for embeddings and chat completion
- **Deployment**: Vercel (full-stack with serverless functions) 