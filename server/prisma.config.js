// JS fallback config for Prisma (used in production where TypeScript transpilation
// may not be available for prisma.config.ts).
require('dotenv').config();

module.exports = {
  datasources: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL || undefined
    }
  }
};
