// Jest configuration (CommonJS) — use babel-jest to transform ESM source into
// CommonJS so tests can run reliably.
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  // transform JS files using babel-jest
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  // Ignore node_modules by default (can be customized to include certain packages)
  transformIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {},
  globals: {},
  // Load test setup before running tests (mocks like @prisma/client are registered there)
  setupFiles: ['<rootDir>/tests/jest.setup.js'],
};
