/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Authentication Middleware Unit Tests
 * ═══════════════════════════════════════════════════
 */

const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole } = require('../../src/middleware/auth');

// Mock dependencies
jest.mock('../../src/config/database');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Authentication Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
      user: null
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();

    // Set test JWT secret
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
  });

  describe('authenticateToken', () => {
    test('should reject request without authorization header', async () => {
      mockReq.headers = {};

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with malformed authorization header', async () => {
      mockReq.headers.authorization = 'InvalidFormat';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.'
      });
    });

    test('should reject request with invalid JWT token', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid token'
      });
    });

    test('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'test-user', role: 'CLIENT' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid token'
      });
    });

    test('should accept valid token and set user', async () => {
      const validToken = jwt.sign(
        {
          userId: 'test-user-123',
          role: 'CLIENT',
          email: 'test@example.com'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      mockReq.headers.authorization = `Bearer ${validToken}`;

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual({
        userId: 'test-user-123',
        role: 'CLIENT',
        email: 'test@example.com',
        iat: expect.any(Number),
        exp: expect.any(Number)
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should lookup businessId from database when not in token', async () => {
      const tokenWithoutBusinessId = jwt.sign(
        { userId: 'test-user-123', role: 'CLIENT' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      mockReq.headers.authorization = `Bearer ${tokenWithoutBusinessId}`;

      const mockUser = {
        id: 'test-user-123',
        businesses: [{ id: 'business-456' }]
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Force DB lookup in tests to validate behavior
      process.env.FORCE_AUTH_DB_LOOKUP = 'true';
      await authenticateToken(mockReq, mockRes, mockNext);
      delete process.env.FORCE_AUTH_DB_LOOKUP;

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-123' },
        include: { businesses: true }
      });

      expect(mockReq.user.businessId).toBe('business-456');
      expect(mockNext).toHaveBeenCalled();
    });

    test('should lookup businessId by email when userId not available', async () => {
      const tokenWithEmail = jwt.sign(
        { email: 'test@example.com', role: 'CLIENT' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      mockReq.headers.authorization = `Bearer ${tokenWithEmail}`;

      const mockUser = {
        id: 'test-user-123',
        businesses: [{ id: 'business-789' }]
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Force DB lookup in tests to validate behavior
      process.env.FORCE_AUTH_DB_LOOKUP = 'true';
      await authenticateToken(mockReq, mockRes, mockNext);
      delete process.env.FORCE_AUTH_DB_LOOKUP;

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { businesses: true }
      });

      expect(mockReq.user.businessId).toBe('business-789');
    });

    test('should handle database lookup failure gracefully', async () => {
      const tokenWithoutBusinessId = jwt.sign(
        { userId: 'test-user-123', role: 'CLIENT' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      mockReq.headers.authorization = `Bearer ${tokenWithoutBusinessId}`;

      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      // Should still proceed without businessId
      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.user.businessId).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle user with no businesses', async () => {
      const tokenWithoutBusinessId = jwt.sign(
        { userId: 'test-user-123', role: 'CLIENT' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      mockReq.headers.authorization = `Bearer ${tokenWithoutBusinessId}`;

      const mockUser = {
        id: 'test-user-123',
        businesses: [] // No businesses
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.user.businessId).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    test('should allow access when user has required role', () => {
      mockReq.user = { role: 'SUPERADMIN' };

      const middleware = requireRole('SUPERADMIN');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should allow access when user has one of multiple required roles', () => {
      mockReq.user = { role: 'CLIENT' };

      const middleware = requireRole('SUPERADMIN', 'CLIENT', 'AGENT');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should deny access when user lacks required role', () => {
      mockReq.user = { role: 'CLIENT' };

      const middleware = requireRole('SUPERADMIN');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should deny access when user is not authenticated', () => {
      mockReq.user = null;

      const middleware = requireRole('CLIENT');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions'
      });
    });

    test('should handle single role requirement', () => {
      mockReq.user = { role: 'AGENT' };

      const middleware = requireRole('AGENT');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('JWT Token Generation', () => {
    test('should generate valid JWT with correct payload', () => {
      const payload = {
        userId: 'user-123',
        role: 'CLIENT',
        businessId: 'business-456'
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.businessId).toBe(payload.businessId);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    test('should include expiration time in token', () => {
      const payload = { userId: 'user-123', role: 'CLIENT' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.exp - decoded.iat).toBe(24 * 60 * 60); // 24 hours in seconds
    });
  });
});