const fs = require('fs');
const path = require('path');
const statusPath = path.join(__dirname, '../tmp/pgvector_migrate_status.json');

async function writeStatus(obj) {
  try {
    fs.writeFileSync(statusPath, JSON.stringify(obj, null, 2));
  } catch (e) {
    // ignore
  }
}

(async function run() {
  await writeStatus({ startedAt: new Date().toISOString(), status: 'starting', steps: [] });

  try {
    const { createPgVector } = require('./create_pgvector_extension');
    await writeStatus({ startedAt: new Date().toISOString(), status: 'creating_extension' });
    try {
      await createPgVector();
      await writeStatus({ startedAt: new Date().toISOString(), status: 'extension_created' });
    } catch (e) {
      await writeStatus({ startedAt: new Date().toISOString(), status: 'extension_failed', error: e.message || String(e) });
      // continue to migration attempt
    }

    const { migrate } = require('./migrate_embeddings_to_vector');
    await writeStatus({ startedAt: new Date().toISOString(), status: 'migrating_embeddings' });
    try {
      await migrate();
      await writeStatus({ finishedAt: new Date().toISOString(), status: 'finished', message: 'Migration completed successfully' });
    } catch (e) {
      await writeStatus({ finishedAt: new Date().toISOString(), status: 'failed', error: e.message || String(e) });
    }
  } catch (err) {
    await writeStatus({ finishedAt: new Date().toISOString(), status: 'failed', error: err.message || String(err) });
    process.exitCode = 1;
  }
})();

module.exports = {};
