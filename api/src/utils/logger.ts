import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console
const consoleFormat = printf(({ level, message, timestamp, stack, requestId, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  
  // Add requestId if present
  if (requestId) {
    msg += ` [reqId:${requestId}]`;
  }
  
  msg += `: ${message}`;
  
  // Remove sensitive data before logging
  const sanitizedMetadata = sanitizeMetadata(metadata);
  if (Object.keys(sanitizedMetadata).length > 0) {
    msg += ` ${JSON.stringify(sanitizedMetadata)}`;
  }
  
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

// Sanitize sensitive data from logs
function sanitizeMetadata(metadata: any): any {
  const sanitized = { ...metadata };
  const sensitiveKeys = ['password', 'apiKey', 'token', 'secret', 'authorization', 'api_key'];
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '***REDACTED***';
    }
  }
  
  return sanitized;
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fahimo-api-v2' },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
    // Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level `error` and below to `error.log`
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Create logs directory if it doesn't exist
import { existsSync, mkdirSync } from 'fs';
if (!existsSync('logs')) {
  mkdirSync('logs');
}

export default logger;
