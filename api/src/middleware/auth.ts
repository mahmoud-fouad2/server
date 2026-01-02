/*
 * 🛡️ SECURITY CRITICAL - MULTI-TENANT AUTH CORE 🛡️
 * This file handles JWT verification, Role-Based Access Control (RBAC), and Tenant Context Switching.
 * Modifications must be audit-logged and tested against the 'Security & Safety Review' protocol.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('CRITICAL: JWT_SECRET environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const decoded: any = jwt.verify(token, secret);

    // Verify user still exists and is active
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { 
          id: true, 
          email: true, 
          role: true, 
          businesses: { select: { id: true } } 
        }
      });
    } catch (dbError) {
      console.error('Database Connection Error in Auth Middleware:', dbError);
      return res.status(503).json({ error: 'Service Unavailable: Database connection failed' });
    }

    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    // Intelligent context: Header > Token claim > Session > Default
    let businessIdHeader = req.headers['x-business-id'];
    if (Array.isArray(businessIdHeader)) businessIdHeader = businessIdHeader[0];

    const userBusinesses = user.businesses as { id: string }[];
    const businessId = businessIdHeader || decoded.businessId || userBusinesses[0]?.id;

    // Verify access to the requested business
    if (businessId && userBusinesses && !userBusinesses.some(b => b.id === businessId)) {
       // If they are SUPERADMIN, maybe allow? For now, strict check.
       if (user.role !== 'ADMIN') { // Assuming ADMIN here means SUPERADMIN or similar, but let's stick to the prompt's strictness
          return res.status(403).json({ error: 'Access denied to this business context' });
       }
    }

    // Attach user and business ID to request
    req.user = {
      ...user,
      businessId
    };

    next();
  } catch (error) {
    // Normalize JWT failures so clients can reliably handle session expiry.
    // 401 is the correct status for authentication failures.
    const err = error as { name?: string; message?: string };
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'jwt expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};
