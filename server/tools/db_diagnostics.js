#!/usr/bin/env node
/*
 DB diagnostics script
 - Measures simple SELECT latency (multiple iterations)
 - Collects row counts for key tables
 - Runs EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) for a sample query
 - Writes a JSON report to server/logs/db_diagnostics_<timestamp>.json

Usage: from repo root run `node server/tools/db_diagnostics.js`
*/

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const prisma = require('../src/config/database');

function nowMs() {
  const [s, ns] = process.hrtime();
  return s * 1e3 + ns / 1e6;
}

async function runSelectLatency(iterations = 20) {
  const times = [];
  // Warmup
  await prisma.$queryRaw`SELECT 1`;
  for (let i = 0; i < iterations; i++) {
    const t0 = nowMs();
    await prisma.$queryRaw`SELECT 1`;
    const t1 = nowMs();
    times.push(t1 - t0);
  }
  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const p50 = times[Math.floor(times.length * 0.5)];
  const p90 = times[Math.floor(times.length * 0.9)];
  const p99 = times[Math.floor(times.length * 0.99)] || times[times.length - 1];
  return { iterations, times, avg, min: times[0], max: times[times.length - 1], p50, p90, p99 };
}

async function getTableCounts() {
  const tables = [
    '"KnowledgeChunk"',
    '"KnowledgeBase"',
    '"Conversation"',
    '"Message"',
    '"Business"',
    '"SystemLog"',
  ];
  const results = {};
  for (const t of tables) {
    try {
      const res = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint as cnt FROM ${t}`);
      // prisma returns an array-like result
      const cnt = res && res[0] && (res[0].cnt ?? res[0].count ?? Object.values(res[0])[0]);
      results[t.replace(/"/g, '')] = Number(cnt || 0);
    } catch (err) {
      results[t.replace(/"/g, '')] = { error: err.message };
    }
  }
  return results;
}

async function runExplainSample() {
  // Choose a sample query that is representative: recent messages retrieval
  const sampleQuery = `SELECT "id","conversationId","createdAt" FROM \"Message\" ORDER BY \"createdAt\" DESC LIMIT 100`;
  try {
    const explainSql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sampleQuery}`;
    const res = await prisma.$queryRawUnsafe(explainSql);
    // res typically is [{ QUERY PLAN: '...json...' }] or [{ 'QUERY PLAN': [{...}] }]
    return res;
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  console.log('[db_diagnostics] Starting DB diagnostics');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const report = { timestamp: new Date().toISOString(), host: process.env.DATABASE_HOST || null, results: {} };
  try {
    await prisma.$connect();
    console.log('[db_diagnostics] Connected to DB');

    report.results.selectLatency = await runSelectLatency(30);
    console.log('[db_diagnostics] SELECT latency measured');

    report.results.tableCounts = await getTableCounts();
    console.log('[db_diagnostics] Table counts collected');

    report.results.explain = await runExplainSample();
    console.log('[db_diagnostics] EXPLAIN sample collected');

  } catch (err) {
    console.error('[db_diagnostics] Error during diagnostics:', err.message);
    report.error = err.message;
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
  }

  const logsDir = path.resolve(__dirname, '..', 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  const outPath = path.join(logsDir, `db_diagnostics_${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`[db_diagnostics] Report written to ${outPath}`);
  console.log('[db_diagnostics] Summary:');
  if (report.results && report.results.selectLatency) {
    const s = report.results.selectLatency;
    console.log(`  iterations: ${s.iterations}, avg: ${s.avg.toFixed(2)}ms, min: ${s.min.toFixed(2)}ms, max: ${s.max.toFixed(2)}ms, p90: ${s.p90.toFixed(2)}ms`);
  }
  console.log('[db_diagnostics] Done');
}

if (require.main === module) {
  main().catch(err => {
    console.error('[db_diagnostics] Fatal error:', err);
    process.exit(1);
  });
}
