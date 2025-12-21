import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.TEST_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

const logsMock = [
  { id: 'l1', action: 'USER_CREATE', createdAt: new Date().toISOString(), user: { name: 'Ali', email: 'ali@example.com' }, meta: { target: 'user', id: 'u1' } },
];

test.describe('Admin Audit Logs E2E', () => {
  test.beforeEach(async ({ page }) => {
    const isLive = !!process.env.PLAYWRIGHT_LIVE;
    if (!isLive) {
      await page.route('**/api/admin/system/audit-log*', route => route.fulfill({ status: 200, body: JSON.stringify({ data: logsMock, pagination: { total: 1, totalPages: 1, page: 1 } }) }));
    }

      // Inject an admin token + user so the admin UI loads in both local (stubbed)
      // and live modes. In CI or production runs you can set PLAYWRIGHT_ADMIN_TOKEN
      // / PLAYWRIGHT_ADMIN_USER to override these values.
      const token = process.env.PLAYWRIGHT_ADMIN_TOKEN || 'test-admin-token';
      const user =
        process.env.PLAYWRIGHT_ADMIN_USER || JSON.stringify({ id: 'test-admin', role: 'ADMIN' });
      await page.addInitScript(({ token, user }) => {
        try {
          localStorage.setItem('token', token);
          localStorage.setItem('user', user);
        } catch (e) {}
      }, { token, user });
  });

  test('shows audit logs and supports filters', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin`);

    // Open Audit tab in sidebar
    await page.getByRole('button', { name: /سجل التدقيق|Audit/ }).click();

    // Expect the log entry to be visible
    await expect(page.getByText('USER_CREATE')).toBeVisible();
    await expect(page.getByText(/Ali/)).toBeVisible();

    // Apply action filter and ensure fetch is triggered with filter
    await page.getByLabel('action-filter').fill('USER_CREATE');
    await page.getByRole('button', { name: /تطبيق|Apply/ }).click();

    // The UI should still show our mocked row
    await expect(page.getByText('USER_CREATE')).toBeVisible();
  });
});
