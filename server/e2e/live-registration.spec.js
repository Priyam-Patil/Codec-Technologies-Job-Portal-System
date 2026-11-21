import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClerkClient } from '@clerk/express';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { signedRequest } from './browser-helpers.js';

test.skip(process.env.JOB_PORTAL_LIVE_ONLY !== '1', 'Use the explicit live-only configuration');

test('candidate registers through real Clerk UI, verifies email, persists profile and signs out', async ({ page }, info) => {
  test.setTimeout(120000);
  const session = JSON.parse(await fs.readFile(new URL('../../.qa/audit-session.json', import.meta.url)));
  if (!session.mongoUri.startsWith('mongodb://127.0.0.1:') || !session.mongoUri.endsWith('/insiderjobs_demo')) throw new Error('Isolated registration database required');
  const env = dotenv.parse(await fs.readFile(new URL('../.env', import.meta.url)));
  if (!env.CLERK_SECRET_KEY?.startsWith('sk_test_')) throw new Error('Development Clerk instance required');
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  // Clerk cleanup leaves the isolated MongoDB profile as evidence. Never reuse its email
  // for a different Clerk identity or remove retained records just to make a rerun pass.
  const email = `jobs-${session.run.slice(0, 8)}-signup-${info.project.name}-${randomBytes(6).toString('hex')}+clerk_test@example.com`;
  const password = randomBytes(24).toString('base64url') + '!Aa7';
  const errors = [], networkFailures = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => { if (request.url().startsWith('http://127.0.0.1:5102/') && !request.failure()?.errorText?.includes('ERR_ABORTED')) networkFailures.push(new URL(request.url()).pathname); });
  await setupClerkTestingToken({ page });
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.locator('input[name=identifier]').waitFor();
    await page.getByRole('link', { name: 'Sign up', exact: true }).click();
    await page.locator('input[name=firstName]').fill('Browser');
    await page.locator('input[name=lastName]').fill(`Signup ${info.project.name}`);
    try { await page.locator('input[name=emailAddress]').fill(email); await page.locator('input[name=password]').fill(password); }
    catch { throw new Error('Registration inputs unavailable; sensitive values suppressed'); }
    const prepared = page.waitForResponse(response => response.url().includes('/prepare_verification') && response.ok(), { timeout: 15000 }).catch(() => null);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    const passwordInput = page.locator('input[name=password]');
    if (await passwordInput.isVisible()) await passwordInput.fill('', { timeout: 1000 }).catch(() => {});
    await expect(page.getByText('Verify your email', { exact: true }).or(page.getByText('Check your email', { exact: true })).or(page.getByRole('link', { name: 'Career hub', exact: true }))).toBeVisible({ timeout: 30000 });
    if (!await page.getByRole('link', { name: 'Career hub', exact: true }).isVisible()) {
      await prepared;
      await page.locator('input[autocomplete="one-time-code"], input[data-index="0"], input[inputmode="numeric"]').first().pressSequentially('424242');
    }
    await expect(page.getByRole('link', { name: 'Career hub', exact: true })).toBeVisible({ timeout: 30000 });
    const profile = await signedRequest(page, 'http://127.0.0.1:5102', '/api/users/user');
    expect(profile.status).toBe(200); expect(profile.data.user.email).toBe(email);
    const db = await mongoose.createConnection(session.mongoUri, { autoIndex: false, autoCreate: false }).asPromise();
    try { const record = await db.db.collection('users').findOne({ _id: profile.data.user._id, email }); expect(record?.name).toBe(`Browser Signup ${info.project.name}`); }
    finally { await db.close(); }
    await page.reload();
    await expect(page.getByRole('link', { name: 'Career hub', exact: true })).toBeVisible();
    expect((await signedRequest(page, 'http://127.0.0.1:5102', '/api/users/user')).status).toBe(200);
    await page.getByRole('button', { name: /Open user menu/i }).click();
    await page.getByText('Sign out', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
    expect(errors).toEqual([]); expect(networkFailures).toEqual([]);
  } finally {
    // Remove only the unique identity created through this test's actual signup form.
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    for (const user of users.data) {
      if (!user.emailAddresses.some(address => address.emailAddress === email) || !email.startsWith(`jobs-${session.run.slice(0, 8)}-signup-`)) throw new Error('Registration cleanup ownership guard failed');
      await clerk.users.deleteUser(user.id);
    }
  }
});
