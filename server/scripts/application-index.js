import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import JobApplication from '../models/JobApplication.js';

try {
  await connectDB();
  const duplicateGroups = await JobApplication.aggregate([
    { $group: { _id: { userId: '$userId', jobId: '$jobId' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }, { $count: 'groups' },
  ]);
  // Report counts only; never print applicant identities or connection strings.
  console.log(`Duplicate application groups: ${duplicateGroups[0]?.groups || 0}`);
  const indexes = await JobApplication.collection.indexes().catch(error => {
    if (error.code === 26) return []; // An empty database has no collection/indexes yet.
    throw error;
  });
  const installed = indexes.some(index => index.unique && index.key.userId === 1 && index.key.jobId === 1);
  console.log(`Application uniqueness index installed: ${installed}`);
  if (process.argv.includes('--apply')) {
    if (duplicateGroups.length) throw new Error('Resolve duplicates manually before applying the index');
    await JobApplication.collection.createIndex({ userId: 1, jobId: 1 }, { unique: true });
    console.log('Application uniqueness index created');
  }
} catch { console.error('Index operation could not complete. Check configuration, collection availability and duplicate counts.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
