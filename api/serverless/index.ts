import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import { connectDB } from '../../backend/src/config/database';
import gameRoutes from '../../backend/src/routes/gameRoutes';
import { errorHandler } from '../../backend/src/middleware/errorHandler';
import { createRateLimiter, apiRateLimiter } from '../../backend/src/middleware/rateLimiter';
import logger from '../../backend/src/utils/logger';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Rate limiting
app.use('/api/', apiRateLimiter);
app.use('/api/games', createRateLimiter);

// Routes
app.use('/api/games', gameRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Connect to MongoDB
  await connectDB();

  // Create a promise to handle the request
  return new Promise((resolve) => {
    // Convert Vercel request to Express request
    const server = createServer((req, res) => {
      app(req, res);
    });

    // Forward the request
    server.emit('request', req, res);
    
    // Resolve when response is finished
    res.on('finish', resolve);
  });
}