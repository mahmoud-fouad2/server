module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script'
  },
  rules: {
    // Disallow console but allow warn/error by default
    'no-console': ['error', { 'allow': ['warn', 'error'] }],
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
  },
  overrides: [
    {
      files: ['src/utils/logger.js'],
      rules: {
        // Allow console inside the centralized logger
        'no-console': 'off'
      }
    }
  ]
};
