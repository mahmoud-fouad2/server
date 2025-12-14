// Minimal shim for expo-constants on web when native modules are not available.
// This avoids runtime errors in the web bundle where `NativeModulesProxy` may be
// undefined or missing `ExpoUpdates`.

const shim = {
  name: 'faheemly-web',
  appOwnership: null,
  executionEnvironment: 'Browser',
  installationId: typeof window !== 'undefined' ? `web-${Math.random().toString(36).slice(2, 9)}` : 'web-install',
  manifest: null,
  // Provide no-op getters for properties used by expo-constants consumers
  get expoConfig() {
    return null;
  },
  get manifest2() {
    return null;
  },
};

// Also export an `ExecutionEnvironment` enum to satisfy consumers that import
// the named export (e.g., `import Constants, { ExecutionEnvironment } from 'expo-constants'`).
const ExecutionEnvironment = {
  Bare: 'Bare',
  Standalone: 'Standalone',
  StoreClient: 'StoreClient',
  Guest: 'Guest',
};

shim.ExecutionEnvironment = ExecutionEnvironment;

// Support both ESM default export and CommonJS named export
module.exports = shim;
exports.default = shim;
exports.ExecutionEnvironment = ExecutionEnvironment;
