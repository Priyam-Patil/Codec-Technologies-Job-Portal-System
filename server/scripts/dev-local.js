// Explicit persistent LOCAL development mode. Never reads the configured MongoDB URI into a connection.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import net from 'node:net';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import connectCloudinary from '../config/cloudinary.js';
import JobApplication from '../models/JobApplication.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
dotenv.config({ path: path.join(root, 'server/.env'), quiet: true });
if (!process.env.CLERK_SECRET_KEY?.startsWith('sk_test_')) throw new Error('Local development requires Clerk development credentials');
const directory = path.join(root, '.qa/local-mongodb');
await fs.mkdir(directory, { recursive: true });
// Only runtime settings change. Environment files, production resources and their values are preserved.
delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM; delete process.env.SENTRY_DSN;
process.env.ALLOWED_ORIGINS = 'http://127.0.0.1:5175,http://localhost:5175';
const withClient = process.argv.includes('--with-client');
let mongo, server, vite;
async function stop() {
  await vite?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect(); await mongo?.stop({ doCleanup: false });
  console.log('Local development stopped. MongoDB files were preserved.');
}
try {
  // Detect existing listeners before opening the persistent MongoDB directory.
  for (const port of withClient ? [5000, 5175] : [5000]) await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
  mongo = await MongoMemoryServer.create({ instance: { dbPath: directory, dbName: 'insiderjobs_development', storageEngine: 'wiredTiger' } });
  const uri = mongo.getUri('insiderjobs_development');
  if (!uri.startsWith('mongodb://127.0.0.1:')) throw new Error('Refusing a nonlocal database');
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
  // A new empty development database can be provisioned; existing records are never migrated automatically.
  const indexes = await JobApplication.collection.indexes().catch(error => { if (error.code === 26) return []; throw error; });
  if (!indexes.some(index => index.unique && index.key.userId === 1 && index.key.jobId === 1)) {
    if (await JobApplication.countDocuments() === 0) await JobApplication.collection.createIndex({ userId: 1, jobId: 1 }, { unique: true });
    else console.warn('Local application uniqueness index needs review. No existing records were modified.');
  }
  connectCloudinary();
  const app = createApp({ runtimeMode: 'local-development' });
  app.locals.resumeFolder = 'insiderjobs/local-development/resumes';
  app.locals.logoFolder = 'insiderjobs/local-development/logos';
  server = app.listen(5000, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  await fs.writeFile(path.join(root, '.qa/local-session.json'), JSON.stringify({ mongoUri: uri, database: 'insiderjobs_development' }));
  if (withClient) {
    const require = createRequire(path.join(root, 'client/package.json'));
    const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
    vite = await createServer({ root: path.join(root, 'client'), server: { host: '127.0.0.1', port: 5175, strictPort: true, open: false } });
    await vite.listen();
  }
  console.log(withClient ? 'Persistent local application ready: http://127.0.0.1:5175 | API http://127.0.0.1:5000' : 'Persistent local API ready: http://127.0.0.1:5000 | frontend: npm run dev:local in client (port 5175)');
  console.log('No sample accounts or jobs were seeded. Sign in with Clerk or register a recruiter through the application. Email is disabled in this local mode.');
  let stopping = false;
  const shutdown = () => { if (stopping) return; stopping = true; void stop().then(() => process.exit(0)); };
  process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
  process.stdin.setEncoding('utf8'); process.stdin.on('data', value => { if (value.trim() === 'stop') shutdown(); });
} catch (error) {
  console.error('Local development startup failed:', error.code || 'Check local ports and development-service configuration');
  await stop(); process.exitCode = 1;
}
