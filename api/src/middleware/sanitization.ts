import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';
import logger from '../utils/logger.js';

const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  allowedAttributes: {
    'a': ['href', 'target'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      sanitizeObject(req.query);
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error('Sanitization error:', error);
    next(error);
  }
};

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove potential XSS
      obj[key] = sanitizeHtml(obj[key], sanitizeOptions);
      
      // Remove SQL injection attempts
      obj[key] = obj[key].replace(/('|(--)|;|(\*)|(%)|(<)|(>)|(\+)|(=))/gi, '');
      
      // Trim whitespace
      obj[key] = obj[key].trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

export const sanitizeHtmlContent = (content: string): string => {
  return sanitizeHtml(content, sanitizeOptions);
};

export const strictSanitize = (content: string): string => {
  return sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {},
  });
};
