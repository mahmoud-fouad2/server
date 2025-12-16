import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  datasources: {
    db: {
      provider: 'postgresql',
      // Only pass the URL when present; otherwise let Prisma CLI/runtime
      // treat it as undefined so migrate deploy can fail early and be
      // skipped where appropriate.
      url: process.env.DATABASE_URL || undefined
    }
  }
});
