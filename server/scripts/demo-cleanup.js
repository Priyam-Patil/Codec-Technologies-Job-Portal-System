// Recovery after an interrupted demo. Never touches resources outside the recorded QA run.
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClerkClient } from '@clerk/express';
import { v2 as cloudinary } from 'cloudinary';
import connectCloudinary from '../config/cloudinary.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const audit = process.argv.includes('--audit');
const sessionPath = path.join(root, audit ? '.qa/audit-session.json' : '.qa/demo-session.json');
try {
  const session = JSON.parse(await fs.readFile(sessionPath));
  if (!/^[a-f\d-]{36}$/.test(session.run) || session.folder !== `insiderjobs/qa/${session.run}`) throw new Error('Invalid QA run');
  dotenv.config({ path: path.join(root, 'server/.env'), quiet: true });
  if (!process.env.CLERK_SECRET_KEY?.startsWith('sk_test_')) throw new Error('Development Clerk key required');
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  connectCloudinary();
  let count = 0, cursor;
  do {
    const page = await cloudinary.api.resources({ resource_type: 'raw', type: 'authenticated', prefix: session.folder + '/', max_results: 100, ...(cursor ? { next_cursor: cursor } : {}) });
    for (const resource of page.resources) {
      if (!resource.public_id.startsWith(session.folder + '/')) throw new Error('QA folder mismatch');
      await cloudinary.uploader.destroy(resource.public_id, { resource_type: 'raw', type: 'authenticated' }); count++;
    }
    cursor = page.next_cursor;
  } while (cursor);
  for (const candidate of session.users) {
    if (!candidate.email.startsWith(`jobs-${session.run.slice(0, 8)}-`) || !candidate.email.endsWith('+clerk_test@example.com')) throw new Error('QA identity mismatch');
    // Re-read the created user's identity before any deletion.
    const user = await clerk.users.getUser(candidate.id).catch(error => { if (error.status === 404) return null; throw error; });
    if (user && !user.emailAddresses.some(email => email.emailAddress === candidate.email)) throw new Error('QA identity mismatch');
    if (user) await clerk.users.deleteUser(candidate.id);
  }
  await fs.rm(sessionPath, { force: true });
  await fs.rm(path.join(root, audit ? '.qa/audit-assets.json' : '.qa/demo-assets.json'), { force: true });
  console.log(`Cleaned this demo's temporary Clerk users and ${count} QA resume assets. No production database was contacted.`);
} catch (error) {
  if (error.code === 'ENOENT') console.log('No recorded demo session to clean up');
  else { console.error('QA cleanup incomplete. Existing resources were left unchanged where ownership could not be verified.'); process.exitCode = 1; }
}
