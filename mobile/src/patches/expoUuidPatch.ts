// Polyfill to ensure expo-modules-core exports uuidv4 on web
import { v4 as uuidv4 } from 'uuid';

try {
  // `expo-modules-core` is expected to export uuidv4 in some versions. If not, patch it.
  // We use dynamic require to avoid bundler issues.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ExpoModulesCore = require('expo-modules-core');
  if (ExpoModulesCore && !ExpoModulesCore.uuidv4) {
    ExpoModulesCore.uuidv4 = uuidv4;
  }
} catch (e) {
  // If expo-modules-core not available, we do nothing.
  // This can happen in certain lightweight web builds; failing gracefully is okay.
  // eslint-disable-next-line no-console
  console.warn('expo-modules-core not available to patch uuidv4', e?.message || e);
}
