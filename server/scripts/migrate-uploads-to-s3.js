#!/usr/bin/env node
/*
  Migrate local uploads (widget icons, knowledge original files) to S3.
  Usage:
    node migrate-uploads-to-s3.js [--execute] [--only=widgets|knowledge|all] [--dry-run]

  By default it runs in dry-run mode and lists findings.
  To actually perform uploads and DB updates, pass --execute
  Requires AWS env vars for execution: AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
*/

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
let prisma = null;
try {
  prisma = require('../src/config/database');
} catch (e) {
  prisma = null;
}
const storageService = require('../src/services/storage.service');
const logger = require('../src/utils/logger');

let argv = null;
try {
  argv = require('minimist')(process.argv.slice(2));
} catch (e) {
  console.error('Please `npm i minimist mime-types` before running this script or add them to your package.json dependencies.');
  process.exit(1);
}
const execute = !!argv.execute || argv._.includes('execute');
const only = argv.only || 'all';
const dryRun = argv['dry-run'] !== undefined ? !!argv['dry-run'] : !execute;
const localMode = !!argv.local || (argv.mode && argv.mode === 'local');

async function resolveLocalPathFromUrl(url) {
  try {
    // If full URL, extract pathname
    if (url.startsWith('http')) {
      const u = new URL(url);
      url = u.pathname;
    }
  } catch (e) { /* ignore */ }

  // Ensure the path points inside /uploads
  const idx = url.indexOf('/uploads/');
  if (idx === -1) return null;
  const rel = url.substring(idx + 1); // remove leading '/'
  const local = path.join(process.cwd(), 'public', rel);
  return local;
}

function guessContentType(filename) {
  const ct = mime.lookup(filename) || 'application/octet-stream';
  return ct;
}

async function migrateWidgets() {
  logger.info('Scanning businesses for widget customIconUrl entries');
  if (!prisma) {
    logger.warn('Database module not available - skipping business->widgetConfig scan');
    return [];
  }
  let businesses = [];
  try {
    businesses = await prisma.business.findMany({ select: { id: true, widgetConfig: true } });
  } catch (e) {
    logger.warn('Database not available or query failed - skipping business scan', e.message || e);
    return [];
  }
  const ops = [];
  for (const b of businesses) {
    if (!b.widgetConfig) continue;
    let cfg = null;
    try { cfg = typeof b.widgetConfig === 'string' ? JSON.parse(b.widgetConfig) : b.widgetConfig; } catch (e) { continue; }
    const url = cfg.customIconUrl;
    if (!url) continue;
    if (!url.includes('/uploads/')) continue; // only local uploads

    const local = await resolveLocalPathFromUrl(url);
    if (!local) {
      ops.push({ businessId: b.id, status: 'skip', reason: 'could not resolve local path', url });
      continue;
    }
    const exists = fs.existsSync(local);
    ops.push({ businessId: b.id, url, local, exists });
    if (execute && exists && storageService.isS3Enabled()) {
      const filename = path.basename(local);
      const contentType = guessContentType(filename);
      const destKey = `uploads/icons/${filename}`;
      try {
        const s3Url = await storageService.uploadFile(local, destKey, contentType);
        // Update DB
        cfg.customIconUrl = s3Url;
        await prisma.business.update({ where: { id: b.id }, data: { widgetConfig: JSON.stringify(cfg) } });
        ops.push({ businessId: b.id, action: 'uploaded', s3Url });
      } catch (e) {
        ops.push({ businessId: b.id, action: 'upload_failed', error: e.message || e });
      }
    }

    // Option: persist locally in a stable public location and update DB (for environments without S3)
    if (execute && exists && localMode) {
      try {
        const targetDir = path.join(process.cwd(), 'public', 'uploads', 'persistent', `${b.id}`);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        const filename = `${Date.now()}-${path.basename(local)}`;
        const dest = path.join(targetDir, filename);
        fs.copyFileSync(local, dest);
        const publicPath = `/uploads/persistent/${b.id}/${filename}`;
        cfg.customIconUrl = `${process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : ''}${publicPath}`;
        if (prisma) await prisma.business.update({ where: { id: b.id }, data: { widgetConfig: JSON.stringify(cfg) } });
        ops.push({ businessId: b.id, action: 'local_persisted', publicPath });
      } catch (e) {
        ops.push({ businessId: b.id, action: 'local_persist_failed', error: e.message || e });
      }
    }
  }
  return ops;
}

