/**
 * Admin Knowledge Base Management Routes
 * Manage knowledge base entries across all businesses for SUPERADMIN
 */

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const logger = require('../utils/logger');
const asyncHandler = require('express-async-handler');
const { requireRole } = require('../middleware/authorization');

// All routes require authentication
router.use(authenticateToken);

// ============================================
// 📚 KNOWLEDGE BASE MANAGEMENT
// ============================================

/**
 * @route   GET /api/admin/knowledge
 * @desc    Get all knowledge base entries with pagination
 * @access  SUPERADMIN
 */
router.get(
  '/knowledge',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, businessId = '', search = '', type = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(businessId && { businessId }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [entries, total] = await Promise.all([
      prisma.knowledgeBase.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              planType: true
            }
          }
        }
      }),
      prisma.knowledgeBase.count({ where })
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  })
);

/**
 * @route   GET /api/admin/knowledge/stats
 * @desc    Get knowledge base statistics
 * @access  SUPERADMIN
 */
router.get(
  '/knowledge/stats',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const [
      totalEntries,
      entriesByType,
      entriesByBusiness,
      recentEntries
    ] = await Promise.all([
      prisma.knowledgeBase.count(),
      prisma.knowledgeBase.groupBy({
        by: ['type'],
        _count: { id: true }
      }),
      prisma.knowledgeBase.groupBy({
        by: ['businessId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }).then(async (groups) => {
        const businessIds = groups.map(g => g.businessId);
        const businesses = await prisma.business.findMany({
          where: { id: { in: businessIds } },
          select: { id: true, name: true }
        });
        return groups.map(g => ({
          businessId: g.businessId,
          businessName: businesses.find(b => b.id === g.businessId)?.name || 'Unknown',
          count: g._count.id
        }));
      }),
      prisma.knowledgeBase.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          business: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalEntries,
        byType: entriesByType.reduce((acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        }, {}),
        byBusiness: entriesByBusiness,
        recent: recentEntries
      }
    });
  })
);

/**
 * @route POST /api/admin/knowledge/pgvector-migrate
 * @desc  Create pgvector extension, add embedding_vector column and migrate JSON embeddings
 * @access SUPERADMIN
 */
router.post('/knowledge/pgvector-migrate', requirePermission('system:write'), asyncHandler(async (req, res) => {
  const { sync = false } = req.body || {};
  // Run asynchronously by default to avoid blocking HTTP requests for long DB jobs
  if (!sync) {
    try {
      const spawn = require('child_process').spawn;
      const script = 'node';
      const args = [require('path').join(__dirname, '../../scripts/create_pgvector_extension.js')];

      // Start the first script detached
      const proc1 = spawn(script, args, {
        detached: true,
        stdio: 'ignore'
      });
      proc1.unref();

      // Chain the migrate script with a small wrapper so it runs after the first script finishes
      const migrateProc = spawn('node', [require('path').join(__dirname, '../../scripts/migrate_embeddings_to_vector.js')], {
        detached: true,
        stdio: 'ignore'
      });
      migrateProc.unref();

      // Record a simple status file so admins can check progress if needed
      try {
        const fs = require('fs');
        const status = {
          startedAt: new Date().toISOString(),
          sync: false,
          note: 'Migration started in background by admin request'
        };
        fs.writeFileSync(require('path').join(__dirname, '../../tmp/pgvector_migrate_status.json'), JSON.stringify(status, null, 2));
      } catch (e) {
        // ignore status write failures
      }

      return res.status(202).json({ success: true, message: 'Migration started in background (async). Use admin logs to follow progress.' });
    } catch (err) {
      console.error('Failed to start migration asynchronously', err);
      return res.status(500).json({ success: false, error: 'Failed to start migration' });
    }
  }

  // If sync=true, run the scripts synchronously and return detailed result
  try {
    const { createPgVector } = require('../../scripts/create_pgvector_extension');
    const { migrate } = require('../../scripts/migrate_embeddings_to_vector');

    await createPgVector();
    await migrate();

    return res.json({ success: true, message: 'pgvector extension ensured and embeddings migrated (if any).' });
  } catch (err) {
    console.error('pgvector migration failed', err);
    return res.status(500).json({ success: false, error: err.message || 'Migration failed' });
  }
}));

/**
 * Public but protected trigger for environments where DB auth may block.
 * Use with caution: requires a pre-shared secret `ADMIN_MIGRATE_SECRET` set in env
 * Header: x-admin-migrate-secret: <secret>
 */
