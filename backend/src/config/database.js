import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      bufferCommands: false
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Handle initial connection errors
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected - attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err}`);
  // Attempt to reconnect on error
  mongoose.connect(process.env.MONGODB_URI).catch(err => {
    logger.error(`Reconnection failed: ${err}`);
  });
});

// Handle successful reconnection
mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected successfully');
});

export default connectDB;
