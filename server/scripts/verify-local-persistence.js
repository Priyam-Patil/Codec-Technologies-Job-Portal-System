import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
const sessionPath = new URL('../../.qa/local-session.json', import.meta.url);
const evidencePath = new URL('../../.qa/local-persistence-proof.json', import.meta.url);
const session = JSON.parse(await fs.readFile(sessionPath));
const health = await fetch('http://127.0.0.1:5000/health');
if (health.headers.get('x-insiderjobs-mode') !== 'local-development' || !session.mongoUri.startsWith('mongodb://127.0.0.1:') || !session.mongoUri.endsWith('/insiderjobs_development')) throw new Error('Local development database guard failed');
const db = await mongoose.createConnection(session.mongoUri, { autoIndex: false, autoCreate: false }).asPromise();
try {
  const result = {};
  for (const name of ['users', 'companies', 'jobs', 'jobapplications']) {
    const records = await db.db.collection(name).find().sort({ _id: 1 }).toArray();
    result[name] = { count: records.length, digest: createHash('sha256').update(JSON.stringify(records)).digest('hex') };
  }
  if (process.argv.includes('--compare')) {
    const before = JSON.parse(await fs.readFile(evidencePath));
    if (JSON.stringify(before) !== JSON.stringify(result)) throw new Error('Persisted records changed across restart');
    console.log('PASS: all four collections retained identical records across backend restart.');
  } else { await fs.writeFile(evidencePath, JSON.stringify(result)); console.log('Local persistence baseline recorded (no account details logged).'); }
  for (const [name, value] of Object.entries(result)) console.log(`${name}: ${value.count} records`);
} finally { await db.close(); }
