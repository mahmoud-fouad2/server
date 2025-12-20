// @ts-check
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    // Always build then serve so local runs are consistent with CI and avoid requiring manual exports
    command: 'npm run build && npm run serve:out',
    port: 3000,
    timeout: 180 * 1000,
    // If a server is already running (local dev), reuse it to avoid double-starting
    reuseExistingServer: true,
  },
};
module.exports = config;
