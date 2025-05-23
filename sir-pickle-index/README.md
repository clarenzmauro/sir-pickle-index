# Sir Pickle Index

A semantic search application for Sir Pickle video transcripts with AI-powered Q&A capabilities.

## Features

- **AI Q&A**: Ask questions about Sir Pickle content and get AI-generated answers
- **Keyword Search**: Search for specific terms in video transcripts
- **Category Filtering**: Filter search results by video categories
- **Admin Dashboard**: Upload new video transcripts and manage content

## Development Setup

### Client Setup
```bash
cd client
npm install
npm run dev
```

### Server Setup
```bash
cd server
npm install
npm run dev
```

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

Create a `.env` file in the server directory with:
```env
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
# or
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## API Endpoints

- `POST /api/ask` - Ask AI questions about content
- `GET /api/search` - Keyword search with optional filtering
- `POST /api/admin/upload` - Upload new video transcripts (admin only)

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB with vector embeddings
- **AI Services**: OpenAI/Google AI for embeddings and chat completion 