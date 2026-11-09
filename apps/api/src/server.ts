import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '@p11/config';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import { setSocketIO } from './utils/socket.util.js';

async function bootstrap() {
  const app = createApp();
  const httpServer = http.createServer(app);

  // Initialize Socket.IO with CORS
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [config.WEB_URL, 'http://localhost:3000'],
      credentials: true,
    },
  });

  setSocketIO(io);

  io.on('connection', (socket) => {
    logger.debug(`Socket client connected: ${socket.id}`);
    socket.on('join', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });
    socket.on('disconnect', () => {
      logger.debug(`Socket client disconnected: ${socket.id}`);
    });
  });

  // Connect to MongoDB
  try {
    await connectDatabase();
  } catch (error) {
    logger.warn('Failed to connect to MongoDB. Server will start in standby mode.');
  }

  const server = httpServer.listen(config.PORT, () => {
    logger.info(`[P11 REST API] Server listening on port ${config.PORT} (${config.NODE_ENV})`);
    logger.info(`[P11 REST API] Base endpoint: http://localhost:${config.PORT}/api/v1`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal error during server bootstrap:', err);
  process.exit(1);
});

