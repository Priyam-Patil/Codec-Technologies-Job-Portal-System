import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.js';
import { databaseDiagnostic } from '../utils/databaseDiagnostic.js';

test('database diagnostics classify nested failures without leaking driver text', () => {
  for (const [code, expected] of [['ENOTFOUND', 'DATABASE_DNS_UNAVAILABLE'], ['EAI_AGAIN', 'DATABASE_DNS_UNAVAILABLE'], ['ECONNREFUSED', 'DATABASE_CONNECTION_REFUSED'], [18, 'DATABASE_AUTHENTICATION_FAILED'], ['ETIMEDOUT', 'DATABASE_CONNECTION_TIMEOUT']]) {
    const result = databaseDiagnostic({ reason: { servers: new Map([['confidential-host', { error: { code, message: 'confidential-driver-string' } }]]) } });
    assert.equal(result.code, expected); assert.ok(!JSON.stringify(result).includes('confidential'));
  }
});

test('lazy database failure retains CORS and safe JSON; preflight does not contact MongoDB', async () => {
  let attempts = 0;
  const app = createApp({ identityMiddleware: (req, res, next) => next(), connectDatabase: async () => {
    attempts++; throw Object.assign(new Error('querySrv ENOTFOUND confidential-host'), { code: 'ENOTFOUND' });
  } });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const options = await fetch(origin + '/api/users/update-resume', { method: 'OPTIONS', headers: { Origin: 'http://127.0.0.1:5175', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization' } });
    assert.equal(options.status, 204); assert.equal(attempts, 0);
    const response = await fetch(origin + '/api/jobs', { headers: { Origin: 'http://127.0.0.1:5175' } });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5175');
    const body = await response.json(); assert.equal(body.code, 'DATABASE_DNS_UNAVAILABLE');
    assert.ok(!JSON.stringify(body).includes('confidential-host'));
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('health and API fail promptly when no MongoDB connection is ready', async () => {
  const app = createApp({ identityMiddleware: (req, res, next) => next() });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(origin + '/health'); assert.equal(health.status, 503);
    assert.equal((await health.json()).database, 'unavailable');
    const jobs = await fetch(origin + '/api/jobs', { signal: AbortSignal.timeout(3000) });
    assert.equal(jobs.status, 503); assert.equal((await jobs.json()).code, 'DATABASE_UNAVAILABLE');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
