import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractSkills, analyzeResume, matchJob } from '../utils/matching.js';
import { jobInput, cleanHtml, objectId } from '../utils/validation.js';
import { parseResume } from '../utils/resume.js';
import { notifyApplication } from '../utils/notifications.js';
import { rateLimit } from '../middleware/security.js';
import { mock } from 'node:test';

test('skill boundaries and aliases avoid Java/JavaScript and C++ collisions', () => {
  assert.deepEqual(extractSkills('JavaScript React.js Node.js MongoDB C++ C#'), ['JavaScript', 'React', 'Node.js', 'MongoDB', 'C++', 'C#']);
  assert.deepEqual(extractSkills('Java PostgreSQL'), ['Java', 'PostgreSQL']);
  assert.deepEqual(extractSkills('Expressive reaction to a gift'), []);
});
test('coverage is explainable and repeated skills do not inflate scores', () => {
  const match = matchJob(['React'], { title: 'React engineer', description: 'React React Node.js' });
  assert.equal(match.score, 50); assert.deepEqual(match.missingSkills, ['Node.js']);
  assert.equal(matchJob([], { title: 'Designer', description: 'Communication' }).score, null);
});
test('analysis treats explicit experience as an unverified hint', () => {
  assert.equal(analyzeResume('Python, 3 years of experience').experienceYears, 3);
  assert.equal(analyzeResume('Graduated in 2022').experienceYears, null);
  assert.ok(analyzeResume('').suggestions.length > 1);
});
test('sanitizer removes executable HTML and keeps useful formatting', () => {
  const result = cleanHtml('<p onclick="evil()">React</p><script>alert(1)</script><a href="javascript:alert(1)">go</a><img src=x onerror=evil()>');
  assert.ok(result.includes('<p>React</p>'));
  assert.ok(!/onclick|script|onerror|<img/.test(result));
});
test('job validation rejects objects, negative salary and invalid enum; accepts zero', () => {
  const body = { title: 'Developer', description: '<p>React</p>', location: 'Remote', category: 'Programming', level: 'Junior', salary: 0 };
  assert.equal(jobInput(body).salary, 0);
  assert.throws(() => jobInput({ ...body, title: { $ne: null } }));
  assert.throws(() => jobInput({ ...body, salary: -1 }));
  assert.throws(() => jobInput({ ...body, jobType: 'arbitrary' }));
  assert.throws(() => jobInput({ ...body, description: '<script>alert(1)</script>' }));
  assert.equal(objectId({ $ne: '' }), false);
});
test('non-PDF is rejected before worker or upload', () => {
  assert.throws(() => parseResume(Buffer.from('not a PDF')), /valid PDF/);
});
test('malformed PDF is distinguished from an unreadable valid document', async () => {
  assert.equal((await parseResume(Buffer.from('%PDF-1.7 invalid content'))).status, 'invalid');
});
test('existing sample PDF parses without external services', async () => {
  const parsed = await parseResume(await readFile(new URL('../../client/src/assets/sample-corporate-resume.pdf', import.meta.url)));
  assert.equal(parsed.status, 'processed'); assert.ok(parsed.text.length > 30);
});
test('rate limit rejects excess traffic with retry metadata', () => {
  const middleware = rateLimit({ limit: 1 });
  let next = 0, status;
  const response = { set() {}, status(code) { status = code; return this; }, json() {} };
  middleware({ ip: 'test' }, response, () => next++);
  middleware({ ip: 'test' }, response, () => next++);
  assert.equal(next, 1); assert.equal(status, 429);
});
test('email is explicitly disabled when no transport is configured', async () => {
  // Tests run without dotenv. Never use configured credentials or send real messages.
  const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM;
  try { assert.equal(await notifyApplication({}, {}, 'Pending'), 'not_configured'); }
  finally { if (key !== undefined) process.env.RESEND_API_KEY = key; if (from !== undefined) process.env.EMAIL_FROM = from; }
});
test('configured email transport reports success and failure without sending real messages', async () => {
  const oldKey = process.env.RESEND_API_KEY, oldFrom = process.env.EMAIL_FROM;
  process.env.RESEND_API_KEY = 'isolated-test'; process.env.EMAIL_FROM = 'no-reply@example.test';
  const transport = mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(JSON.parse(options.body).to[0], 'candidate@example.test');
    return { ok: true };
  });
  try {
    assert.equal(await notifyApplication({ email: 'candidate@example.test' }, { title: 'Developer' }, 'Accepted'), 'sent');
    transport.mock.mockImplementation(async () => { throw new Error('Network failure'); });
    assert.equal(await notifyApplication({ email: 'candidate@example.test' }, { title: 'Developer' }, 'Rejected'), 'failed');
  } finally {
    transport.mock.restore();
    if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
    if (oldFrom === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = oldFrom;
  }
});
