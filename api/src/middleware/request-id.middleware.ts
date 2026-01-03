/**
 * Request ID Middleware
 * Generates unique ID for each request for tracing across services
 */
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  requestId: string;
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate or use existing request ID
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  
  // Attach to request
  (req as RequestWithId).requestId = requestId;
  
  // Set in response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
}
