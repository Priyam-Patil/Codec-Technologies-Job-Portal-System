import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import { signInCandidate, signedRequest } from './browser-helpers.js';

test.skip(process.env.JOB_PORTAL_LIVE_ONLY !== '1', 'Use the explicit live-only configuration');

test('candidate privacy and complete application/interview lifecycle persist through real browser controls', async ({ browser }, info) => {
  test.setTimeout(120000);
  const session = JSON.parse(await fs.readFile(new URL('../../.qa/audit-session.json', import.meta.url)));
  if (!session.mongoUri.startsWith('mongodb://127.0.0.1:') || !session.mongoUri.endsWith('/insiderjobs_demo')) throw new Error('Isolated lifecycle database required');
  const account = session.users.find(user => user.viewport === info.project.name);
  const other = session.users.find(user => user.viewport !== info.project.name);
  const personContext = await browser.newContext(info.project.use), employerContext = await browser.newContext(info.project.use);
  const person = await personContext.newPage(), employer = await employerContext.newPage();
  const errors = [];
  for (const page of [person, employer]) page.on('pageerror', error => errors.push(error.message));
  const api = 'http://127.0.0.1:5102';
  const db = await mongoose.createConnection(session.mongoUri, { autoIndex: false, autoCreate: false }).asPromise();
  try {
    await person.goto('/'); await signInCandidate(person, account);
    const history = await signedRequest(person, api, '/api/users/applications?userId=' + other.id);
    expect(history.status).toBe(200); expect(history.data.applications.length).toBeGreaterThan(0);
    for (const item of history.data.applications) expect(item.userId).toBe(account.id);
    const before = await db.db.collection('users').findOne({ _id: other.id });
    const identity = await signedRequest(person, api, '/api/users/profile', 'PUT', { _id: other.id, name: 'Unauthorized identity change', email: other.email });
    expect(identity.status).toBe(200); expect(identity.data.user._id).toBe(account.id); expect(identity.data.user.email).toBe(account.email);
    expect(JSON.stringify(await db.db.collection('users').findOne({ _id: other.id })) === JSON.stringify(before)).toBe(true);
    await person.getByRole('link', { name: 'Career hub', exact: true }).click();
    await person.getByRole('button', { name: 'Profile', exact: true }).click();
    await expect(person.getByLabel(/^Experience$/i)).toHaveValue('Built a MERN portfolio with 2 years of project experience.');
    for (const [label, value] of [['Github', 'https://github.com/example'], ['Linkedin', 'https://www.linkedin.com/in/example'], ['Portfolio', 'https://example.com']]) await expect(person.getByLabel(new RegExp('^' + label + '$', 'i'))).toHaveValue(value);
    await person.getByRole('link', { name: 'Applied Jobs', exact: true }).click();

    await employer.goto('/'); await employer.getByRole('button', { name: 'Recruiter Login', exact: true }).click();
    try { await employer.getByLabel('Recruiter email').fill(session.recruiter.email); await employer.getByLabel('Recruiter password').fill(session.recruiter.password); }
    catch { throw new Error('Recruiter input unavailable; sensitive values suppressed'); }
    await employer.getByRole('dialog').getByRole('button', { name: 'Login', exact: true }).click();
    if (await employer.getByLabel('Recruiter password').isVisible()) await employer.getByLabel('Recruiter password').fill('', { timeout: 1000 }).catch(() => {});
    await employer.getByRole('link', { name: 'View Applications', exact: true }).click();
    const row = employer.getByRole('row').filter({ hasText: `Demo ${info.project.name}` });
    const candidateRow = info.project.name === 'mobile' ? person.getByTestId('application-card').filter({ hasText: 'Full Stack Developer' }) : person.getByRole('row').filter({ hasText: 'Full Stack Developer' });
    for (const status of ['Pending', 'Rejected', 'Accepted']) {
      const changed = employer.waitForResponse(response => response.url().endsWith('/api/company/change-status') && response.request().method() === 'PUT');
      await row.getByLabel('Application status', { exact: true }).selectOption(status);
      expect((await changed).status()).toBe(200);
      await person.getByRole('button', { name: 'Refresh applications', exact: true }).click();
      await expect(candidateRow.getByText(status, { exact: true })).toBeVisible();
    }
    for (const status of ['Completed', 'Cancelled', 'Scheduled']) {
      await row.getByRole('button', { name: 'Update interview', exact: true }).click();
      await row.getByLabel('Interview status', { exact: true }).selectOption(status);
      const changed = employer.waitForResponse(response => response.url().includes('/api/company/interviews/') && response.request().method() === 'PUT');
      await row.getByRole('button', { name: 'Save interview', exact: true }).click();
      expect((await changed).status()).toBe(200);
      await person.getByRole('button', { name: 'Refresh applications', exact: true }).click();
      await expect(candidateRow.getByText('Interview · ' + status, { exact: true })).toBeVisible();
    }
    await employer.reload(); await expect(row.getByLabel('Application status')).toHaveValue('Accepted');
    const stored = await db.db.collection('jobapplications').findOne({ userId: account.id, jobId: new mongoose.Types.ObjectId(session.jobs[0].id) });
    expect(stored.status).toBe('Accepted'); expect(stored.interview.status).toBe('Scheduled');
    expect(errors).toEqual([]);
  } finally { await db.close(); await personContext.close(); await employerContext.close(); }
});
