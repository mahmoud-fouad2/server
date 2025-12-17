const { Server } = require('socket.io');
const logger = require('../utils/logger');
const initializeSocket = require('./socketHandler');

let io;

exports.init = (httpServer) => {
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

exports.getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
