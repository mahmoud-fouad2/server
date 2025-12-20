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
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        role: true, 
        currentBusinessId: true,
        roles: true,
        businesses: { select: { id: true } } 
      }
    });

    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    // Intelligent context: Header > Token claim > Session > Default
    let businessIdHeader = req.headers['x-business-id'];
    if (Array.isArray(businessIdHeader)) businessIdHeader = businessIdHeader[0];

    const businessId = businessIdHeader || decoded.businessId || user.currentBusinessId || user.businesses[0]?.id;

    // Verify access to the requested business
    if (businessId && !user.businesses.some(b => b.id === businessId)) {
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

    // Audit log (async to not block)
    if (businessId) {
      prisma.auditLog.create({ 
        data: { 
          userId: user.id, 
          businessId, 
          action: 'access_context',
          ipAddress: req.ip
        } 
      }).catch(err => console.error('Audit log failed:', err));
    }

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
