import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, timeout: 45000,
  use: { baseURL: process.env.E2E_FRONTEND_URL ?? 'http://localhost:81', headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  reporter: 'list'
});
