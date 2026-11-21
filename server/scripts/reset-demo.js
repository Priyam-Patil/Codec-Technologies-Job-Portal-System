// Reset only the locally generated disposable demo records, never the configured database.
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
const session = JSON.parse(await fs.readFile(new URL('../../.qa/demo-session.json', import.meta.url)));
if (!/^[a-f\d-]{36}$/.test(session.run) || !session.mongoUri?.startsWith('mongodb://127.0.0.1:') || !session.mongoUri.endsWith('/insiderjobs_demo')) throw new Error('Refusing to reset a database outside the disposable demo');
const connection = await mongoose.createConnection(session.mongoUri, { autoIndex: false, autoCreate: false }).asPromise();
try {
  const users = session.users.filter(user => user.email.startsWith(`jobs-${session.run.slice(0, 8)}-`) && user.email.endsWith('+clerk_test@example.com')).map(user => user.id);
  if (users.length !== session.users.length) throw new Error('Demo identity ownership mismatch');
  const owner = await connection.db.collection('companies').findOne({ email: session.recruiter.email });
  if (!owner || owner.name !== 'InsiderJobs Demo') throw new Error('Demo company ownership mismatch');
  await connection.db.collection('jobapplications').deleteMany({ userId: { $in: users }, companyId: owner._id });
  await connection.db.collection('users').updateMany({ _id: { $in: users } }, { $set: { savedJobs: [], resume: '', resumeAsset: {}, resumeAnalysis: {}, skills: [], education: '', experience: '', github: '', linkedin: '', portfolio: '' } });
  await connection.db.collection('jobs').deleteMany({ companyId: owner._id, title: { $regex: '^Browser QA (desktop|mobile) ' } });
  console.log('Disposable demo reset: candidate profiles/applications cleared; two starter jobs retained. QA assets remain tracked for shutdown cleanup.');
} finally { await connection.close(); }
