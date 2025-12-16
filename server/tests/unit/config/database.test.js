const path = require('path');

describe('Prisma database stub behavior', () => {
  const DB_MODULE = path.resolve(__dirname, '../../../src/config/database');
  let originalDbUrl;

  beforeAll(() => {
    originalDbUrl = process.env.DATABASE_URL;
  });

  afterAll(() => {
    if (originalDbUrl !== undefined) process.env.DATABASE_URL = originalDbUrl;
    else delete process.env.DATABASE_URL;
  });

  test('stub returns callable proxies for nested property access and throws a clear error when invoked', async () => {
    // Ensure DATABASE_URL is not set so the module falls back to a stub
    delete process.env.DATABASE_URL;
    jest.resetModules();

    const prisma = require(DB_MODULE);

    // Access a nested accessor like prisma.paymentGateway.findMany
    const maybeFn = prisma.paymentGateway.findMany;

    expect(typeof maybeFn).toBe('function');

    await expect(maybeFn()).rejects.toThrow(/Prisma client is not available/);
  });
});
