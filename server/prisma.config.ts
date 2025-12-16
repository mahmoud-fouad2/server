import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  // Prisma migrate expects a singular `datasource` property when running `prisma migrate deploy`.
  datasource: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL || undefined
  },
  // Prefer binary engine by default to avoid needing an adapter in hosted envs
  // The runtime also enforces PRISMA_CLIENT_ENGINE_TYPE=binary in src/config/database.js
});
