/**
 * Standardized Error Handler Middleware
 * Provides consistent error responses across the API
 */

const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // ✅ SANITIZE REQUEST DATA before logging
  const sanitizedBody = sanitizeLogData(req.body);

  // Log error
  logger.error('API Error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: sanitizedBody
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // Prisma errors
  if (err.code === 'P2002') {
    const message = 'Duplicate entry';
    error = new AppError(message, 400);
  }

  if (err.code === 'P2025') {
    const message = 'Record not found';
    error = new AppError(message, 404);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Something went wrong!',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// Catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Handle unhandled promise rejections
const handleUnhandledRejections = () => {
  process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Rejection:', err && (err.message || err));
    logger.error('Unhandled Rejection', err);
    // In production, it's safer to fail fast so an external process manager can restart the app.
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => process.exit(1), 1000);
    }
  });
};

// Handle uncaught exceptions
const handleUncaughtExceptions = () => {
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err && (err.message || err));
    logger.error('Uncaught Exception', err);
    // In production, exit after logging so process manager can restart the service.
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => process.exit(1), 1000);
    }
  });
};

// ✅ HELPER FUNCTION to sanitize sensitive data from logs
function sanitizeLogData(data) {
  if (!data || typeof data !== 'object') return {};
  
  const sanitized = { ...data };
  const sensitiveFields = [
    'password',
    'token',
    'apikey',
    'secret',
    'authorization',
    'creditcard',
    'ssn',
    'pin',
    'jwt'
  ];
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

module.exports = {
  AppError,
  errorHandler,
  catchAsync,
  handleUnhandledRejections,
  handleUncaughtExceptions
};