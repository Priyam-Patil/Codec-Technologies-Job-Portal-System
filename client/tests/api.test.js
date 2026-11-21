import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiClient, normalizeBackendUrl, validateBackendUrl } from '../src/lib/api.js';

test('API configuration rejects missing, unsafe and mixed-content targets before a request', async () => {
  for (const value of ['', 'undefined', 'ftp://example.test', 'https://user:private@example.test', 'https://example.test?key=private']) {
    const client = createApiClient({ baseUrl: value, pageProtocol: 'https:' });
    await assert.rejects(client.get('/api/jobs'), error => error.code === 'ERR_API_CONFIGURATION' && !error.message.includes('private'));
  }
  assert.throws(() => validateBackendUrl('http://example.test', 'https:'), /HTTPS API/);
  assert.equal(normalizeBackendUrl(' http://127.0.0.1:5000/// '), 'http://127.0.0.1:5000');
});

test('real HTTP JSON failures preserve status/message and mutations are not retried', async () => {
  let mutations = 0;
  const server = http.createServer((req, res) => {
    if (req.url === '/slow') { mutations++; return; }
    res.writeHead(req.url === '/unauthorized' ? 401 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: req.url === '/unauthorized' ? 'Session expired' : 'Database temporarily unavailable' }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const client = createApiClient({ baseUrl: origin, pageProtocol: 'http:' });
  try {
    await assert.rejects(client.get(origin + '/unavailable'), error => error.response.status === 503 && error.message === 'Database temporarily unavailable');
    await assert.rejects(client.get(origin + '/unauthorized'), error => error.response.status === 401 && error.message === 'Session expired');
    await assert.rejects(client.post(origin + '/slow', {}, { timeout: 40 }), /did not respond in time/);
    assert.equal(mutations, 1);
    await assert.rejects(client.get('http://different.example.test/api/jobs'), error => error.code === 'ERR_API_CONFIGURATION');
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

test('actual refused connections and offline failures have actionable messages', async () => {
  const server = http.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  await new Promise(resolve => server.close(resolve));
  const client = createApiClient({ baseUrl: origin });
  await assert.rejects(client.get(origin + '/api/jobs'), error => !error.response && error.message.startsWith('Cannot reach the API.'));
  const offline = createApiClient({ baseUrl: origin, isOnline: () => false });
  await assert.rejects(offline.get(origin + '/api/jobs'), /appear to be offline/);
});
