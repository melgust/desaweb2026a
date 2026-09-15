import { test, expect, Page } from '@playwright/test';

const login = async (page: Page) => {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(process.env.E2E_EMAIL ?? 'admin@enterprise.com');
  await page.locator('input[type="password"]').fill(process.env.E2E_PASSWORD ?? 'Admin123!');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/products$/);
};

test('products -> cart with two products -> one invoice detail', async ({ page }) => {
  await login(page);
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  const headers = { Authorization: `Bearer ${token}` };
  const current = await page.request.get('/order-api/orders/current', { headers });
  expect(current.status(), 'Use an account without an existing draft').toBe(404);
  let invoiceId: string | undefined;
  try {
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    for (const index of [0, 1]) {
      await rows.nth(index).getByRole('button', { name: 'Agregar al pedido' }).click();
      const form = page.locator('form');
      await expect(form.locator('select option')).not.toHaveCount(1);
      await form.locator('select').selectOption({ index: 1 });
      await form.locator('input[type="number"]').fill(index === 0 ? '2' : '1');
      await form.getByRole('button', { name: 'Agregar al pedido' }).click();
      await expect(page.getByRole('status')).toContainText('Producto agregado');
    }
    await page.getByRole('link', { name: 'Pedidos (3)' }).click();
    await expect(page.locator('table tbody tr')).toHaveCount(2);
    await page.locator('table tbody tr').first().locator('input').fill('3');
    await page.locator('table tbody tr').first().getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('link', { name: 'Pedidos (4)' })).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Confirmar y generar factura', exact: true }).click();
    await expect(page).toHaveURL(/\/invoices\/[a-f0-9-]+$/);
    invoiceId = page.url().split('/').pop();
    await expect(page.getByRole('status')).toContainText('factura se generó correctamente');
    await expect(page.locator('table tbody tr')).toHaveCount(2);
    await expect(page.getByRole('link', { name: 'Pedidos (0)' })).toBeVisible();
    await page.getByRole('link', { name: 'Editar factura' }).click();
    await expect(page.getByLabel('Cantidad 1', { exact: true })).toHaveValue('3');
    await page.getByLabel('Cantidad 1', { exact: true }).fill('4');
    await page.getByRole('button', { name: 'Guardar factura' }).click();
    await expect(page).toHaveURL(new RegExp(`/invoices/${invoiceId}$`));
    await expect(page.locator('table tbody tr')).toHaveCount(2);
    await expect(page.locator('table tbody tr').first().locator('td').nth(2)).toHaveText('4');
  } finally {
    if (invoiceId) await page.request.delete(`/api/invoices/${invoiceId}`, { headers });
    else await page.request.delete('/order-api/orders/current', { headers });
  }
});

test('failed confirmation preserves cart; 404 clears expired data', async ({ page }) => {
  let expired = false;
  const order = { id: 'e2e', status: 'DRAFT', expiresAt: new Date(Date.now() - 1000).toISOString(), updatedAt: new Date().toISOString(), subtotal: 20, total: 20,
    items: [{ productId: 'a'.repeat(24), productName: 'Producto de prueba', supplierId: 'b'.repeat(24), supplierName: 'Proveedor', quantity: 2, unitPrice: 10, subtotal: 20 }] };
  await page.route('**/order-api/orders/current', route => route.fulfill({ status: expired ? 404 : 200, json: expired ? { message: 'Missing' } : order }));
  await page.route('**/order-api/orders/confirm', route => route.fulfill({ status: 503, json: { message: 'No se pudo generar la factura.' } }));
  await login(page); await page.getByRole('link', { name: 'Pedidos (2)' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Confirmar y generar factura' }).click();
  await expect(page.getByRole('alert')).toContainText('No se pudo generar');
  await expect(page.locator('table tbody tr')).toHaveCount(1);
  expired = true;
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await expect(page.locator('table')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('expiró');
  await expect(page.getByRole('link', { name: 'Pedidos (0)' })).toBeVisible();
});
