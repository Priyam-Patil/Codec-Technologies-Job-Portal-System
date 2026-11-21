import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { signInCandidate, signedRequest } from './browser-helpers.js';
const root = fileURLToPath(new URL('../../', import.meta.url));
const audit = process.env.JOB_PORTAL_AUDIT === '1';
const api = audit ? 'http://127.0.0.1:5102' : 'http://127.0.0.1:5101';

test('all public and guarded routes, stale recruiter session and missing job recovery', async ({ page }) => {
  await page.goto('/applications');
  await expect(page.getByText('Sign in to view your applications and upload a resume.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Browse jobs', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make your next move.' })).toBeVisible();
  await page.goto('/career');
  await expect(page.getByText('Sign in to open your career hub.', { exact: true })).toBeVisible();
  for (const route of ['/dashboard', '/dashboard/add-job', '/dashboard/manage-jobs', '/dashboard/view-applications', '/dashboard/analytics', '/dashboard/edit-job/000000000000000000000000']) {
    await page.goto(route); await expect(page).toHaveURL(/\/$/);
  }
  await page.evaluate(() => localStorage.setItem('companyToken', 'invalid-expired-token'));
  await page.goto('/dashboard/add-job');
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => localStorage.getItem('companyToken'))).toBeNull();
  await page.goto('/apply-job/000000000000000000000000');
  await expect(page.locator('.panel[role="alert"]').filter({ hasText: 'Job not found' })).toBeVisible();
  await page.getByRole('button', { name: 'Browse available jobs', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make your next move.' })).toBeVisible();
  await page.goto('/page-that-does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Explore jobs', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Make your next move.' })).toBeVisible();
});

test('network error is displayed and Retry returns to real jobs; search Enter and clear stay synchronized', async ({ page }) => {
  let fail = true;
  // Fault injection only: success after Retry comes from the actual local API, not a mocked response.
  await page.route(api + '/api/jobs', route => fail ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Audit temporary jobs failure' }) }) : route.continue());
  await page.goto('/');
  await expect(page.getByRole('alert').filter({ hasText: 'Audit temporary jobs failure' })).toBeVisible();
  fail = false; await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Full Stack Developer', exact: true })).toBeVisible();
  await page.getByPlaceholder('Search for jobs', { exact: true }).fill('Python');
  await page.getByPlaceholder('Search for jobs', { exact: true }).press('Enter');
  await expect(page.getByRole('heading', { name: 'Python Engineer', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Full Stack Developer', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.getByPlaceholder('Search for jobs', { exact: true })).toHaveValue('');
  await expect(page.getByRole('heading', { name: 'Full Stack Developer', exact: true })).toBeVisible();
});

test('recruiter modal keyboard, invalid credentials, required fields and recovery controls', async ({ page }) => {
  const session = JSON.parse(await fs.readFile(path.join(root, audit ? '.qa/audit-session.json' : '.qa/demo-session.json')));
  await page.goto('/');
  await page.getByRole('button', { name: 'Recruiter Login', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Recruiter authentication' });
  await page.getByLabel('Recruiter email').fill(session.recruiter.email);
  await page.getByLabel('Recruiter password').fill('intentionally-wrong-password');
  await dialog.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByText('Invalid email or password', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Sign up', exact: true }).click();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  expect(await page.getByLabel('Company name').evaluate(element => element.validity.valueMissing)).toBeTruthy();
  const focusable = dialog.locator('button, input').filter({ visible: true });
  await focusable.last().focus();
  await page.keyboard.press('Tab');
  await expect(focusable.first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(focusable.last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Recruiter Login', exact: true })).toBeFocused();
});

test('saved jobs survive reload without duplicates; profile rejects unsafe links; unrecognized resume skills are reported honestly', async ({ page }, info) => {
  const session = JSON.parse(await fs.readFile(path.join(root, audit ? '.qa/audit-session.json' : '.qa/demo-session.json')));
  const account = session.users.find(user => user.viewport === info.project.name);
  await page.goto('/'); await signInCandidate(page, account);
  for (let i = 0; i < 2; i++) expect((await signedRequest(page, api, '/api/users/saved-jobs/' + session.jobs[1].id, 'PUT')).status).toBe(200);
  await page.reload();
  await page.getByRole('link', { name: 'Career hub', exact: true }).click();
  await page.getByRole('button', { name: 'Saved jobs', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Python Engineer', exact: true })).toHaveCount(1);
  await page.reload(); await page.getByRole('button', { name: 'Saved jobs', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Python Engineer', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Saved', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Start your shortlist', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByLabel(/^Github$/i).fill('https://evil.example/profile');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByText('Use a github.com profile URL', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Applied Jobs', exact: true }).click();
  const edit = page.getByRole('button', { name: 'Edit', exact: true });
  await expect(edit.or(page.locator('#resumeUpload'))).toBeAttached();
  if (await edit.isVisible()) await edit.click();
  await page.locator('#resumeUpload').setInputFiles(path.join(root, 'client/src/assets/sample-corporate-resume.pdf'));
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const summary = page.getByRole('region', { name: 'Resume analysis summary' });
  await expect(summary.getByText(/No technical skills were recognized/)).toBeVisible({ timeout: 30000 });
  await page.reload(); await expect(summary.getByText(/No technical skills were recognized/)).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('#resumeUpload').setInputFiles(path.join(root, 'server/e2e/fixtures/resume.pdf'));
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(summary.getByText('React', { exact: true })).toBeVisible({ timeout: 30000 });
  for (const close of await page.locator('.Toastify__close-button').all()) if (await close.isVisible()) await close.click();
  await expect(page.locator('.Toastify__toast')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(root, `docs/screenshots/final-upload-summary-${info.project.name}.png`), fullPage: true });
});
