// Disposable local QA preview. No dotenv, no production connections or uploads.
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createApp } from '../app.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import bcrypt from 'bcrypt';

process.env.JWT_SECRET = randomBytes(32).toString('hex');
delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM;
const mongo = await MongoMemoryServer.create();
await mongoose.connect(mongo.getUri('insiderjobs_browser_qa'));
const company = await Company.create({ name: 'QA Company — isolated test data', email: 'qa@example.test', password: await bcrypt.hash('qa-preview-password', 4), image: 'https://placehold.co/80x80?text=QA' });
await Job.create([
  { title: 'Full Stack Developer', description: '<p>Build thoughtful products using React, Node.js, Express and MongoDB.</p>', category: 'Programming', location: 'Bangalore', level: 'Intermediate level', salary: 1200000, jobType: 'Full-time', workMode: 'Hybrid', companyId: company._id, date: Date.now() },
  { title: 'Python Engineer', description: '<p>Design APIs using Python, Django and PostgreSQL.</p>', category: 'Programming', location: 'Remote', level: 'Senior level', salary: 1800000, jobType: 'Contract', workMode: 'Remote', companyId: company._id, date: Date.now() },
]);
const api = createApp({ identityMiddleware(req, res, next) {
  req.auth = Object.assign(() => ({ userId: null, tokenType: 'session_token' }), { [Symbol.for('@clerk/express.auth')]: true }); next();
} }).listen(5101, '127.0.0.1');
const require = createRequire(new URL('../../client/package.json', import.meta.url));
const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
const vite = await createServer({ root: fileURLToPath(new URL('../../client', import.meta.url)),
  define: { 'import.meta.env.VITE_BACKEND_URL': JSON.stringify('http://127.0.0.1:5101') },
  server: { host: '127.0.0.1', port: 5173, strictPort: true, open: false } });
await vite.listen();
console.log('Isolated browser QA: http://127.0.0.1:5173');
async function stop() { await vite.close(); await new Promise(resolve => api.close(resolve)); await mongoose.disconnect(); await mongo.stop(); process.exit(0); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
