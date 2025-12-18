// jest.config.js for ESM + Babel support in server
export default {
  testEnvironment: 'node',
  transform: {}, // Let Babel handle transformation
  moduleNameMapper: {},
  verbose: true,
  // Use babel-jest for ESM
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  globals: {},
};
