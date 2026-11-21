// Real Clerk/Cloudinary demo with a disposable LOCAL database. Never imports server.js.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { randomBytes, randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { createClerkClient } from '@clerk/express';
import { v2 as cloudinary } from 'cloudinary';
import { createApp } from '../app.js';
import connectCloudinary from '../config/cloudinary.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';

const auditMode = process.argv.includes('--audit');
const manifest = auditMode ? 'audit-session.json' : 'demo-session.json';
const assetManifest = auditMode ? 'audit-assets.json' : 'demo-assets.json';
const apiPort = auditMode ? 5102 : 5101;
const uiPort = auditMode ? 5176 : 5173;
const root = fileURLToPath(new URL('../../', import.meta.url));
dotenv.config({ path: path.join(root, 'server/.env'), quiet: true });
const frontend = dotenv.parse(await fs.readFile(path.join(root, 'client/.env.local')));
if (!process.env.CLERK_SECRET_KEY?.startsWith('sk_test_') || !frontend.VITE_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
  throw new Error('Demo requires Clerk DEVELOPMENT keys. Environment files were not changed.');
}
// Runtime-only isolation. Existing files and configured database are never written or connected.
process.env.JWT_SECRET = randomBytes(32).toString('hex');
delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM; delete process.env.SENTRY_DSN;
process.env.ALLOWED_ORIGINS = `http://127.0.0.1:${uiPort},http://localhost:${uiPort}`;
const run = randomUUID();
const folder = `insiderjobs/qa/${run}`;
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const users = [];
const assets = [];
let mongo, api, vite, stopping = false;
await fs.mkdir(path.join(root, '.qa'), { recursive: true });
try {
  await fs.access(path.join(root, '.qa/' + manifest));
  throw new Error('A recorded demo session already exists. Stop that demo and run npm run demo:cleanup before starting a new one.');
} catch (error) { if (error.code !== 'ENOENT') throw error; }
async function stop() {
  if (stopping) return; stopping = true;
  await vite?.close();
  if (api) await new Promise(resolve => api.close(resolve));
  // Cleanup is restricted to assets and Clerk users created by THIS test run.
  let cleanupFailures = 0;
  for (const asset of assets) {
    if (asset.publicId.startsWith(folder + '/')) await cloudinary.uploader.destroy(asset.publicId, { resource_type: asset.resourceType, type: asset.type }).catch(() => { cleanupFailures++; });
  }
  for (const candidate of users) {
    const record = await User.findById(candidate.id).catch(() => null);
    if (record?.resumeAsset?.publicId?.startsWith(folder + '/')) {
      await cloudinary.uploader.destroy(record.resumeAsset.publicId, { resource_type: 'raw', type: 'authenticated' }).catch(() => { cleanupFailures++; });
    }
    await clerk.users.deleteUser(candidate.id).catch(error => { if (error.status !== 404) cleanupFailures++; });
  }
  await mongoose.disconnect(); await mongo?.stop();
  if (!cleanupFailures) {
    await fs.rm(path.join(root, '.qa/' + manifest), { force: true });
    await fs.rm(path.join(root, '.qa/' + assetManifest), { force: true });
  } else console.error('Some QA resources could not be cleaned. The ignored run manifest was retained; run npm run demo:cleanup after stopping.');
}
process.on('SIGINT', () => stop().then(() => process.exit(0)));
process.on('SIGTERM', () => stop().then(() => process.exit(0)));
process.stdin.setEncoding('utf8');
process.stdin.on('data', value => { if (value.trim() === 'stop') void stop().then(() => process.exit(0)); });
try {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri('insiderjobs_demo');
  if (!uri.startsWith('mongodb://127.0.0.1:')) throw new Error('Local database required');
  await mongoose.connect(uri);
  await Promise.all([Company.init(), User.init(), Job.init(), JobApplication.init()]);
  connectCloudinary();
  for (const viewport of ['desktop', 'tablet', 'mobile']) {
    const email = `jobs-${run.slice(0, 8)}-${viewport}+clerk_test@example.com`;
    const password = randomBytes(24).toString('base64url') + '!Aa7';
    const user = await clerk.users.createUser({ emailAddress: [email], password, firstName: 'Demo', lastName: viewport });
    users.push({ id: user.id, email, password, viewport });
    // Do not seed MongoDB candidate profiles: the real first-sign-in path must initialize them securely.
  }
  const recruiterPassword = randomBytes(20).toString('base64url');
  const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#1d4ed8"/><text x="15" y="50" fill="white" font-size="28">QA</text></svg>');
  const [owner, other] = await Company.create([
    { name: 'InsiderJobs Demo', email: 'recruiter@example.test', image, password: await bcrypt.hash(recruiterPassword, 10) },
    { name: 'Other Demo Company', email: 'other@example.test', image, password: await bcrypt.hash(recruiterPassword, 10) },
  ]);
  const fields = { category: 'Programming', level: 'Intermediate level', date: Date.now(), companyId: owner._id };
  const jobs = await Job.create([
    { ...fields, title: 'Full Stack Developer', description: '<p>Build products with React, JavaScript, Node.js, Express and MongoDB.</p>', location: 'Bangalore', salary: 1200000, jobType: 'Full-time', workMode: 'Hybrid' },
    { ...fields, title: 'Python Engineer', description: '<p>Build APIs using Python, Django and PostgreSQL.</p>', location: 'Remote', level: 'Senior level', salary: 1800000, jobType: 'Contract', workMode: 'Remote' },
  ]);
  const app = createApp({ runtimeMode: auditMode ? 'local-audit' : 'local-demo' }); // Real Clerk middleware.
  app.locals.resumeFolder = folder;
  app.locals.logoFolder = folder;
  app.locals.recordAsset = async asset => {
    if (!asset.publicId.startsWith(folder + '/')) throw new Error('QA asset escaped isolated folder');
    assets.push(asset);
    await fs.writeFile(path.join(root, '.qa/' + assetManifest), JSON.stringify({ run, folder, assets }));
  };
  api = app.listen(apiPort, '127.0.0.1');
  await new Promise(resolve => api.once('listening', resolve));
  const require = createRequire(path.join(root, 'client/package.json'));
  const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
  vite = await createServer({ root: path.join(root, 'client'),
    define: { 'import.meta.env.VITE_BACKEND_URL': JSON.stringify(`http://127.0.0.1:${apiPort}`) },
    server: { host: '127.0.0.1', port: uiPort, strictPort: true, open: false },
  });
  await vite.listen();
  await fs.writeFile(path.join(root, '.qa/' + manifest), JSON.stringify({ run, mongoUri: uri, users, recruiter: { email: owner.email, password: recruiterPassword }, otherRecruiter: { email: other.email, password: recruiterPassword }, jobs: jobs.map(job => ({ id: job.id, title: job.title })), folder }));
  console.log(`Demo ready: frontend http://127.0.0.1:${uiPort} | backend http://127.0.0.1:${apiPort}`);
  console.log(`Real Clerk test authentication and Cloudinary; isolated local MongoDB; email disabled. Account details stay in ignored .qa/${manifest}.`);
} catch (error) {
  console.error('Demo startup failed:', error.errors?.[0]?.code || error.code || 'Check service configuration and availability');
  await stop(); process.exitCode = 1;
}
