#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const prisma = require('../src/config/database');

async function main() {
  console.log('[db_inspect] Connecting to DB');
  const report = { timestamp: new Date().toISOString(), results: {} };
  try {
    await prisma.$connect();

    // Current activity
    try {
      const activity = await prisma.$queryRawUnsafe(`SELECT pid, state, usename, query, query_start, state_change FROM pg_stat_activity WHERE pid <> pg_backend_pid() ORDER BY query_start DESC LIMIT 20`);
      report.results.activity = activity;
      console.log('[db_inspect] Collected pg_stat_activity rows:', activity.length || 0);
    } catch (e) {
      report.results.activity = { error: e.message };
    }

    // Top statements (requires pg_stat_statements installed)
    try {
      const stats = await prisma.$queryRawUnsafe(`SELECT query, calls, total_time, mean_time, rows FROM pg_stat_statements ORDER BY total_time DESC LIMIT 20`);
      report.results.stat_statements = stats;
      console.log('[db_inspect] Collected pg_stat_statements rows:', stats.length || 0);
    } catch (e) {
      report.results.stat_statements = { error: e.message };
    }

    // Connection counts
    try {
      const counts = await prisma.$queryRawUnsafe(`SELECT state, count(*) FROM pg_stat_activity GROUP BY state`);
      report.results.connection_counts = counts;
    } catch (e) {
      report.results.connection_counts = { error: e.message };
    }

  } catch (err) {
    console.error('[db_inspect] Error:', err.message);
    report.error = err.message;
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
  }

  const outDir = path.resolve(__dirname, '..', 'logs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `db_inspect_${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
  // Handle BigInt serialization from PG results
  const replacer = (_key, value) => (typeof value === 'bigint' ? value.toString() : value);
  fs.writeFileSync(outPath, JSON.stringify(report, replacer, 2));
  console.log('[db_inspect] Written report to', outPath);
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
