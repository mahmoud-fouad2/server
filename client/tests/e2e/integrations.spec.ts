import { test, expect } from '@playwright/test';

const whatsappMock = { success: true, message: 'WhatsApp connection successful' };
const telegramMock = { success: true, message: 'Telegram connection successful' };
const infoseedMock = { success: true, message: 'Infoseed OK' };
const facebookMock = { success: true, message: 'Facebook OK' };

test.describe('Admin Integrations E2E', () => {
  test.beforeEach(async ({ page }) => {
    const isLive = !!process.env.PLAYWRIGHT_LIVE;
    if (!isLive) {
      await page.route('**/api/admin/integrations', route => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
      await page.route('**/api/admin/integrations/whatsapp/test', route => route.fulfill({ status: 200, body: JSON.stringify(whatsappMock) }));
      await page.route('**/api/admin/integrations/telegram/test', route => route.fulfill({ status: 200, body: JSON.stringify(telegramMock) }));
      await page.route('**/api/admin/integrations/infoseed/test', route => route.fulfill({ status: 200, body: JSON.stringify(infoseedMock) }));
      await page.route('**/api/admin/integrations/facebook/test', route => route.fulfill({ status: 200, body: JSON.stringify(facebookMock) }));
      await page.route('**/api/admin/businesses*', route => route.fulfill({ status: 200, body: JSON.stringify({ data: [{ id: 'b1', name: 'Test Business' }] }) }));
    }
    // Inject admin token (default for local runs; override with PLAYWRIGHT_ADMIN_TOKEN in CI)
    const token = process.env.PLAYWRIGHT_ADMIN_TOKEN || 'test-admin-token';
    const user = process.env.PLAYWRIGHT_ADMIN_USER || JSON.stringify({ id: 'test-admin', role: 'ADMIN' });
    await page.addInitScript((t, u) => {
      try {
        localStorage.setItem('token', t);
        localStorage.setItem('user', u);
      } catch (e) {}
    }, token, user);
  });

  test('can open integrations tab and test connections', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // Open Integrations tab (use sidebar index to avoid locale label issues)
    const sidebarButtons = page.locator('aside button');
    await sidebarButtons.nth(5).click();

    // Select business
    await page.getByRole('combobox').selectOption({ label: 'Test Business' });

    // Test WhatsApp
    await page.getByRole('button', { name: /Test Connection/ }).first().click();
    await expect(page.getByText(/WhatsApp connection successful|WhatsApp connection successful/)).toBeVisible();
  });
});
