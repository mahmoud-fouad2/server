// Jest configuration (CommonJS) — use babel-jest to transform ESM source into
// CommonJS so tests can run reliably in the current environment.
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  // transform JS files using babel-jest
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  // Ignore node_modules by default (can be customized to include certain packages)
  transformIgnorePatterns: ['/node_modules/'],
  // Treat .js files as ESM sources so babel-jest runs for them when needed
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {},
  globals: {},
};
