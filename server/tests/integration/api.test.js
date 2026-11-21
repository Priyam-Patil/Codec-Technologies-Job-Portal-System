import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Webhook } from 'svix';
import { v2 as cloudinary } from 'cloudinary';
import { Writable } from 'node:stream';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { discoverApiEndpoints, endpointKey } from '../../scripts/discover-api-endpoints.js';
import { createApp } from '../../app.js';
import Company from '../../models/Company.js';
import User from '../../models/User.js';
import Job from '../../models/Job.js';
import JobApplication from '../../models/JobApplication.js';
import { ensureCandidateProfile } from '../../utils/candidateProfile.js';

// Intentionally no dotenv import: only the URI returned by MongoMemoryServer is used.
let mongo, server, base, owner, other, job, hidden, application, ownerToken, otherToken;
const endpoints = await discoverApiEndpoints();
const endpointEvidence = new Map();
function recordEndpoint(path, method, status) {
  const key = endpointKey(endpoints, method, new URL(path, 'http://127.0.0.1').pathname);
  if (key) endpointEvidence.set(key, [...new Set([...(endpointEvidence.get(key) || []), status])].sort());
}
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.CLERK_WEBHOOK_SECRET = `whsec_${randomBytes(32).toString('base64')}`;
delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM;
async function request(path, { method = 'GET', candidate, token, body, form, headers = {} } = {}) {
  const response = await fetch(base + path, { method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(candidate ? { 'x-test-candidate': candidate } : {}), ...(token ? { token } : {}), ...headers },
    body: form || (body ? JSON.stringify(body) : undefined) });
  recordEndpoint(path, method, response.status);
  return { status: response.status, body: response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text() };
}
before(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri('insiderjobs_isolated_tests');
  assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:/);
  await mongoose.connect(uri);
  await Promise.all([Company.init(), User.init(), Job.init(), JobApplication.init()]);
  const password = await bcrypt.hash('safe-test-password', 4);
  [owner, other] = await Company.create([{ name: 'Owner', email: 'owner@example.test', image: 'https://example.test/logo.png', password }, { name: 'Other', email: 'other@example.test', image: 'https://example.test/logo.png', password }]);
  ownerToken = jwt.sign({ id: owner.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  otherToken = jwt.sign({ id: other.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  await User.create([{ _id: 'candidate-a', name: 'Candidate A', email: 'a@example.test', image: 'https://example.test/a.png', resume: 'https://example.test/resume.pdf', skills: ['React'] }, { _id: 'candidate-b', name: 'Candidate B', email: 'b@example.test', image: 'https://example.test/b.png', resume: '' }]);
  const fields = { title: 'React developer', description: '<p>React Node.js</p>', location: 'Remote', salary: 100, category: 'Programming', level: 'Junior', date: Date.now(), companyId: owner._id };
  [job, hidden] = await Job.create([fields, { ...fields, title: 'Hidden job', visible: false }]);
  const app = createApp({ identityMiddleware(req, res, next) {
    // Test seam substitutes only Clerk identity, never used by server.js.
    req.auth = Object.assign(() => ({ userId: req.headers['x-test-candidate'] || null, tokenType: 'session_token' }), { [Symbol.for('@clerk/express.auth')]: true });
    next();
  } });
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
}, { timeout: 180000 });
after(async () => {
  await mkdir(new URL('../../../.qa/', import.meta.url), { recursive: true });
  await writeFile(new URL('../../../.qa/network-integration-endpoints.json', import.meta.url), JSON.stringify({ discovered: endpoints.length, tested: endpointEvidence.size, results: Object.fromEntries(endpointEvidence) }, null, 2));
  await new Promise(resolve => server ? server.close(resolve) : resolve()); await mongoose.disconnect(); await mongo?.stop();
});

test('root, database-aware health, production debug guard and recruiter read endpoints respond', async () => {
  assert.equal((await request('/')).body, 'API Working');
  const health = await request('/health'); assert.equal(health.status, 200); assert.equal(health.body.database, 'connected');
  const environment = process.env.NODE_ENV;
  try { process.env.NODE_ENV = 'production'; assert.equal((await request('/debug-sentry')).status, 404); }
  finally { if (environment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = environment; }
  assert.equal((await request('/api/company/company', { token: ownerToken })).body.company.name, 'Owner');
  assert.equal((await request('/api/company/list-jobs', { token: ownerToken })).body.jobsData.length, 2);
});

test('anonymous users cannot read private records or upload', async () => {
  assert.equal((await request('/api/users/user')).status, 401);
  assert.equal((await request('/api/users/update-resume', { method: 'POST' })).status, 401);
  assert.equal((await request('/api/company/analytics')).status, 401);
});
test('verified identity bootstrap handles missing profiles, concurrent first reads and preserves edits', async () => {
  const identity = { id: 'new-verified-user', firstName: 'Verified', lastName: 'Candidate', imageUrl: 'https://example.test/new.png', primaryEmailAddressId: 'email-1', emailAddresses: [{ id: 'email-1', emailAddress: 'new-verified@example.test' }] };
  const profiles = await Promise.all(Array.from({ length: 5 }, () => ensureCandidateProfile(identity.id, async () => identity)));
  assert.equal(profiles.length, 5);
  assert.equal(await User.countDocuments({ _id: identity.id }), 1);
  await User.updateOne({ _id: identity.id }, { $set: { skills: ['Python'], education: 'Preserve education', resume: 'https://example.test/private.pdf' } });
  const existing = await ensureCandidateProfile(identity.id, async () => { throw new Error('Should not fetch identity for an existing profile'); });
  assert.equal(existing.education, 'Preserve education'); assert.deepEqual([...existing.skills], ['Python']);
  await assert.rejects(ensureCandidateProfile('forged-id', async () => identity), error => error.status === 422);
  await assert.rejects(ensureCandidateProfile('unavailable-id', async () => { throw new Error('Offline'); }), error => error.status === 503);
});
test('public jobs exclude hidden posts and recruiter email/password', async () => {
  const result = await request('/api/jobs');
  assert.equal(result.body.jobs.length, 1);
  assert.equal(result.body.jobs[0].companyId.email, undefined);
  assert.equal(result.body.jobs[0].companyId.password, undefined);
  assert.equal((await request('/api/jobs/' + hidden.id)).status, 404);
  assert.equal((await request('/api/jobs/invalid')).status, 400);
});
test('profile updates persist and cannot overwrite identity or another candidate', async () => {
  const result = await request('/api/users/profile', { method: 'PUT', candidate: 'candidate-a', body: { name: 'Forged identity', _id: 'candidate-b', education: 'Computer Science', skills: ['React', 'React'], github: 'https://github.com/example' } });
  assert.equal(result.status, 200);
  const refreshed = await request('/api/users/user', { candidate: 'candidate-a' });
  assert.equal(refreshed.body.user.name, 'Candidate A');
  assert.equal(refreshed.body.user.education, 'Computer Science');
  assert.deepEqual(refreshed.body.user.skills, ['React']);
  assert.equal((await User.findById('candidate-b')).education, '');
  assert.equal((await request('/api/users/profile', { method: 'PUT', candidate: 'candidate-a', body: { portfolio: 'javascript:alert(1)' } })).status, 400);
});
test('bookmarks use addToSet, persist, isolate candidates and can be removed', async () => {
  for (let index = 0; index < 2; index++) assert.equal((await request('/api/users/saved-jobs/' + job.id, { method: 'PUT', candidate: 'candidate-a' })).status, 200);
  assert.equal((await request('/api/users/saved-jobs', { candidate: 'candidate-a' })).body.jobs.length, 1);
  assert.equal((await request('/api/users/saved-jobs', { candidate: 'candidate-b' })).body.jobs.length, 0);
  assert.equal((await request('/api/users/saved-jobs/' + hidden.id, { method: 'PUT', candidate: 'candidate-a' })).status, 404);
  await request('/api/users/saved-jobs/' + job.id, { method: 'DELETE', candidate: 'candidate-a' });
  assert.equal((await request('/api/users/saved-jobs', { candidate: 'candidate-a' })).body.jobs.length, 0);
});
test('recommendations rank real jobs and include matching and missing skills', async () => {
  const result = await request('/api/users/recommendations?jobId=' + job.id, { candidate: 'candidate-a' });
  assert.equal(result.body.recommendations[0].score, 50);
  assert.deepEqual(result.body.comparison.missingSkills, ['Node.js']);
});
test('application requires resume and visible job; unique index resolves concurrent attempts', async () => {
  assert.equal((await request('/api/users/apply', { method: 'POST', candidate: 'candidate-b', body: { jobId: job.id } })).status, 400);
  assert.equal((await request('/api/users/apply', { method: 'POST', candidate: 'candidate-a', body: { jobId: hidden.id } })).status, 404);
  const results = await Promise.all(Array.from({ length: 5 }, () => request('/api/users/apply', { method: 'POST', candidate: 'candidate-a', body: { jobId: job.id } })));
  assert.equal(results.filter(result => result.status === 201).length, 1);
  assert.equal(results.filter(result => result.status === 409).length, 4);
  assert.equal(await JobApplication.countDocuments({ jobId: job.id }), 1);
  application = await JobApplication.findOne({ jobId: job.id });
  assert.equal((await request('/api/users/recommendations', { candidate: 'candidate-a' })).body.recommendations.length, 0);
});
test('recruiters cannot read other applicants/resumes or change their status/jobs/interviews', async () => {
  assert.equal((await request('/api/company/applicants', { token: otherToken })).body.applications.length, 0);
  assert.equal((await request('/api/company/applications/' + application.id + '/resume', { token: otherToken })).status, 404);
  assert.equal((await request('/api/company/change-status', { method: 'PUT', token: otherToken, body: { id: application.id, status: 'Accepted' } })).status, 404);
  assert.equal((await request('/api/company/jobs/' + job.id, { method: 'PUT', token: otherToken, body: { title: 'Forged' } })).status, 404);
  assert.equal((await request('/api/company/change-visibility', { method: 'PUT', token: otherToken, body: { id: job.id } })).status, 404);
  assert.equal((await request('/api/company/interviews/' + application.id, { method: 'PUT', token: otherToken, body: { scheduledAt: new Date(Date.now() + 86400000).toISOString(), meetingDetails: 'Meeting' } })).status, 404);
});
test('status validation and accepted status are reflected in candidate history and analytics', async () => {
  assert.equal((await request('/api/company/change-status', { method: 'PUT', token: ownerToken, body: { id: application.id, status: 'Admin' } })).status, 400);
  const result = await request('/api/company/change-status', { method: 'PUT', token: ownerToken, body: { id: application.id, status: 'Accepted' } });
  assert.equal(result.status, 200); assert.equal(result.body.notification, 'not_configured');
  assert.equal((await request('/api/users/applications', { candidate: 'candidate-a' })).body.applications[0].status, 'Accepted');
  assert.equal((await request('/api/users/applications', { candidate: 'candidate-b' })).body.applications.length, 0);
  const stats = (await request('/api/company/analytics', { token: ownerToken })).body.analytics;
  assert.equal(stats.totalJobs, 2); assert.equal(stats.activeJobs, 1); assert.equal(stats.inactiveJobs, 1); assert.equal(stats.accepted, 1); assert.equal(stats.totalApplications, 1);
  assert.equal((await request('/api/company/analytics', { token: otherToken })).body.analytics.totalApplications, 0);
});
test('interviews persist and are returned only to the application owner', async () => {
  const interview = { scheduledAt: new Date(Date.now() + 86400000).toISOString(), meetingDetails: 'Private meeting details', status: 'Scheduled' };
  assert.equal((await request('/api/company/interviews/' + application.id, { method: 'PUT', token: ownerToken, body: interview })).status, 200);
  assert.equal((await request('/api/users/applications', { candidate: 'candidate-a' })).body.applications[0].interview.meetingDetails, interview.meetingDetails);
  assert.equal((await request('/api/users/applications', { candidate: 'candidate-b' })).body.applications.length, 0);
});
test('job editing sanitizes stored HTML and toggling visibility persists', async () => {
  const result = await request('/api/company/jobs/' + job.id, { method: 'PUT', token: ownerToken, body: { description: '<p>React</p><script>evil()</script>', jobType: 'Contract', workMode: 'Remote', salary: 0 } });
  assert.equal(result.status, 200); assert.equal(result.body.job.description, '<p>React</p>');
  assert.equal(result.body.job.salary, 0);
  const toggle = await request('/api/company/change-visibility', { method: 'PUT', token: ownerToken, body: { id: job.id } });
  assert.equal(toggle.body.job.visible, false);
  assert.equal((await Job.findById(job.id)).visible, false);
});
test('invalid resume bytes, unsupported types and oversized files are rejected without Cloudinary', async () => {
  const form = new FormData(); form.set('resume', new Blob(['invalid'], { type: 'application/pdf' }), 'resume.pdf');
  assert.equal((await request('/api/users/update-resume', { method: 'POST', candidate: 'candidate-a', form })).status, 400);
  const type = new FormData(); type.set('resume', new Blob(['<html>'], { type: 'text/html' }), 'resume.html');
  assert.equal((await request('/api/users/update-resume', { method: 'POST', candidate: 'candidate-a', form: type })).status, 400);
  const large = new FormData(); large.set('resume', new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'application/pdf' }), 'resume.pdf');
  assert.equal((await request('/api/users/update-resume', { method: 'POST', candidate: 'candidate-a', form: large })).status, 413);
});
test('webhooks verify exact raw bytes and duplicate delivery preserves profile fields', async () => {
  const payload = '{ "type": "user.created", "data": {"id":"candidate-c","first_name":"New","last_name":"User","image_url":"https://example.test/c.png","email_addresses":[{"id":"e","email_address":"c@example.test"}],"primary_email_address_id":"e"} }';
  const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
  const timestamp = new Date(); const id = 'msg_test';
  const headers = { 'Content-Type': 'application/json', 'svix-id': id, 'svix-timestamp': String(Math.floor(timestamp.getTime()/1000)), 'svix-signature': webhook.sign(id, timestamp, payload) };
  const send = async body => { const response = await fetch(base + '/webhooks', { method: 'POST', headers, body }); recordEndpoint('/webhooks', 'POST', response.status); return response; };
  assert.equal((await send(payload)).status, 200);
  await User.updateOne({ _id: 'candidate-c' }, { $set: { education: 'Preserved education' } });
  assert.equal((await send(payload)).status, 200);
  assert.equal((await User.findById('candidate-c')).education, 'Preserved education');
  assert.equal((await send(payload + ' ')).status, 400);
});
test('recruiter JWT verification rejects expired, tampered and wrong-algorithm tokens', async () => {
  for (const token of [ownerToken + 'x', jwt.sign({ id: owner.id }, process.env.JWT_SECRET, { expiresIn: -1 }), jwt.sign({ id: owner.id }, process.env.JWT_SECRET, { algorithm: 'HS384' })])
    assert.equal((await request('/api/company/analytics', { token })).status, 401);
});
test('recruiter login uses bcrypt and rejects injected credentials', async () => {
  const result = await request('/api/company/login', { method: 'POST', body: { email: 'OWNER@example.test', password: 'safe-test-password' } });
  assert.equal(result.status, 200); assert.ok(result.body.token); assert.equal(result.body.company.password, undefined);
  assert.equal((await request('/api/company/login', { method: 'POST', body: { email: { $ne: '' }, password: 'safe-test-password' } })).status, 400);
  assert.equal((await request('/api/company/login', { method: 'POST', body: { email: 'owner@example.test', password: 'wrong' } })).status, 401);
  assert.equal((await request('/api/company/register', { method: 'POST', body: {} })).status, 400);
});
test('resume processing stores metadata and skills; Cloudinary transport is stubbed, never contacted', async () => {
  cloudinary.config({ cloud_name: 'isolated-test', api_key: 'isolated-test', api_secret: randomBytes(32).toString('hex') });
  const upload = mock.method(cloudinary.uploader, 'upload_stream', (options, callback) => {
    assert.equal(options.type, 'authenticated'); assert.equal(options.resource_type, 'raw');
    return new Writable({ write(chunk, encoding, done) { done(); }, final(done) {
      callback(null, { public_id: 'insiderjobs/resumes/test.pdf', secure_url: 'https://res.cloudinary.com/isolated-test/raw/authenticated/test.pdf' }); done();
    } });
  });
  try {
    const bytes = await readFile(new URL('../../../client/src/assets/sample-corporate-resume.pdf', import.meta.url));
    const form = new FormData(); form.set('resume', new Blob([bytes], { type: 'application/pdf' }), 'resume.pdf');
    const result = await request('/api/users/update-resume', { method: 'POST', candidate: 'candidate-a', form });
    assert.equal(result.status, 200); assert.equal(result.body.processingStatus, 'processed');
    const user = await User.findById('candidate-a');
    assert.equal(user.resumeAsset.publicId, 'insiderjobs/resumes/test.pdf'); assert.ok(user.resumeAnalysis);
    assert.equal(user.toObject().resumeText, undefined);
    const access = await request('/api/users/resume', { candidate: 'candidate-a' });
    assert.equal(access.status, 200); assert.match(access.body.url, /signature=/); assert.match(access.body.url, /expires_at=/);
    assert.equal((await request('/api/users/resume', { candidate: 'candidate-b' })).status, 404);
  } finally { upload.mock.restore(); }
});

test('recruiter job creation and public detail exercise the remaining API endpoint', async () => {
  assert.equal((await request('/api/company/post-job', { method: 'POST', token: ownerToken, body: {} })).status, 400);
  const result = await request('/api/company/post-job', { method: 'POST', token: ownerToken, body: {
    title: 'Endpoint audit fixture', description: '<p>React developer</p>', location: 'Remote', category: 'Programming', level: 'Junior', salary: 100, jobType: 'Contract', workMode: 'Remote',
  } });
  assert.equal(result.status, 201);
  const stored = await Job.findById(result.body.job._id); assert.equal(String(stored.companyId), owner.id);
  const details = await request('/api/jobs/' + stored.id); assert.equal(details.status, 200); assert.equal(details.body.job.title, 'Endpoint audit fixture');
});
