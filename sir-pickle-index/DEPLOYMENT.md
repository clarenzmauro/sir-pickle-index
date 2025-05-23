# Deployment Guide for Sir Pickle Index

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up a MongoDB database at [mongodb.com/atlas](https://www.mongodb.com/atlas)
3. **Google AI API Key**: Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Environment Variables

Before deploying, you need to set up the following environment variables in Vercel:

### Required Environment Variables

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
GOOGLE_API_KEY=your-google-generative-ai-api-key
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   ```bash
   vercel
   ```

4. **Set environment variables**:
   ```bash
   vercel env add MONGODB_URI
   vercel env add GOOGLE_API_KEY
   vercel env add JWT_SECRET
   vercel env add NODE_ENV production
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Build Settings**:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm run install:all`

3. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all required environment variables mentioned above

4. **Deploy**:
   - Click "Deploy"

## Project Structure

```
sir-pickle-index/
├── api/                    # Vercel serverless functions
│   └── index.ts           # API entry point
├── client/                # React frontend
│   ├── src/
│   ├── dist/             # Build output
│   └── package.json
├── server/               # Express backend
│   ├── src/
│   │   ├── app.ts       # Express app configuration
│   │   └── server.ts    # Local development server
│   └── package.json
├── package.json          # Root package.json for monorepo
├── vercel.json          # Vercel configuration
└── env.example          # Environment variables template
```

## Local Development

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Set up environment variables**:
   - Copy `env.example` to `.env` in the server directory
   - Fill in your actual values

3. **Start development servers**:
   ```bash
   npm run dev
   ```

This will start both the client (port 5173) and server (port 3001) concurrently.

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Ensure all environment variables are set
   - Check that MongoDB URI is accessible from Vercel
   - Verify TypeScript compilation with `npm run build:server`

2. **API Routes Not Working**:
   - Check that `/api/*` routes are properly configured in `vercel.json`
   - Ensure serverless function is properly exporting the Express app

3. **Database Connection Issues**:
   - Verify MongoDB URI format and credentials
   - Ensure MongoDB Atlas allows connections from Vercel (whitelist all IPs: 0.0.0.0/0)

4. **Environment Variables**:
   - Double-check all required environment variables are set in Vercel
   - Verify variable names match exactly (case-sensitive)

### Performance Optimization

- The client build includes code splitting for vendor libraries
- Serverless functions have cold start considerations
- Consider implementing caching strategies for API responses

## Production Considerations

1. **Security**:
   - Use strong JWT secrets
   - Implement rate limiting for API endpoints
   - Validate all user inputs

2. **Monitoring**:
   - Set up Vercel Analytics
   - Monitor serverless function performance
   - Track database connection health

3. **Scaling**:
   - Consider implementing Redis for session storage
   - Monitor MongoDB Atlas performance metrics
   - Optimize database queries and indexing 