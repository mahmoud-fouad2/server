import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  datasources: {
    db: {
      provider: 'postgresql',
      // Provide DATABASE_URL at runtime (undefined in build is acceptable)
      url: process.env.DATABASE_URL || undefined,
    }
  },
  // Prefer binary engine by default to avoid needing an adapter in hosted envs
  // The runtime also enforces PRISMA_CLIENT_ENGINE_TYPE=binary in src/config/database.js
});
