const express = require('express');
const router = express.Router();
const prisma = require('../config/database');

// Protected internal endpoint to fix NULL User.name values when shell access
// is not available. Requires ADMIN_MIGRATION_SECRET header to match env.
router.post('/run-user-name-fix', async (req, res) => {
  const secret = req.headers['x-admin-migration-secret'] || req.query.secret;
  if (!process.env.ADMIN_MIGRATION_SECRET || secret !== process.env.ADMIN_MIGRATION_SECRET) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  try {
    const before = await prisma.$queryRaw`SELECT COUNT(*)::int as cnt FROM "User" WHERE "name" IS NULL OR TRIM(COALESCE("name",'')) = ''`;
    const beforeCnt = before && before[0] ? before[0].cnt : 0;

    if (beforeCnt === 0) {
      return res.json({ success: true, message: 'No NULL names found', before: 0, after: 0 });
    }

    await prisma.$executeRawUnsafe(`UPDATE "User" SET "name" = COALESCE(NULLIF(TRIM("fullName"), ''), SUBSTRING("email" FROM '^[^@]+'), id::text) WHERE "name" IS NULL OR TRIM(COALESCE("name",'')) = ''`);

    const afterRes = await prisma.$queryRaw`SELECT COUNT(*)::int as cnt FROM "User" WHERE "name" IS NULL OR TRIM(COALESCE("name",'')) = ''`;
    const afterCnt = afterRes && afterRes[0] ? afterRes[0].cnt : 0;

    res.json({ success: true, message: 'User name fix applied', before: beforeCnt, after: afterCnt });
  } catch (err) {
    console.error('Internal migration endpoint failed', err?.message || err);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

module.exports = router;
