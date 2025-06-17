import { Router } from 'express';
import gameRoutes from './gameRoutes';
import simpleGameRoutes from './simpleGameRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
// Use simpleGameRoutes for our frontend
router.use('/games', simpleGameRoutes);
// Keep original routes at /v1/games for backwards compatibility
router.use('/v1/games', gameRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
    },
  });
});

export default router;