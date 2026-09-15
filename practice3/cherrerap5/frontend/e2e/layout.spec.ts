import { test, expect, Page } from '@playwright/test';

async function prepare(page: Page) {
  await page.addInitScript(() => {
    const token = btoa('{}') + '.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.layout-test';
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify({ name: 'Administración de compras', email: 'layout@example.test', role: 'Admin' }));
  });
  const items = [
    { productId: 'a'.repeat(24), productName: 'Laptop profesional Nova · 16 GB RAM / 512 GB SSD', supplierId: 'b'.repeat(24), supplierName: 'Distribuidora de tecnología y suministros empresariales', quantity: 2, unitPrice: 187.35, subtotal: 374.7 },
    { productId: 'c'.repeat(24), productName: 'Monitor Atlas 27 pulgadas', supplierId: 'b'.repeat(24), supplierName: 'Distribuidora de tecnología y suministros empresariales', quantity: 1, unitPrice: 224.8, subtotal: 224.8 }
  ];
  const order = { id: 'layout', status: 'DRAFT', expiresAt: new Date(Date.now() + 86400000).toISOString(), updatedAt: new Date().toISOString(), items, subtotal: 599.5, total: 599.5 };
  await page.route('**/order-api/orders/current', route => route.fulfill({ json: order }));
  await page.route('**/order-api/orders/items/*', async route => {
    const quantity = route.request().postDataJSON().quantity;
    order.items[0].quantity = quantity; order.items[0].subtotal = quantity * order.items[0].unitPrice;
    order.total = order.subtotal = order.items.reduce((sum, i) => sum + i.subtotal, 0);
    await route.fulfill({ json: order });
  });
  await page.route('**/api/invoices', route => route.fulfill({ json: ['Pending', 'Paid', 'Cancelled'].map((status, index) => ({
    id: `invoice-${index}`, number: 'ORD-' + 'A1B2C3D4'.repeat(8), items, total: 599.5, subtotal: 599.5, invoiceDate: '2026-09-15T12:00:00Z', status
  })) }));
}

for (const width of [320, 390, 768, 1440]) {
  test(`cart and invoices fit viewport ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await prepare(page);
    for (const path of ['orders', 'invoices']) {
      await page.goto('/' + path);
      await expect(page.locator('tbody tr')).toHaveCount(path === 'orders' ? 2 : 3);
      const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      expect(size.content).toBeLessThanOrEqual(size.viewport + 1);
      if (path === 'orders') {
        await expect(page.getByRole('button', { name: 'Confirmar y generar factura' })).toBeEnabled();
      } else {
        await expect(page.locator('.invoice-number').first()).toHaveText('ORD-' + 'A1B2C3D4'.repeat(8));
      }
      if (width === 390 || width === 1440) await page.screenshot({ path: `../.local/ui-${path}-${width}.png`, fullPage: true });
    }
  });
}

test('quantity changes must be saved before confirmation; invoice filters work', async ({ page }) => {
  await prepare(page); await page.goto('/orders');
  const row = page.locator('tbody tr').first();
  await row.getByRole('button', { name: 'Aumentar cantidad' }).click();
  await expect(page.getByRole('button', { name: 'Confirmar y generar factura' })).toBeDisabled();
  await expect(page.getByText('Tienes cantidades sin guardar.', { exact: false })).toBeVisible();
  await row.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirmar y generar factura' })).toBeEnabled();
  await expect(page.getByRole('status')).toContainText('Cantidad guardada');
  await page.goto('/invoices');
  await page.getByLabel('Estado', { exact: true }).selectOption('Paid');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Buscar factura').fill('no existe');
  await expect(page.getByRole('heading', { name: 'No hay coincidencias' })).toBeVisible();
});
