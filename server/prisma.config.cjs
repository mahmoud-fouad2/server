// CommonJS Prisma config fallback for environments where TS/ESM parsing fails
// Ensures `prisma migrate deploy` can read the datasource during build.
(function () {
  'use strict';
  try { require('dotenv').config(); } catch (e) { /* ignore */ }

  let defineConfig;
  try {
    // Prefer Prisma's defineConfig when available
    defineConfig = require('@prisma/config').defineConfig;
  } catch (e) {
    // If @prisma/config is not available in the runtime, fall back to identity
    defineConfig = function (x) { return x; };
  }

  module.exports = defineConfig({
    datasources: {
      db: {
        provider: 'postgresql',
        url: process.env.DATABASE_URL || undefined
      }
    }
  });
})();
