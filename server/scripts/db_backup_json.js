#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

(async function main(){
  try {
    const dbUrl = process.env.DATABASE_URL || process.env.PGBOUNCER_URL;
    if (!dbUrl) {
      console.error('DATABASE_URL or PGBOUNCER_URL must be set');
      process.exit(1);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
    const destDir = path.join(__dirname, '..', 'tmp', `db-backup-${timestamp}`);
    fs.mkdirSync(destDir, { recursive: true });

    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    console.log('Connected to DB, fetching table list...');
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type='BASE TABLE'
    `);

    const tables = tablesRes.rows.map(r => r.table_name).filter(Boolean);
    console.log('Found tables:', tables.join(', '));

    for (const table of tables) {
      console.log(`Exporting table: ${table}`);
      const res = await client.query(`SELECT * FROM "${table}"`);
      const outPath = path.join(destDir, `${table}.json`);
      fs.writeFileSync(outPath, JSON.stringify(res.rows, null, 2), 'utf8');
    }

    // Also export schema (basic) via information_schema
    const schemaRes = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    fs.writeFileSync(path.join(destDir, 'schema_columns.json'), JSON.stringify(schemaRes.rows, null, 2), 'utf8');

    await client.end();
    console.log('Backup completed. Directory:', destDir);
    process.exit(0);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(2);
  }
})();