async function migrateKnowledge() {
  logger.info('Scanning knowledgeBase entries for originalFileUrl to migrate');
  if (!prisma) {
    logger.warn('Database module not available - skipping knowledgeBase scan');
    return [];
  }
  let kbs = [];
  try {
    kbs = await prisma.knowledgeBase.findMany({ where: { metadata: { not: null } }, select: { id: true, businessId: true, metadata: true } });
  } catch (e) {
    logger.warn('Database not available or query failed - skipping knowledge scan', e.message || e);
    return [];
  }
  const ops = [];
  for (const kb of kbs) {
    const url = kb.metadata && kb.metadata.originalFileUrl;
    if (!url) continue;
    if (!url.includes('/uploads/')) continue;
    const local = await resolveLocalPathFromUrl(url);
    if (!local) { ops.push({ kbId: kb.id, status: 'skip', reason: 'could not resolve local path', url }); continue; }
    const exists = fs.existsSync(local);
    ops.push({ kbId: kb.id, url, local, exists });
    if (execute && exists && storageService.isS3Enabled()) {
      const filename = path.basename(local);
      const contentType = guessContentType(filename);
      const destKey = `uploads/knowledge/${kb.businessId}/${Date.now()}-${filename}`;
      try {
        const s3Url = await storageService.uploadFile(local, destKey, contentType);
        await prisma.knowledgeBase.update({ where: { id: kb.id }, data: { metadata: { ...(kb.metadata || {}), originalFileUrl: s3Url } } });
        ops.push({ kbId: kb.id, action: 'uploaded', s3Url });
      } catch (e) {
        ops.push({ kbId: kb.id, action: 'upload_failed', error: e.message || e });
      }
    }
    if (execute && exists && localMode) {
      try {
        const targetDir = path.join(process.cwd(), 'public', 'uploads', 'knowledge', `${kb.businessId}`);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        const filename = `${Date.now()}-${path.basename(local)}`;
        const dest = path.join(targetDir, filename);
        fs.copyFileSync(local, dest);
        const publicPath = `/uploads/knowledge/${kb.businessId}/${filename}`;
        if (prisma) await prisma.knowledgeBase.update({ where: { id: kb.id }, data: { metadata: { ...(kb.metadata || {}), originalFileUrl: `${process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : ''}${publicPath}` } } });
        ops.push({ kbId: kb.id, action: 'local_persisted', publicPath });
      } catch (e) {
        ops.push({ kbId: kb.id, action: 'local_persist_failed', error: e.message || e });
      }
    }
  }
  return ops;
}

async function main() {
  logger.info('--- migrate-uploads-to-s3 starting ---');
  logger.info('Options', { dryRun, execute, only });

  if (!execute) logger.info('Running in dry-run mode. No changes will be made. Pass --execute to perform uploads and DB updates.');

  if (only === 'widgets' || only === 'all') {
    const w = await migrateWidgets();
    logger.info('Widgets scan complete', { count: w.length });
    if (!w || w.length === 0) {
      // Try filesystem scan fallback: look for files under public/uploads/icons
      const iconsDir = path.join(process.cwd(), 'public', 'uploads', 'icons');
      if (fs.existsSync(iconsDir)) {
        const files = fs.readdirSync(iconsDir).map(f => ({ local: path.join(iconsDir, f), suggestedDest: `uploads/icons/${f}` }));
        logger.info('Filesystem icons found (DB not available)', { count: files.length });
        console.table(files.slice(0, 50));
      } else {
        logger.info('No icons directory found at', iconsDir);
      }
    } else {
      console.table(w.slice(0, 50));
    }
  }

  if (only === 'knowledge' || only === 'all') {
    const k = await migrateKnowledge();
    logger.info('Knowledge scan complete', { count: k.length });
    if (!k || k.length === 0) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        // list top-level files (avoid huge recursions automatically)
        const files = [];
        function walk(dir) {
          for (const f of fs.readdirSync(dir)) {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) walk(p);
            else files.push({ local: p, suggestedDest: `uploads/${path.relative(path.join(process.cwd(), 'public', 'uploads'), p)}` });
          }
        }
        walk(uploadsDir);
        logger.info('Filesystem uploads found (DB not available)', { count: files.length });
        console.table(files.slice(0, 50));
      } else {
        logger.info('No uploads directory found at', uploadsDir);
      }
    } else {
      console.table(k.slice(0, 50));
    }
  }

  logger.info('--- migrate-uploads-to-s3 finished ---');
  process.exit(0);
}

main().catch(e => { logger.error('Migration failed', e); process.exit(1); });
