#!/usr/bin/env node
/**
 * Helper script to safely fill NULL `User.name` values and set the column NOT NULL.
 * Use this when you cannot run `prisma migrate deploy` (e.g., you want to apply the data-fix manually).
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/apply-user-name-migration.js
 */

const { Client } = require('pg');
const logger = require('../src/utils/logger');

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.PGBOUNCER_URL;
  if (!dbUrl || !/^postgres(?:ql)?:\/\//i.test(dbUrl)) {
    console.error('DATABASE_URL not configured or not a Postgres URL. Aborting.');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    const { rows } = await client.query("SELECT COUNT(*)::int as cnt FROM \"User\" WHERE \"name\" IS NULL OR TRIM(COALESCE(\"name\",'')) = ''");
    const nullCount = rows[0].cnt;
    console.log(`Users with NULL/empty name: ${nullCount}`);

    if (nullCount === 0) {
      console.log('No NULL names found. Nothing to do.');
      return;
    }

    console.log('Applying safe update to populate missing names...');
    await client.query('BEGIN');

    await client.query(`
      UPDATE "User"
      SET "name" = COALESCE(NULLIF(TRIM("fullName"), ''), SUBSTRING("email" FROM '^[^@]+'), id::text)
      WHERE "name" IS NULL OR TRIM(COALESCE("name",'')) = '';
    `);

    // Re-check
    const { rows: rows2 } = await client.query("SELECT COUNT(*)::int as cnt FROM \"User\" WHERE \"name\" IS NULL OR TRIM(COALESCE(\"name\",'')) = ''");
    const remaining = rows2[0].cnt;
    if (remaining > 0) {
      console.error(`After update, ${remaining} rows still have NULL/empty name. Aborting without altering schema.`);
      await client.query('ROLLBACK');
      process.exit(2);
    }

    console.log('Setting column `name` to NOT NULL...');
    await client.query('ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;');

    await client.query('COMMIT');
    console.log('Safe migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err?.message || err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    process.exit(3);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
