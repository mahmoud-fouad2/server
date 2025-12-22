import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const FRONTEND_URL = process.env.TEST_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
const businessId = process.env.TEST_WIDGET_BUSINESS_ID || 'cmjbnkuww00016xj3vu5pww1z';

// Helper to convert hex to rgb string (for assertions)
function hexToRgbStr(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `rgb(${r}, ${g}, ${b})`;
}

test.describe('Faheemly widget', () => {
  test('prevents duplicate instances and updates UI when config changes', async ({ page }) => {
    // Serve the widget script directly from repo to avoid external network dependency
    const widgetPath = path.resolve(__dirname, '../../../server/public/fahimo-widget.js');
    const widgetJs = fs.readFileSync(widgetPath, 'utf8');

    // Route widget script requests to serve the local file
    await page.route('**/fahimo-widget.js**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: widgetJs });
    });

    // Controlled config responses: return current or updated based on flag
    let returnUpdated = false;
    const initialConfig = {
      name: 'Faheemly',
      widgetConfig: { primaryColor: '#00aa00', welcomeMessage: 'مرحباً 1', customIconUrl: null },
      configVersion: Date.now()
    };
    const updatedConfig = {
      name: 'Faheemly Updated',
      widgetConfig: { primaryColor: '#ff00aa', welcomeMessage: 'مرحباً 2', customIconUrl: null },
      configVersion: Date.now() + 1000
    };

    await page.route(`**/api/widget/config/${businessId}**`, async (route) => {
      const body = JSON.stringify(returnUpdated ? updatedConfig : initialConfig);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    });

    // Visit a page on the frontend (homepage) so the script can be injected into a real document
    await page.goto(`${FRONTEND_URL}/`);

    // Inject the widget script twice (simulate duplicate inclusion)
    await page.evaluate(({ src, bid }) => {
      const s1 = document.createElement('script');
      s1.src = src;
      s1.setAttribute('data-business-id', bid);
      document.body.appendChild(s1);

      const s2 = document.createElement('script');
      s2.src = src;
      s2.setAttribute('data-business-id', bid);
      document.body.appendChild(s2);
    }, { src: 'https://fahimo-api.onrender.com/fahimo-widget.js?v=v1', bid: businessId });

    // Wait for the widget container to be created
    await page.waitForSelector(`#fahimo-widget-container[data-business-id="${businessId}"]`, { timeout: 5000 });

    // Ensure only one widget DOM for the business exists
    const widgets = await page.$$(`#fahimo-widget-container[data-business-id="${businessId}"]`);
    expect(widgets.length).toBe(1);

    // Verify initial primary color applied to launcher (as computed style)
    const expectedInitial = hexToRgbStr('#00aa00');
    await page.waitForFunction((expected) => {
      const el = document.getElementById('fahimo-launcher');
      if (!el) return false;
      const bg = window.getComputedStyle(el).backgroundColor;
      return bg === expected;
    }, expectedInitial);

    // Now set flag so subsequent config fetch returns updated config
    returnUpdated = true;

    // Notify widget via BroadcastChannel so it will refresh config (mimic dashboard behavior)
    await page.evaluate((bid) => {
      try {
        const bc = new BroadcastChannel(`fahimo-config-update-${bid}`);
        bc.postMessage({ type: 'CONFIG_UPDATED', timestamp: Date.now() });
      } catch (broadcastError) {
        console.warn('Widget test broadcast channel unavailable, using storage fallback', broadcastError);
        // fallback: set localStorage notify key used by widget's storage listener
        try {
          localStorage.setItem(`fahimo-config-update-${bid}-notify`, String(Date.now()));
        } catch (storageError) {
          console.warn('Widget test failed to update storage notification key', storageError);
        }
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: `fahimo-config-update-${bid}-notify`,
            newValue: String(Date.now()),
          })
        );
      }
    }, businessId);

    // Assert launcher updates to new color
    const expectedUpdated = hexToRgbStr('#ff00aa');
    await page.waitForFunction((expected) => {
      const el = document.getElementById('fahimo-launcher');
      if (!el) return false;
      const bg = window.getComputedStyle(el).backgroundColor;
      return bg === expected;
    }, expectedUpdated, { timeout: 5000 });

    // Ensure still only one widget present
    const widgetsAfter = await page.$$(`#fahimo-widget-container[data-business-id="${businessId}"]`);
    expect(widgetsAfter.length).toBe(1);
  });
});
