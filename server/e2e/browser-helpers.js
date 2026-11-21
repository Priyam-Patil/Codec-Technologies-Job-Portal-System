import { expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

export async function signInCandidate(page, account, buttonName = 'Login') {
  await setupClerkTestingToken({ page });
  await page.getByRole('button', { name: buttonName, exact: true }).click();
  try { await page.locator('input[name=identifier]').fill(account.email); await page.locator('input[name=password]').fill(account.password); }
  catch { throw new Error('Clerk credential fields unavailable; sensitive input suppressed'); }
  const prepared = page.waitForResponse(r => /\/prepare_(?:first|second)_factor(?:\?|$)/.test(r.url()) && r.ok(), { timeout: 15000 }).catch(() => null);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const passwordField = page.locator('input[name=password]');
  if (await passwordField.isVisible()) await passwordField.fill('', { timeout: 1000 }).catch(() => {});
  await expect(page.getByText('Check your email', { exact: true }).or(page.getByRole('link', { name: 'Career hub', exact: true }))).toBeVisible({ timeout: 30000 });
  if (await page.getByText('Check your email', { exact: true }).isVisible()) {
    if (!await prepared) {
      const resend = page.getByRole('button', { name: /Didn't receive a code.*Resend/ });
      await expect(resend).toBeEnabled({ timeout: 40000 });
      const sent = page.waitForResponse(r => /\/prepare_(?:first|second)_factor(?:\?|$)/.test(r.url()) && r.ok());
      await resend.click(); await sent;
    }
    await page.locator('input[autocomplete="one-time-code"], input[data-index="0"], input[inputmode="numeric"]').first().pressSequentially('424242');
  }
  await expect(page.getByRole('link', { name: 'Career hub', exact: true })).toBeVisible({ timeout: 30000 });
}
export async function signedRequest(page, api, route, method = 'GET', body) {
  return page.evaluate(async ({ api, route, method, body }) => {
    const token = await window.Clerk.session.getToken();
    const response = await fetch(api + route, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json() };
  }, { api, route, method, body });
}
