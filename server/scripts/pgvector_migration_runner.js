const fs = require('fs');
const path = require('path');
const statusPath = path.join(__dirname, '../tmp/pgvector_migrate_status.json');

// Ensure tmp directory exists
const tmpDir = path.dirname(statusPath);
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

async function writeStatus(status, error = null) {
  try {
    let current = { startedAt: new Date().toISOString(), status, steps: [] };
    if (fs.existsSync(statusPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
        current = { ...existing, status, steps: existing.steps || [] };
      } catch (e) {}
    }
    current.steps.push({ timestamp: new Date().toISOString(), status, error: error ? (error.message || String(error)) : null });
    fs.writeFileSync(statusPath, JSON.stringify(current, null, 2));
    console.log('Status updated:', status);
  } catch (e) {
    console.error('Failed to write status:', e);
    throw e;
  }
}

(async function run() {
  await writeStatus('starting');

  try {
    const { createPgVector } = require('./create_pgvector_extension');
    await writeStatus('creating_extension');
    try {
      await createPgVector();
      await writeStatus('extension_created');
    } catch (e) {
      await writeStatus('extension_failed', e);
      // continue to migration attempt
    }

    const { migrate } = require('./migrate_embeddings_to_vector');
    await writeStatus('migrating_embeddings');
    try {
      await migrate();
      await writeStatus('finished');
    } catch (e) {
      await writeStatus('failed', e);
    }
  } catch (err) {
    await writeStatus('failed', err);
    process.exitCode = 1;
  }
})();

module.exports = {};
