import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import routes from '../../routes';
import { errorHandler } from '../../middleware/errorHandler';
import { securityMiddleware } from '../../middleware/security';

export const createTestApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(mongoSanitize());
  
  // Apply security middleware (but not rate limiting for tests)
  app.use(securityMiddleware);

  // API routes
  app.use('/api', routes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};