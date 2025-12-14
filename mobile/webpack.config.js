const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    // Alias to a local shim that ensures uuidv4 is exported for web builds
    'expo-modules-core': require.resolve('./src/shims/expo-modules-core-shim.js'),
    // Provide a safe stub for expo-constants on web to avoid accessing
    // NativeModulesProxy.ExpoUpdates when NativeModulesProxy may be undefined.
     // Alias expo-constants to a lightweight shim on web so it doesn't try to access
     // native modules like ExpoUpdates which are undefined in the browser build.
     'expo-constants': require.resolve('./src/shims/expo-constants-shim.js'),
  };

  return config;
};
