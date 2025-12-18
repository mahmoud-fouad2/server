module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        // Use commonjs modules so Jest can run transformed code reliably
        modules: 'commonjs',
      },
    ],
  ],
  plugins: [
    '@babel/plugin-syntax-import-meta',
    '@babel/plugin-syntax-dynamic-import',
    [
      '@babel/plugin-transform-runtime',
      {
        helpers: true,
        regenerator: true,
      },
    ],
  ],
};