router.post('/knowledge/pgvector-migrate/trigger', asyncHandler(async (req, res) => {
  try {
    const secret = req.headers['x-admin-migrate-secret'];
    if (!process.env.ADMIN_MIGRATE_SECRET) return res.status(500).json({ success: false, error: 'Admin migrate secret not configured' });
    if (!secret || secret !== process.env.ADMIN_MIGRATE_SECRET) return res.status(403).json({ success: false, error: 'Access denied. Invalid secret.' });

    // Start background scripts (non-blocking)
    const spawn = require('child_process').spawn;
    const node = process.execPath || 'node';
    const createScript = require('path').join(__dirname, '../../scripts/create_pgvector_extension.js');
    const migrateScript = require('path').join(__dirname, '../../scripts/migrate_embeddings_to_vector.js');

    spawn(node, [createScript], { detached: true, stdio: 'ignore' }).unref();
    spawn(node, [migrateScript], { detached: true, stdio: 'ignore' }).unref();

    // write status file
    try {
      const fs = require('fs');
      const p = require('path').join(__dirname, '../../tmp/pgvector_migrate_status.json');
      fs.writeFileSync(p, JSON.stringify({ startedAt: new Date().toISOString(), triggeredBy: 'secret', status: 'started' }, null, 2));
    } catch (e) {}

    return res.status(202).json({ success: true, message: 'Migration triggered in background (secret trigger)' });
  } catch (err) {
    console.error('secret trigger failed', err);
    return res.status(500).json({ success: false, error: 'Failed to trigger migration' });
  }
}));

router.get('/knowledge/pgvector-migrate/trigger/status', asyncHandler(async (req, res) => {
  try {
    const secret = req.headers['x-admin-migrate-secret'];
    if (!process.env.ADMIN_MIGRATE_SECRET) return res.status(500).json({ success: false, error: 'Admin migrate secret not configured' });
    if (!secret || secret !== process.env.ADMIN_MIGRATE_SECRET) return res.status(403).json({ success: false, error: 'Access denied. Invalid secret.' });
    const fs = require('fs');
    const p = require('path').join(__dirname, '../../tmp/pgvector_migrate_status.json');
    if (!fs.existsSync(p)) return res.json({ success: true, status: null, message: 'No migration status found' });
    const raw = fs.readFileSync(p, 'utf8');
    const status = JSON.parse(raw);
    res.json({ success: true, status });
  } catch (err) {
    console.error('Failed to read trigger status', err);
    res.status(500).json({ success: false, error: 'Failed to read status' });
  }
}));

// Admin endpoint to check last async migration status
router.get('/knowledge/pgvector-migrate/status', requirePermission('system:read'), asyncHandler(async (req, res) => {
  try {
    const fs = require('fs');
    const p = require('path').join(__dirname, '../../tmp/pgvector_migrate_status.json');
    if (!fs.existsSync(p)) return res.json({ success: true, status: null, message: 'No migration status found' });
    const raw = fs.readFileSync(p, 'utf8');
    const status = JSON.parse(raw);
    res.json({ success: true, status });
  } catch (err) {
    console.error('Failed to read migrate status', err);
    res.status(500).json({ success: false, error: 'Failed to read status' });
  }
}));

/**
 * @route   DELETE /api/admin/knowledge/:id
 * @desc    Delete knowledge base entry
 * @access  SUPERADMIN
 */
router.delete(
  '/knowledge/:id',
  requirePermission('system:delete'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.knowledgeBase.delete({
      where: { id }
    });

    logger.warn(`Admin ${req.user.email} deleted knowledge entry ${id}`);

    res.json({
      success: true,
      message: 'Knowledge entry deleted successfully'
    });
  })
);

/**
 * @route   POST /api/admin/knowledge/bulk-delete
 * @desc    Bulk delete knowledge base entries
 * @access  SUPERADMIN
 */
router.post(
  '/knowledge/bulk-delete',
  requirePermission('system:delete'),
  asyncHandler(async (req, res) => {
    const { entryIds } = req.body;

    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'entryIds array is required'
      });
    }

    const result = await prisma.knowledgeBase.deleteMany({
      where: {
        id: { in: entryIds }
      }
    });

    logger.warn(`Admin ${req.user.email} bulk deleted ${result.count} knowledge entries`);

    res.json({
      success: true,
      message: `Deleted ${result.count} knowledge entries`,
      count: result.count
    });
  })
);

module.exports = router;

