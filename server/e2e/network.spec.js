import { test, expect } from '@playwright/test';
import http from 'node:http';
import { createApp } from '../app.js';
const api = process.env.JOB_PORTAL_AUDIT === '1' ? 'http://127.0.0.1:5102' : 'http://127.0.0.1:5101';

test('repeated transport failures show actionable errors and Retry reloads real backend jobs', async ({ page }) => {
  let fail = true;
  await page.route(api + '/api/jobs', route => fail ? route.abort('connectionrefused') : route.continue());
  await page.goto('/');
  const panel = page.locator('.panel[role="alert"]');
  for (let attempt = 0; attempt < 2; attempt++) {
    await expect(panel).toContainText('Cannot reach the API.');
    await expect(panel).not.toContainText('Network Error');
    fail = false;
    const response = page.waitForResponse(r => r.url() === api + '/api/jobs' && r.status() === 200);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    const jobs = await (await response).json(); expect(jobs.jobs.length).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: 'Full Stack Developer', exact: true })).toBeVisible();
    if (attempt === 0) { fail = true; await page.reload(); }
  }
});

test('browser offline mode is explained and reconnect retry uses the real API', async ({ page, context }) => {
  let first = true;
  await page.route(api + '/api/jobs', route => first ? route.abort('connectionrefused') : route.continue());
  await page.goto('/');
  const panel = page.locator('.panel[role="alert"]');
  await expect(panel).toContainText('Cannot reach the API.');
  await context.setOffline(true);
  try {
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(panel).toContainText('You appear to be offline.');
  } finally { await context.setOffline(false); }
  first = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Full Stack Developer', exact: true })).toBeVisible();
});

test('real browser distinguishes CORS-blocked failure, CORS-readable database 503 and timeout', async ({ page }) => {
  let cors = false, slowRequests = 0;
  const app = createApp({ identityMiddleware: (req, res, next) => next(), connectDatabase: async () => {
    throw Object.assign(new Error('Simulated database DNS failure'), { code: 'ENOTFOUND' });
  } });
  const server = http.createServer((req, res) => {
    if (req.url === '/slow') { slowRequests++; return; }
    if (cors) return app(req, res);
    // Reproduce the previous outer handler's JSON response without CORS.
    res.writeHead(503, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ success: false, message: 'Service temporarily unavailable' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Make your next move.' })).toBeVisible();
    const send = (path, timeout = 15000) => page.evaluate(async ({ base, path, timeout }) => {
      const { createApiClient } = await import('/src/lib/api.js');
      try { await createApiClient({ baseUrl: base, pageProtocol: location.protocol }).get(base + path, { timeout }); return { unexpectedSuccess: true }; }
      catch (error) { return { status: error.response?.status || null, message: error.message, code: error.response?.data?.code }; }
    }, { base, path, timeout });
    const blocked = await send('/api/jobs'); expect(blocked.status).toBeNull(); expect(blocked.message).toContain('Cannot reach the API.');
    cors = true;
    const unavailable = await send('/api/jobs'); expect(unavailable.status).toBe(503); expect(unavailable.code).toBe('DATABASE_DNS_UNAVAILABLE'); expect(unavailable.message).toContain('Database temporarily unavailable.');
    const timeout = await send('/slow', 100); expect(timeout.status).toBeNull(); expect(timeout.message).toContain('did not respond in time'); expect(slowRequests).toBe(1);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
