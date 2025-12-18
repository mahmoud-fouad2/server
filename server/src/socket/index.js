import { Server } from 'socket.io';
import logger from '../utils/logger.js';
import initializeSocket from './socketHandler.js';

let io;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // Initialize socket handlers
  initializeSocket(io);

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export default { init, getIO };
