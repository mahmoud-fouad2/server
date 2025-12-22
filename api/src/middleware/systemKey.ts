import { Request, Response, NextFunction } from 'express';

/**
 * Lightweight guard for internal automation (deploy hooks, maintenance scripts, etc.)
 * Provides cache flushing access without requiring a full JWT session.
 */
export const authenticateSystemKey = (req: Request, res: Response, next: NextFunction) => {
  const configuredKey = process.env.SYSTEM_MAINTENANCE_KEY;

  if (!configuredKey) {
    return res.status(503).json({ error: 'SYSTEM_MAINTENANCE_KEY is not configured on the server' });
  }

  let provided: string | undefined | string[] =
    req.headers['x-system-key'] ||
    (typeof req.query.systemKey === 'string' ? req.query.systemKey : undefined) ||
    (req.body && typeof req.body === 'object' ? (req.body as Record<string, string>).systemKey : undefined);

  if (Array.isArray(provided)) {
    provided = provided[0];
  }

  if (!provided || provided !== configuredKey) {
    return res.status(401).json({ error: 'Invalid or missing system maintenance key' });
  }

  return next();
};
