import { defineConfig } from 'prisma'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  generator: {
    name: 'client',
    provider: 'prisma-client-js',
    engineType: 'binary',
  },
})