import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/loader.ts',
      name: 'FahimoWidget',
      fileName: (format) => `fahimo-loader.${format}.js`,
      formats: ['iife']
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});
