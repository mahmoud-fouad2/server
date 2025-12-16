import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  // For Prisma migrate, specify the datasource configuration
  // The actual connection is handled by @prisma/adapter-pg in src/config/database.js
  datasource: {
    provider: 'postgresql',
    url: process.env.PGBOUNCER_URL || process.env.DATABASE_URL || undefined
  }
});
