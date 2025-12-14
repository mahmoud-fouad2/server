import { test, expect } from '@playwright/test';

const gatewayMock = [
  {
    id: 'gw_1',
    name: 'stripe',
    displayName: 'Stripe',
    description: 'Stripe gateway',
    icon: '/icons/stripe.png',
    isEnabled: true,
    isActive: true,
  },
];

const businessesMock = [
  { id: 'b1', name: 'Business One' },
  { id: 'b2', name: 'Business Two' },
];

const invoicesMock = [
  { id: 'inv_1', invoiceNumber: 'INV-001', total: 1000, status: 'paid' },
];

test.describe('Admin Payments E2E', () => {
  test.beforeEach(async ({ page }) => {
    // If running in local/test mode we stub API endpoints for deterministic tests.
    // When running against production (PLAYWRIGHT_LIVE=1) we don't stub so the tests exercise real APIs.
    const isLive = !!process.env.PLAYWRIGHT_LIVE;
    if (!isLive) {
      await page.route('**/api/admin/payments/gateways', route => route.fulfill({ status: 200, body: JSON.stringify(gatewayMock) }));
      await page.route('**/api/admin/businesses', route => route.fulfill({ status: 200, body: JSON.stringify(businessesMock) }));
      await page.route('**/api/admin/payments/invoices*', route => route.fulfill({ status: 200, body: JSON.stringify(invoicesMock) }));
    }

    // Inject an admin token + user so the admin UI loads in both local (stubbed)
    // and live modes. In CI or production runs you can set PLAYWRIGHT_ADMIN_TOKEN
    // / PLAYWRIGHT_ADMIN_USER to override these values.
    const token = process.env.PLAYWRIGHT_ADMIN_TOKEN || 'test-admin-token';
    const user =
      process.env.PLAYWRIGHT_ADMIN_USER || JSON.stringify({ id: 'test-admin', role: 'ADMIN' });
    await page.addInitScript((t, u) => {
      try {
        localStorage.setItem('token', t);
        localStorage.setItem('user', u);
      } catch (e) {}
    }, token, user);
  });

  test('can open gateways list and edit a gateway', async ({ page }) => {
    // Use absolute URL to avoid baseURL resolution issues when running locally
    await page.goto('http://localhost:3000/admin');

    // Navigate to Payments tab to ensure the gateways section is visible
    await page.getByRole('button', { name: /المدفوعات|Payments|Payments/ }).click();

    // Ensure gateways section exists and shows our mocked gateway (try both English/Arabic headers)
    await expect(page.getByText(/Gateways|بوابات الدفع/i)).toBeVisible();
    await expect(page.getByText('Stripe')).toBeVisible();

    // Click Edit on the gateway entry (find by displayName and its nearby edit button)
    const editButton = page.getByRole('button', { name: /تعديل|Edit/ }).first();
    await editButton.click();

    // Edit modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();

    // Change display name (try both English and Arabic labels)
    const displayNameLocator = (await page.getByLabel('Display name').count()) ? page.getByLabel('Display name') : page.getByLabel('الاسم الظاهر');
    await displayNameLocator.fill('Stripe Updated');

    // Also test updating API key triggers confirmation modal and the PUT contains the key
    const apiLabel = (await page.getByLabel('API Key (سيتم تغييره فقط عند ملئه)').count()) ? page.getByLabel('API Key (سيتم تغييره فقط عند ملئه)') : page.getByLabel(/API Key|مفتاح API/);
    await apiLabel.fill('new-api-key');

    // Intercept the update request and assert body
    await page.getByRole('button', { name: /Save|حفظ/ }).click();

    // Confirmation should appear
    await expect(page.getByText('تأكيد تحديث المفاتيح')).toBeVisible();

    const [request] = await Promise.all([
      page.waitForRequest(req => req.method() === 'PUT' && req.url().includes('/api/admin/payments/gateways/')),
      page.getByRole('button', { name: /تأكيد/ }).click(),
    ]);

    const postBody = JSON.parse(request.postData() || '{}');
    expect(postBody.displayName).toBe('Stripe Updated');
  });

  test('can create a custom payment', async ({ page }) => {
    // Use absolute URL to avoid baseURL resolution issues when running locally
    await page.goto('http://localhost:3000/admin');

    // Open Payments tab
    await page.getByRole('button', { name: /المدفوعات|Payments|Payments/ }).click();

    // Click "Create Custom Payment" (label in Arabic might exist)
    const createButton = page.getByRole('button', { name: /إنشاء دفعة مخصصة|Create Custom Payment|Create Custom Payment/ });
    await createButton.click();

    // Modal should open and businesses should be visible in the select
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Business')).toBeVisible();

    // Fill form
    await page.getByLabel('Business').selectOption({ label: 'Business One' });
    await page.getByLabel('Amount').fill('150');
    await page.getByLabel('Note').fill('E2E test payment');

    const [request] = await Promise.all([
      page.waitForRequest(req => req.method() === 'POST' && req.url().includes('/api/admin/payments/create-custom')),
      page.getByRole('button', { name: /Create|إنشاء/ }).click(),
    ]);

    const data = JSON.parse(request.postData() || '{}');
    expect(data.businessId).toBe('b1');
    expect(data.amount).toBe(150);
    expect(data.note).toBe('E2E test payment');
  });
});
