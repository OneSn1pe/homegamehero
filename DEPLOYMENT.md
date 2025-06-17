# Vercel Deployment Guide

## Prerequisites
1. A Vercel account (sign up at vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. MongoDB Atlas database (or other MongoDB hosting)

## Environment Variables
Set these in your Vercel project settings:

### Required Variables
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string for JWT signing

### Optional Variables
- `RATE_LIMIT_WINDOW_MS`: Rate limit window (default: 60000)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)
- `GAME_CREATE_RATE_LIMIT_WINDOW_MS`: Game creation rate limit window (default: 3600000)
- `GAME_CREATE_RATE_LIMIT_MAX_REQUESTS`: Max game creations per window (default: 5)

## Deployment Steps

### 1. Initial Setup
```bash
# Login to Vercel
vercel login

# Link your project
vercel link
```

### 2. Set Environment Variables
```bash
# Set production environment variables
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
```

### 3. Deploy
```bash
# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

## Project Structure
- Frontend: Deployed as static files from `frontend/dist`
- Backend: Deployed as Vercel Functions at `/api/*`
- Database: External MongoDB (Atlas recommended)

## Post-Deployment
1. Update `frontend/.env.production` with your Vercel URL
2. Test the API health endpoint: `https://your-app.vercel.app/api/health`
3. Configure custom domain in Vercel dashboard (optional)

## Troubleshooting
- Check function logs in Vercel dashboard
- Ensure MongoDB IP whitelist includes Vercel IPs (0.0.0.0/0 for simplicity)
- Verify environment variables are set correctly
- Check build logs for any compilation errors