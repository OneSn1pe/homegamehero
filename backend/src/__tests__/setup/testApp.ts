import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from '../../routes';
import { errorHandler } from '../../middleware/errorHandler';

export const createTestApp = (): Express => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use('/api', routes);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};