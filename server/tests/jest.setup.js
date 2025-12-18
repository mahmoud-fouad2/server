// Jest setup file: ensure minimal DATABASE_URL for tests that construct PrismaClient directly
// Provide sensible defaults for test environment
// Default to empty DATABASE_URL in tests to avoid creating a real Prisma client unless explicitly configured
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.PGBOUNCER_URL = process.env.PGBOUNCER_URL || '';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-which-is-very-long-and-secure-12345';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'fake-gemini-key-for-tests';
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
process.env.CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || '';
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || '';
// Provide a lightweight mock for @prisma/client so tests that call `new PrismaClient()`
// can be executed without a real database. This mock is minimal and returns jest.fn
// methods so tests can spy on them. Tests that need full DB behavior should provide
// their own mocks or integration setup.
if (typeof jest !== 'undefined') {
  const makeModel = () => ({
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(null),
    deleteMany: jest.fn().mockResolvedValue(null),
    groupBy: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({}),
    $queryRaw: jest.fn().mockResolvedValue([])
  });

  jest.mock('@prisma/client', () => ({
    PrismaClient: function PrismaClient() {
      return new Proxy({}, {
        get(target, prop) {
          // provide common models and fall back to generic model with jest.fn methods
          if (prop === '$connect') return jest.fn().mockResolvedValue(true);
          if (prop === '$disconnect') return jest.fn().mockResolvedValue(true);
          if (!target[prop]) target[prop] = makeModel();
          return target[prop];
        }
      });
    }
  }));
}

