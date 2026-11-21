import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { signInCandidate, signedRequest } from './browser-helpers.js';

test.describe.configure({ mode: 'serial' });
const api = 'http://127.0.0.1:5102';
let session, account, contexts, candidate, employer, other, db, companyId, jobId, applicationId;
const title = 'Demo Full Stack Developer 138 ' + Date.now();
const category = 'Checklist QA';
const errors = [], networkFailures = [];

async function companyRequest(path, method = 'GET', body) {
  return employer.evaluate(async ({ api, path, method, body }) => {
    const response = await fetch(api + '/api/company' + path, { method, headers: { token: localStorage.getItem('companyToken'), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json() };
  }, { api, path, method, body });
}
const applicant = () => employer.getByRole('row').filter({ hasText: title });
const history = () => candidate.getByRole('row').filter({ hasText: title });
async function clearFilters() { await candidate.getByRole('button', { name: 'Clear filters', exact: true }).click(); }
async function analytics(status) {
  await employer.getByRole('link', { name: 'Analytics', exact: true }).click();
  const ownJobs = await db.db.collection('jobs').countDocuments({ companyId: new mongoose.Types.ObjectId(companyId) });
  const ownApps = await db.db.collection('jobapplications').find({ companyId: new mongoose.Types.ObjectId(companyId) }).toArray();
  expect(ownJobs).toBe(1); expect(ownApps.length).toBe(1); expect(ownApps[0].status).toBe(status);
  for (const [label, value] of [['Posted jobs', ownJobs], ['Applications', ownApps.length], ...['Pending', 'Accepted', 'Rejected'].map(s => [s, ownApps.filter(a => a.status === s).length])]) {
    const card = employer.locator('.panel').filter({ has: employer.getByText(label, { exact: true }) });
    await expect(card.locator('p').last()).toHaveText(String(value));
  }
  await expect(employer.getByRole('listitem').filter({ hasText: title }).locator('strong')).toHaveText('1');
  await employer.getByRole('link', { name: 'View Applications', exact: true }).click();
}

test.beforeAll(async ({ browser }) => {
  session = JSON.parse(await fs.readFile(new URL('../../.qa/audit-session.json', import.meta.url)));
  if (!session.mongoUri.startsWith('mongodb://127.0.0.1:') || !session.mongoUri.endsWith('/insiderjobs_demo')) throw new Error('Only the isolated checklist database is allowed');
  account = session.users.find(u => u.viewport === 'desktop');
  db = await mongoose.createConnection(session.mongoUri, { autoIndex: false, autoCreate: false }).asPromise();
  contexts = await Promise.all([0, 1, 2].map(() => browser.newContext({ baseURL: 'http://127.0.0.1:5176', viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Kolkata' })));
  [candidate, employer, other] = await Promise.all(contexts.map(context => context.newPage()));
  for (const page of [candidate, employer, other]) {
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => { if (request.url().startsWith(api + '/') && !request.failure()?.errorText?.includes('ERR_ABORTED')) networkFailures.push(new URL(request.url()).pathname); });
  }
});
test.afterAll(async () => { await db?.close(); for (const context of contexts || []) await context.close(); });

test('[138:15.1] candidate redirect preserves the private deep link and rejects an external return URL', async ({ browser }) => {
  const guest = await browser.newPage({ baseURL: 'http://127.0.0.1:5176' });
  try {
    await guest.goto('/applications');
    await expect(guest).toHaveURL(/\/candidate-login\?next=/);
    await expect(guest.getByText('Sign in to view your applications and upload a resume.', { exact: true })).toBeVisible();
    await guest.getByRole('link', { name: 'Browse jobs', exact: true }).click();
    await expect(guest.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  } finally { await guest.close(); }
  await candidate.goto('/career?tab=analysis');
  await expect(candidate).toHaveURL(/\/candidate-login\?next=/);
  await signInCandidate(candidate, account, 'Sign in');
  await expect(candidate).toHaveURL(/\/career\?tab=analysis$/);
  await expect(candidate.getByRole('heading', { name: 'Resume analysis', exact: true })).toBeVisible();
  await candidate.goto('/candidate-login?next=https%3A%2F%2Foutside.example%2F');
  await expect(candidate).toHaveURL('http://127.0.0.1:5176/');
});

test('[138:10.3] unsupported and oversized company logos are rejected before a real recruiter is registered', async () => {
  await employer.goto('/'); await employer.getByRole('button', { name: 'Recruiter Login', exact: true }).click();
  await employer.getByRole('button', { name: 'Sign up', exact: true }).click();
  await employer.getByLabel('Company name', { exact: true }).fill('Checklist 138 Company');
  try {
    await employer.getByLabel('Recruiter email').fill(`checklist138-${Date.now()}@example.test`);
    await employer.getByLabel('Recruiter password').fill(randomBytes(24).toString('base64url') + '!Aa7');
    await employer.getByRole('dialog').getByRole('button', { name: 'Next', exact: true }).click();
  } catch { await employer.getByLabel('Recruiter password').fill('', { timeout: 500 }).catch(() => {}); throw new Error('Recruiter inputs unavailable; sensitive values suppressed'); }
  const logo = employer.getByLabel('Company logo');
  await logo.setInputFiles({ name: 'unsupported.html', mimeType: 'text/html', buffer: Buffer.from('<p>Not an image</p>') });
  await employer.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(employer.getByText('Choose a PNG, JPEG or WebP logo no larger than 5 MB', { exact: true }).first()).toBeVisible();
  await logo.setInputFiles({ name: 'oversized.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await employer.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(employer.getByText('Choose a PNG, JPEG or WebP logo no larger than 5 MB', { exact: true }).first()).toBeVisible();
  await logo.setInputFiles(fileURLToPath(new URL('../../client/src/assets/adobe_logo.png', import.meta.url)));
  const created = employer.waitForResponse(r => r.url() === api + '/api/company/register' && r.request().method() === 'POST');
  await employer.getByRole('button', { name: 'Create Account', exact: true }).click();
  const response = await created; expect(response.status()).toBe(201); companyId = (await response.json()).company._id;
  await expect(employer.getByRole('heading', { name: 'Manage Jobs', exact: true })).toBeVisible();
});

test('[138:8.9,11.2,11.5,11.6,11.7,11.9] one newly posted job is edited, hidden, protected and restored', async () => {
  await employer.getByRole('link', { name: 'Add Job', exact: true }).click();
  await employer.getByLabel('Job Title', { exact: true }).fill(title);
  await employer.locator('.ql-editor').fill('React, Node.js, MongoDB and Kubernetes. Build accessible applications.');
  await employer.getByLabel('Job Category', { exact: true }).fill(category);
  await employer.getByLabel('Job Location', { exact: true }).fill('Hyderabad');
  await employer.getByLabel('Job Level', { exact: true }).selectOption('Intermediate level');
  await employer.getByLabel('Job Salary', { exact: true }).fill('2000000');
  await employer.getByLabel('Job type', { exact: true }).selectOption('Part-time');
  const posted = employer.waitForResponse(r => r.url() === api + '/api/company/post-job' && r.request().method() === 'POST');
  await employer.getByRole('button', { name: 'ADD', exact: true }).click();
  const response = await posted; expect(response.status()).toBe(201); jobId = (await response.json()).job._id;
  await employer.getByRole('link', { name: 'Manage Jobs', exact: true }).click();
  const row = employer.getByRole('row').filter({ hasText: title });
  await row.getByRole('button', { name: 'Edit job', exact: true }).click();
  await employer.getByLabel('Salary (existing CTC units)', { exact: true }).fill('1800000');
  await employer.getByLabel('Description (basic HTML supported)', { exact: true }).fill('<p>React, Node.js, MongoDB and Kubernetes. Updated checklist description.</p>');
  await employer.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(employer.getByRole('heading', { name: 'Manage Jobs', exact: true })).toBeVisible();
  await employer.reload(); await row.getByRole('button', { name: 'Edit job', exact: true }).click();
  await expect(employer.getByLabel('Salary (existing CTC units)', { exact: true })).toHaveValue('1800000');
  await expect(employer.getByLabel('Description (basic HTML supported)', { exact: true })).toContainText('Updated checklist description.');
  await employer.getByRole('button', { name: 'Cancel', exact: true }).click();
  const hidden = employer.waitForResponse(r => r.url().endsWith('/change-visibility') && r.request().method() === 'PUT');
  await row.getByRole('checkbox').click();
  expect((await hidden).status()).toBe(200);
  await expect(row.getByRole('checkbox')).not.toBeChecked();
  await expect.poll(async () => (await candidate.request.get(api + '/api/jobs/' + jobId)).status()).toBe(404);
  expect((await signedRequest(candidate, api, '/api/users/apply', 'POST', { jobId })).status).toBe(404);
  await candidate.goto('/'); await candidate.getByPlaceholder('Search for jobs', { exact: true }).fill(title);
  await expect(candidate.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
  const restored = employer.waitForResponse(r => r.url().endsWith('/change-visibility') && r.request().method() === 'PUT');
  await row.getByRole('checkbox').click();
  expect((await restored).status()).toBe(200);
  await expect(row.getByRole('checkbox')).toBeChecked();
  await candidate.reload(); await candidate.getByPlaceholder('Search for jobs', { exact: true }).fill(title);
  await expect(candidate.getByRole('heading', { name: title, exact: true })).toBeVisible();
});

test('[138:1.2,1.6,3.3,3.4,3.8,3.12] Enter, location, category, all work modes, refresh and browser Back work', async () => {
  await clearFilters();
  await candidate.getByPlaceholder('Search for jobs', { exact: true }).fill(title);
  await candidate.getByPlaceholder('Search for jobs', { exact: true }).press('Enter');
  await expect(candidate.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await clearFilters(); await candidate.getByLabel('Search job location', { exact: true }).fill('Hyderabad');
  await candidate.getByLabel('Search job location', { exact: true }).press('Enter');
  await expect(candidate.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(candidate.getByRole('heading', { name: 'Full Stack Developer', exact: true })).toHaveCount(0);
  await clearFilters(); await candidate.getByLabel(category, { exact: true }).check();
  await expect(candidate.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(candidate.getByRole('heading', { name: 'Python Engineer', exact: true })).toHaveCount(0);
  await clearFilters();
  for (const [mode, expected] of [['Remote', 'Python Engineer'], ['Hybrid', 'Full Stack Developer'], ['Onsite', title]]) {
    await candidate.getByLabel('Work mode', { exact: true }).selectOption(mode);
    await expect(candidate.getByRole('heading', { name: expected, exact: true })).toBeVisible();
  }
  await candidate.getByLabel('Job type', { exact: true }).selectOption('Part-time');
  await candidate.getByLabel('Min salary', { exact: true }).fill('1790000');
  await candidate.reload();
  await expect(candidate.getByLabel('Job type', { exact: true })).toHaveValue('');
  await expect(candidate.getByLabel('Min salary', { exact: true })).toHaveValue('');
  await expect(candidate.getByLabel('Work mode', { exact: true })).toHaveValue('');
  await candidate.getByPlaceholder('Search for jobs', { exact: true }).fill(title);
  const card = candidate.locator('div.card-hover').filter({ has: candidate.getByRole('heading', { name: title, exact: true }) });
  await card.getByRole('button', { name: 'Learn more', exact: true }).click();
  await expect(candidate.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await candidate.reload(); await expect(candidate.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await candidate.goBack(); await expect(candidate.getByRole('heading', { name: 'Make your next move.' })).toBeVisible();
});

test('[138:6.2,6.9] manual skills persist and both invalid professional hosts are rejected', async () => {
  await candidate.getByRole('link', { name: 'Career hub', exact: true }).click();
  await candidate.getByRole('button', { name: 'Profile', exact: true }).click();
  await candidate.getByLabel('Skills (comma separated)', { exact: true }).fill('React, Kubernetes, TypeScript');
  await candidate.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(candidate.getByText(/Profile updated/)).toBeVisible();
  await candidate.reload(); await candidate.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(candidate.getByLabel('Skills (comma separated)', { exact: true })).toHaveValue('React, Kubernetes, TypeScript');
  for (const field of ['Github', 'Linkedin']) {
    await candidate.getByLabel(new RegExp('^' + field + '$', 'i')).fill('https://outside.example/profile');
    await candidate.getByRole('button', { name: 'Save profile', exact: true }).click();
    await expect(candidate.getByText(`Use a ${field.toLowerCase() === 'github' ? 'github.com' : 'linkedin.com'} profile URL`, { exact: true })).toBeVisible();
    await candidate.getByLabel(new RegExp('^' + field + '$', 'i')).fill(field === 'Github' ? 'https://github.com/example' : 'https://www.linkedin.com/in/example');
  }
  await candidate.getByLabel('Skills (comma separated)', { exact: true }).fill('');
  const saved = candidate.waitForResponse(r => r.url() === api + '/api/users/profile' && r.request().method() === 'PUT' && r.status() === 200);
  await candidate.getByRole('button', { name: 'Save profile', exact: true }).click(); await saved;
});

test('[138:5.7,5.10] uploaded PDF analysis shows suggestions and explains coverage without a hiring probability', async () => {
  await candidate.getByRole('link', { name: 'Applied Jobs', exact: true }).click();
  await candidate.getByRole('button', { name: 'Edit', exact: true }).click();
  await candidate.locator('#resumeUpload').setInputFiles(fileURLToPath(new URL('./fixtures/resume.pdf', import.meta.url)));
  await candidate.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(candidate.getByRole('region', { name: 'Resume analysis summary' }).getByText('React', { exact: true })).toBeVisible({ timeout: 30000 });
  await candidate.getByRole('link', { name: 'Compare skills and find matching jobs', exact: true }).click();
  await candidate.getByLabel('Compare with a job', { exact: true }).selectOption(jobId);
  await expect(candidate.getByRole('heading', { name: /75% skill coverage/ })).toBeVisible();
  expect(await candidate.locator('ul.list-disc li').count()).toBeGreaterThan(0);
  await candidate.getByRole('button', { name: 'Matches', exact: true }).click();
  await expect(candidate.getByText(/never a hiring probability/)).toBeVisible();
});

test('[138:7.6] saved jobs are isolated between two actual Clerk sessions', async () => {
  await candidate.getByRole('link', { name: 'InsiderJobs home' }).click();
  await candidate.getByPlaceholder('Search for jobs', { exact: true }).fill(title);
  const card = candidate.locator('div.card-hover').filter({ has: candidate.getByRole('heading', { name: title, exact: true }) });
  await card.getByRole('button', { name: 'Save job', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await candidate.getByRole('link', { name: 'Career hub', exact: true }).click();
  await candidate.getByRole('button', { name: 'Saved jobs', exact: true }).click();
  await expect(candidate.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await other.goto('/'); await signInCandidate(other, session.users.find(u => u.viewport === 'tablet'));
  await other.getByRole('link', { name: 'Career hub', exact: true }).click();
  await other.getByRole('button', { name: 'Saved jobs', exact: true }).click();
  await expect(other.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
  const own = await signedRequest(other, api, '/api/users/saved-jobs?userId=' + account.id);
  expect(own.status).toBe(200); expect(own.data.jobs.some(j => j._id === jobId)).toBe(false);
});

test('[138:5.9,12.3,12.8] apply to the newly posted job, exclude recommendations and enforce applicant ownership', async () => {
  // Previous successful runs retain their bookmarks; select this run's exact job.
  const savedCard = candidate.locator('div.card-hover').filter({ has: candidate.getByRole('heading', { name: title, exact: true }) });
  await savedCard.getByRole('button', { name: 'Learn more', exact: true }).click();
  await candidate.getByRole('button', { name: 'Apply Now', exact: true }).first().click();
  await expect(candidate.getByRole('button', { name: 'Already Applied', exact: true }).first()).toBeDisabled();
  await candidate.getByRole('link', { name: 'Applied Jobs', exact: true }).click();
  await expect(history().getByText('Pending', { exact: true })).toBeVisible();
  await candidate.getByRole('link', { name: 'Career hub', exact: true }).click();
  await expect(candidate.getByRole('heading', { name: 'Jobs matched to your skills', exact: true })).toBeVisible();
  await expect(candidate.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
  const recommendations = await signedRequest(candidate, api, '/api/users/recommendations');
  expect(recommendations.data.recommendations.some(item => item.job._id === jobId)).toBe(false);
  await employer.getByRole('link', { name: 'View Applications', exact: true }).click();
  const applications = await companyRequest('/applicants'); expect(applications.status).toBe(200); expect(applications.data.applications.length).toBe(1);
  const entry = applications.data.applications[0]; applicationId = entry._id;
  expect(entry.jobId._id).toBe(jobId); expect(entry.userId._id).toBe(account.id);
  expect(Object.keys(entry.userId).sort()).toEqual(['_id', 'name', 'email', 'image', 'resume'].sort());
  const old = (await signedRequest(candidate, api, '/api/users/applications')).data.applications.find(a => a.jobId?._id === session.jobs[0].id);
  expect((await companyRequest('/change-status', 'PUT', { id: old._id, status: 'Rejected' })).status).toBe(404);
  expect((await companyRequest('/applications/' + old._id + '/resume')).status).toBe(404);
  await analytics('Pending');
});

test('[138:9.5] actual window focus refreshes candidate status before the periodic timer', async () => {
  await candidate.goto('/applications'); await expect(history().getByText('Pending', { exact: true })).toBeVisible();
  await candidate.waitForLoadState('networkidle');
  const cdp = await contexts[0].newCDPSession(candidate);
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false });
  await employer.bringToFront();
  const changed = employer.waitForResponse(r => r.url().endsWith('/change-status') && r.request().method() === 'PUT');
  await applicant().getByLabel('Application status').selectOption('Accepted'); expect((await changed).status()).toBe(200);
  const refresh = candidate.waitForRequest(r => r.url() === api + '/api/users/applications', { timeout: 10000 });
  await candidate.bringToFront(); await refresh;
  await expect(history().getByText('Accepted', { exact: true })).toBeVisible();
  await analytics('Accepted');
});

test('[138:9.6] the real 30-second interval refreshes a status without clicking Refresh', async () => {
  await candidate.reload(); await expect(history().getByText('Accepted', { exact: true })).toBeVisible();
  await candidate.waitForLoadState('networkidle'); await employer.bringToFront();
  const changed = employer.waitForResponse(r => r.url().endsWith('/change-status') && r.request().method() === 'PUT');
  await applicant().getByLabel('Application status').selectOption('Rejected'); expect((await changed).status()).toBe(200);
  const polled = await candidate.waitForResponse(r => r.url() === api + '/api/users/applications' && r.request().method() === 'GET', { timeout: 35000 });
  const result = await polled.json(); expect(result.applications.find(a => a._id === applicationId).status).toBe('Rejected');
  await expect(history().getByText('Rejected', { exact: true })).toBeVisible();
  await analytics('Rejected');
});

test('[138:13.6,13.8,13.9,14.2,14.4,14.7] change interview time, verify timezone/privacy and compare all analytics to MongoDB', async () => {
  await applicant().getByRole('button', { name: 'Get resume link', exact: true }).click();
  await expect(applicant().getByRole('link', { name: 'Open resume', exact: true })).toBeVisible();
  await applicant().getByLabel('Application status').selectOption('Accepted');
  await expect(employer.getByText('Application Accepted', { exact: true })).toBeVisible();
  await applicant().getByRole('button', { name: 'Schedule interview', exact: true }).click();
  const first = await employer.evaluate(ms => { const date = new Date(ms); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }, Date.now() + 86400000);
  await applicant().getByLabel(/Date & time/).fill(first);
  await applicant().getByLabel('Meeting details', { exact: true }).fill('Checklist interview first schedule');
  await applicant().getByRole('button', { name: 'Save interview', exact: true }).click();
  await expect(applicant().getByRole('button', { name: 'Update interview', exact: true })).toBeVisible();
  await applicant().getByRole('button', { name: 'Update interview', exact: true }).click();
  const second = await employer.evaluate(ms => { const date = new Date(ms); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }, Date.now() + 93600000);
  await applicant().getByLabel(/Date & time/).fill(second);
  await applicant().getByLabel('Meeting details', { exact: true }).fill('Checklist interview updated schedule');
  const saved = employer.waitForResponse(r => r.url().includes('/interviews/') && r.request().method() === 'PUT');
  await applicant().getByRole('button', { name: 'Save interview', exact: true }).click(); expect((await saved).status()).toBe(200);
  await candidate.getByRole('button', { name: 'Refresh applications', exact: true }).click();
  await expect(history().getByText('Checklist interview updated schedule', { exact: true })).toBeVisible();
  const expectedIso = await employer.evaluate(value => new Date(value).toISOString(), second);
  const stored = await db.db.collection('jobapplications').findOne({ _id: new mongoose.Types.ObjectId(applicationId) });
  expect(stored.interview.scheduledAt.toISOString()).toBe(expectedIso);
  const formatted = await candidate.evaluate(value => new Date(value).toLocaleString(), expectedIso);
  await expect(history()).toContainText(formatted);
  const unrelated = await signedRequest(other, api, '/api/users/applications?userId=' + account.id);
  expect(unrelated.data.applications.some(a => a._id === applicationId)).toBe(false);
  const old = (await signedRequest(candidate, api, '/api/users/applications')).data.applications.find(a => a.jobId?._id === session.jobs[0].id);
  expect((await companyRequest('/interviews/' + old._id, 'PUT', { scheduledAt: expectedIso, meetingDetails: 'Unauthorized change' })).status).toBe(404);
  await analytics('Accepted');
});

test('[138:17.1,17.2,17.3] finish both ordered cross-account demonstrations and sign out', async () => {
  await employer.getByRole('button', { name: 'Logout', exact: true }).click();
  await employer.goto('/dashboard/analytics'); await expect(employer).toHaveURL('http://127.0.0.1:5176/');
  await candidate.getByRole('button', { name: /Open user menu/i }).click();
  await candidate.getByText('Sign out', { exact: true }).click();
  await expect(candidate.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  expect(errors).toEqual([]); expect(networkFailures).toEqual([]);
});
