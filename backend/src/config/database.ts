import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/homegamehero';
    
    await mongoose.connect(mongoUri, {
      // These options are no longer needed in Mongoose 6+
      // But included for clarity and future configuration
    });

    logger.info('MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDatabase;