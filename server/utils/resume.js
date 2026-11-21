import { Worker } from 'node:worker_threads';
import { v2 as cloudinary } from 'cloudinary';

export function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => error ? reject(error) : resolve(result));
    stream.end(buffer);
  });
}
export function parseResume(buffer) {
  if (buffer.subarray(0, 5).toString() !== '%PDF-') throw Object.assign(new Error('Upload a valid PDF resume'), { status: 400 });
  // Isolate untrusted PDF parsing with a wall-clock deadline and heap limit.
  return new Promise(resolve => {
    const worker = new Worker(new URL('./resumeWorker.js', import.meta.url), { workerData: buffer, resourceLimits: { maxOldGenerationSizeMb: 128 } });
    let settled = false;
    const finish = value => { if (settled) return; settled = true; clearTimeout(timer); void worker.terminate(); resolve(value); };
    const timer = setTimeout(() => finish({ text: '', status: 'unreadable' }), 12000);
    worker.once('message', finish);
    worker.once('error', () => finish({ text: '', status: 'unreadable' }));
    worker.once('exit', () => finish({ text: '', status: 'unreadable' }));
  });
}
export function resumeUrl(user) {
  if (!user.resumeAsset?.publicId) {
    // Preserve legacy links, but reject active URL schemes even in old records.
    try { const url = new URL(user.resume); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
    catch { return null; }
  }
  return cloudinary.utils.private_download_url(user.resumeAsset.publicId, '', {
    resource_type: 'raw', type: 'authenticated', expires_at: Math.floor(Date.now() / 1000) + 120,
    attachment: true,
  });
}
