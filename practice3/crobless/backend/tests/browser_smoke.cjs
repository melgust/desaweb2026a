// Run after installing Playwright under backend/.tools/browser (see IMPLEMENTATION.md).
const { chromium } = require('../.tools/browser/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  const base = process.env.FRONTEND_URL || 'http://localhost:81';
  const api = process.env.API_URL || 'http://localhost:5000/api';
  const suffix = Date.now().toString();
  let supplierId, productId, invoiceId, token;
  const saved = (path, method) => page.waitForResponse(r => r.url() === api + path && r.request().method() === method);
  try {
    await page.goto(base + '/invoices');
    await page.waitForURL('**/login');
    await page.getByLabel('Email Address').fill(process.env.TEST_ADMIN_EMAIL || 'admin@enterprise.com');
    await page.getByLabel('Password', { exact: true }).fill(process.env.TEST_ADMIN_PASSWORD || 'Admin123!');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.waitForURL('**/products');
    token = await page.evaluate(() => localStorage.getItem('auth_token'));
    for (const name of ['Products', 'Categories', 'Suppliers', 'Invoices']) {
      assert.equal(await page.getByRole('link', { name, exact: true }).count(), 1);
    }
    await page.getByRole('link', { name: 'Suppliers', exact: true }).click();
    await page.getByRole('link', { name: 'Nuevo proveedor' }).click();
    assert.equal(await page.getByRole('button', { name: 'Create Supplier' }).isDisabled(), true);
    await page.getByLabel('Supplier Name').fill('Browser ' + suffix);
    await page.getByLabel('Contact Email').fill('browser@example.com');
    await page.getByLabel('Phone', { exact: true }).fill('12345678');
    const supplierResponse = saved('/suppliers', 'POST');
    await page.getByRole('button', { name: 'Create Supplier' }).click();
    const createdSupplier = await supplierResponse;
    assert.equal(createdSupplier.status(), 201);
    supplierId = (await createdSupplier.json()).id;
    await page.waitForURL('**/suppliers');
    await page.goto(base + '/suppliers/edit/' + supplierId);
    await page.getByLabel('Phone', { exact: true }).fill('87654321');
    const supplierUpdated = saved('/suppliers/' + supplierId, 'PUT');
    await page.getByRole('button', { name: 'Update Supplier' }).click();
    assert.equal((await supplierUpdated).status(), 200);
    await page.waitForURL('**/suppliers');

    await page.goto(base + '/products/new');
    await page.getByLabel('Product Name').fill('Browser product ' + suffix);
    await page.getByLabel('Price ($)', { exact: true }).fill('25.50');
    await page.getByLabel('Stock Quantity').fill('10');
    await page.getByRole('combobox', { name: 'Category', exact: true }).click();
    await page.getByRole('option').nth(1).click();
    await page.getByRole('combobox', { name: 'Supplier', exact: true }).click();
    await page.getByRole('option', { name: 'Browser ' + suffix, exact: true }).click();
    const productResponse = saved('/products', 'POST');
    await page.getByRole('button', { name: 'Create Product', exact: true }).click();
    const createdProduct = await productResponse;
    assert.equal(createdProduct.status(), 201);
    productId = (await createdProduct.json()).id;
    await page.waitForURL('**/products');

    await page.getByRole('link', { name: 'Invoices', exact: true }).click();
    await page.getByRole('link', { name: 'Nueva factura' }).click();
    await page.getByLabel('Número de factura').fill('BROWSER-' + suffix);
    await page.getByLabel('Proveedor', { exact: true }).selectOption(supplierId);
    await page.getByLabel('Producto 1', { exact: true }).selectOption(productId);
    assert.equal(await page.getByLabel('Precio unitario 1', { exact: true }).inputValue(), '25.5');
    await page.getByLabel('Cantidad 1', { exact: true }).fill('3');
    await page.getByRole('button', { name: 'Agregar producto' }).click();
    await page.getByLabel('Producto 2', { exact: true }).selectOption(productId);
    await page.getByLabel('Cantidad 2', { exact: true }).fill('2');
    await page.getByLabel('Precio unitario 2', { exact: true }).fill('10');
    assert.match(await page.locator('form').innerText(), /Total: 96\.50/);
    const invoiceResponse = saved('/invoices', 'POST');
    await page.getByRole('button', { name: 'Guardar factura' }).click();
    const createdInvoice = await invoiceResponse;
    assert.equal(createdInvoice.status(), 201);
    invoiceId = (await createdInvoice.json()).id;
    await page.waitForURL('**/invoices');
    const row = page.getByRole('row').filter({ hasText: 'BROWSER-' + suffix });
    await row.getByRole('link', { name: 'Ver', exact: true }).click();
    await page.getByLabel('Número de factura').waitFor();
    assert.equal(await page.getByLabel('Número de factura').isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: 'Guardar factura' }).count(), 0);
    await page.reload();
    await page.getByLabel('Número de factura').waitFor();
    await page.goto(base + '/invoices/edit/' + invoiceId);
    await page.getByLabel('Cantidad 2', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).nth(1).click();
    await page.getByLabel('Cantidad 1', { exact: true }).fill('4');
    await page.getByLabel('Precio unitario 1', { exact: true }).fill('25.50');
    const invoiceUpdated = saved('/invoices/' + invoiceId, 'PUT');
    await page.getByRole('button', { name: 'Guardar factura' }).click();
    const updatedResponse = await invoiceUpdated;
    assert.equal(updatedResponse.status(), 200);
    assert.equal((await updatedResponse.json()).total, 102);
    await page.waitForURL('**/invoices');
    const deleted = saved('/invoices/' + invoiceId, 'DELETE');
    await page.getByRole('row').filter({ hasText: 'BROWSER-' + suffix }).getByRole('button', { name: 'Eliminar' }).click();
    assert.equal((await deleted).status(), 204);
    invoiceId = null;
    assert.deepEqual(errors, []);
    console.log('PASS: Chrome login, supplier create/edit, product create, invoice create/view/edit/delete, dynamic totals and deep-link reload.');
  } finally {
    if (token) {
      for (const [resource, id] of [['invoices', invoiceId], ['products', productId], ['suppliers', supplierId]]) {
        if (id) {
          const response = await page.request.delete(`${api}/${resource}/${id}`, { headers: { Authorization: 'Bearer ' + token } });
          assert.equal(response.status(), 204, `Cleanup ${resource}`);
        }
      }
    }
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
