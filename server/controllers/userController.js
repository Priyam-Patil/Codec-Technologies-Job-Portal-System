import JobApplication from '../models/JobApplication.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import { objectId, text } from '../utils/validation.js';
import { analyzeResume, extractSkills, matchJob } from '../utils/matching.js';
import { parseResume, uploadBuffer, resumeUrl } from '../utils/resume.js';
import { notifyApplication } from '../utils/notifications.js';
import { randomUUID } from 'node:crypto';
import { ensureCandidateProfile } from '../utils/candidateProfile.js';

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
async function candidate(req) {
  return ensureCandidateProfile(req.userId);
}
export const getUserData = async (req, res) => {
  const user = (await candidate(req)).toObject();
  user.resume = resumeUrl(user);
  res.json({ success: true, user });
};
export const applyForJob = async (req, res) => {
  const { jobId } = req.body;
  if (!objectId(jobId)) fail(400, 'Invalid job ID');
  const user = await candidate(req);
  if (!user.resume) fail(400, 'Upload a resume before applying');
  const job = await Job.findOne({ _id: jobId, visible: true });
  if (!job) fail(404, 'Job is unavailable');
  if (await JobApplication.exists({ userId: req.userId, jobId })) fail(409, 'Already applied');
  try {
    await JobApplication.create({ companyId: job.companyId, userId: req.userId, jobId, date: Date.now() });
  } catch (error) {
    if (error.code === 11000) fail(409, 'Already applied');
    throw error;
  }
  const notification = await notifyApplication(user, job, 'Pending');
  res.status(201).json({ success: true, message: 'Applied successfully', notification });
};
export const getUserJobApplications = async (req, res) => {
  const applications = await JobApplication.find({ userId: req.userId })
    .populate('companyId', 'name image').populate('jobId', 'title description location category level salary').sort({ date: 1 });
  res.json({ success: true, applications });
};
export const updateUserResume = async (req, res) => {
  const user = await candidate(req);
  if (!req.file) fail(400, 'Select a PDF resume');
  const parsed = await parseResume(req.file.buffer);
  if (parsed.status === 'invalid' || parsed.status === 'encrypted') fail(422, 'This PDF is damaged or password-protected. Upload an unlocked, valid PDF.');
  const analysis = analyzeResume(parsed.text);
  const asset = await uploadBuffer(req.file.buffer, {
    resource_type: 'raw', type: 'authenticated', folder: req.app?.locals.resumeFolder || 'insiderjobs/resumes', public_id: `${randomUUID()}.pdf`,
  });
  await req.app?.locals.recordAsset?.({ publicId: asset.public_id, resourceType: 'raw', type: 'authenticated' });
  user.resume = asset.secure_url;
  user.resumeAsset = { publicId: asset.public_id, originalName: text(req.file.originalname), uploadedAt: new Date(), processingStatus: parsed.status };
  user.resumeAnalysis = analysis;
  await user.save();
  res.json({ success: true, message: parsed.status === 'processed' ? 'Resume uploaded and analyzed' : 'Resume uploaded. Text could not be read; add profile skills for recommendations.', analysis, processingStatus: parsed.status,
    user: { ...user.toObject(), resume: resumeUrl(user) } });
};
export const updateProfile = async (req, res) => {
  await candidate(req);
  const updates = {};
  for (const field of ['education', 'experience']) if (field in req.body) updates[field] = text(req.body[field], 5000);
  for (const field of ['github', 'linkedin', 'portfolio']) if (field in req.body) {
    const value = text(req.body[field], 500);
    if (value) {
      let url;
      try { url = new URL(value); } catch { fail(400, `Invalid ${field} URL`); }
      if (url.protocol !== 'https:' || url.username || url.password) fail(400, 'Profile links must use HTTPS without credentials');
      if (field === 'github' && !['github.com', 'www.github.com'].includes(url.hostname)) fail(400, 'Use a github.com profile URL');
      if (field === 'linkedin' && !['linkedin.com', 'www.linkedin.com'].includes(url.hostname)) fail(400, 'Use a linkedin.com profile URL');
    }
    updates[field] = value;
  }
  if ('skills' in req.body) {
    if (!Array.isArray(req.body.skills) || req.body.skills.length > 50 || req.body.skills.some(skill => typeof skill !== 'string')) fail(400, 'Provide up to 50 skill names');
    updates.skills = [...new Set(req.body.skills.map(skill => text(skill, 60)).filter(Boolean))];
  }
  const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { returnDocument: 'after', runValidators: true });
  const result = user.toObject(); result.resume = resumeUrl(user);
  res.json({ success: true, user: result, message: 'Profile updated. Name and email are managed in your Clerk account.' });
};
export const getSavedJobs = async (req, res) => {
  const user = await (await candidate(req)).populate({ path: 'savedJobs', match: { visible: true }, populate: { path: 'companyId', select: 'name image' } });
  res.json({ success: true, jobs: user.savedJobs.filter(job => job && job.companyId) });
};
export const saveJob = async (req, res) => {
  const { id } = req.params;
  if (!objectId(id)) fail(400, 'Invalid job ID');
  await candidate(req);
  if (!await Job.exists({ _id: id, visible: true })) fail(404, 'Job unavailable');
  await User.updateOne({ _id: req.userId }, { $addToSet: { savedJobs: id } });
  res.json({ success: true, message: 'Job saved' });
};
export const removeSavedJob = async (req, res) => {
  if (!objectId(req.params.id)) fail(400, 'Invalid job ID');
  await candidate(req);
  await User.updateOne({ _id: req.userId }, { $pull: { savedJobs: req.params.id } });
  res.json({ success: true, message: 'Job removed' });
};
export const recommendations = async (req, res) => {
  const user = await candidate(req);
  const skills = [...new Set([...(user.resumeAnalysis?.skills || []), ...extractSkills(user.skills.join(' '))])];
  const applications = await JobApplication.find({ userId: req.userId }).select('jobId');
  const jobs = await Job.find({ visible: true, _id: { $nin: applications.map(item => item.jobId) } }).populate('companyId', 'name image');
  const ranked = jobs.filter(job => job.companyId).map(job => ({ job, ...matchJob(skills, job) }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.job.date - a.job.date);
  let comparison = null;
  if (req.query.jobId) {
    if (!objectId(req.query.jobId)) fail(400, 'Invalid job ID');
    const job = await Job.findOne({ _id: req.query.jobId, visible: true });
    if (!job) fail(404, 'Job unavailable');
    comparison = { title: job.title, ...matchJob(skills, job) };
  }
  res.json({ success: true, skills, analysis: user.resumeAnalysis, processingStatus: user.resumeAsset?.processingStatus || 'not_processed',
    fallback: !skills.length ? 'Upload a text-based PDF resume or add profile skills. Jobs are shown by recency until skills are available.' : null,
    recommendations: ranked.slice(0, 30), comparison });
};
export const getResume = async (req, res) => {
  const url = resumeUrl(await candidate(req));
  if (!url) fail(404, 'No resume uploaded');
  res.json({ success: true, url });
};
