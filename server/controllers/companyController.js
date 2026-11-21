import Company from '../models/Company.js';
import bcrypt from 'bcrypt';
import generateToken from '../utils/generateToken.js';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import User from '../models/User.js';
import { jobInput, objectId, statuses, text } from '../utils/validation.js';
import { uploadBuffer, resumeUrl } from '../utils/resume.js';
import { notifyApplication } from '../utils/notifications.js';

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const publicCompany = company => ({ _id: company._id, name: company.name, email: company.email, image: company.image });
export const registerCompany = async (req, res) => {
  const name = text(req.body.name), email = text(req.body.email).toLowerCase(), password = req.body.password;
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 10 || Buffer.byteLength(password) > 72 || !req.file)
    fail(400, 'Provide a name, valid email, logo, and a password of 10–72 bytes');
  const buffer = req.file.buffer;
  const png = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  const webp = buffer.subarray(0,4).toString() === 'RIFF' && buffer.subarray(8,12).toString() === 'WEBP';
  if (!png && !jpeg && !webp) fail(400, 'Invalid logo image');
  if (await Company.exists({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } })) fail(409, 'Company already registered');
  const hash = await bcrypt.hash(password, 12);
  const image = await uploadBuffer(buffer, { resource_type: 'image', folder: req.app?.locals.logoFolder || 'insiderjobs/logos' });
  await req.app?.locals.recordAsset?.({ publicId: image.public_id, resourceType: 'image', type: 'upload' });
  const company = await Company.create({ name, email, password: hash, image: image.secure_url });
  res.status(201).json({ success: true, message: 'Company registered successfully', company: publicCompany(company), token: generateToken(company._id) });
};
export const loginCompany = async (req, res) => {
  const email = text(req.body.email).toLowerCase(), password = req.body.password;
  if (!email || typeof password !== 'string' || Buffer.byteLength(password) > 72) fail(400, 'Provide email and password');
  // Case-insensitive legacy lookup preserves accounts registered before normalization.
  const company = await Company.findOne({ email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
  if (!company || !await bcrypt.compare(password, company.password)) fail(401, 'Invalid email or password');
  res.json({ success: true, message: 'Login successful', company: publicCompany(company), token: generateToken(company._id) });
};
export const getCompanyData = async (req, res) => res.json({ success: true, company: publicCompany(req.company) });
export const postJob = async (req, res) => {
  const job = await Job.create({ ...jobInput(req.body), companyId: req.company._id, date: Date.now() });
  res.status(201).json({ success: true, message: 'Job posted successfully', job });
};
export const editJob = async (req, res) => {
  if (!objectId(req.params.id)) fail(400, 'Invalid job ID');
  const job = await Job.findOneAndUpdate({ _id: req.params.id, companyId: req.company._id }, { $set: jobInput(req.body, true) }, { returnDocument: 'after', runValidators: true });
  if (!job) fail(404, 'Job not found');
  res.json({ success: true, message: 'Job updated', job });
};
export const getCompanyJobApplicants = async (req, res) => {
  const applications = await JobApplication.find({ companyId: req.company._id })
    .populate('userId', 'name email image resume resumeAsset').populate('jobId', 'title location category level salary').sort({ date: -1 });
  // Resume access is resolved separately after checking application ownership.
  const result = applications.map(application => {
    const item = application.toObject();
    if (item.userId) { item.userId.resume = item.userId.resume ? 'available' : ''; delete item.userId.resumeAsset; }
    return item;
  });
  res.json({ success: true, applications: result });
};
export const getCompanyPostedJobs = async (req, res) => {
  const [jobs, counts] = await Promise.all([
    Job.find({ companyId: req.company._id }).sort({ date: 1 }).lean(),
    JobApplication.aggregate([{ $match: { companyId: req.company._id } }, { $group: { _id: '$jobId', count: { $sum: 1 } } }]),
  ]);
  const map = new Map(counts.map(item => [String(item._id), item.count]));
  res.json({ success: true, jobsData: jobs.map(job => ({ ...job, applicants: map.get(String(job._id)) || 0 })) });
};
export const ChangeJobApplicationsStatus = async (req, res) => {
  const { id, status } = req.body;
  if (!objectId(id) || !statuses.includes(status)) fail(400, 'Provide a valid application ID and Pending, Accepted or Rejected status');
  const application = await JobApplication.findOneAndUpdate({ _id: id, companyId: req.company._id, status: { $ne: status } }, { $set: { status } }, { returnDocument: 'after', runValidators: true });
  if (!application) {
    if (!await JobApplication.exists({ _id: id, companyId: req.company._id })) fail(404, 'Application not found');
    return res.json({ success: true, message: 'Status unchanged', notification: 'unchanged' });
  }
  const [user, job] = await Promise.all([User.findById(application.userId), Job.findById(application.jobId)]);
  const notification = user && job ? await notifyApplication(user, job, status) : 'no_recipient';
  res.json({ success: true, message: `Application ${status}`, application, notification });
};
export const changeVisibility = async (req, res) => {
  if (!objectId(req.body.id)) fail(400, 'Invalid job ID');
  const job = await Job.findOneAndUpdate({ _id: req.body.id, companyId: req.company._id }, [{ $set: { visible: { $not: '$visible' } } }], { returnDocument: 'after', updatePipeline: true });
  if (!job) fail(404, 'Job not found');
  res.json({ success: true, message: 'Job visibility updated', job });
};
export const analytics = async (req, res) => {
  const [jobs, groups, perJob] = await Promise.all([
    Job.find({ companyId: req.company._id }).select('title visible').lean(),
    JobApplication.aggregate([{ $match: { companyId: req.company._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    JobApplication.aggregate([{ $match: { companyId: req.company._id } }, { $group: { _id: '$jobId', count: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(groups.map(item => [item._id, item.count]));
  const total = groups.reduce((sum, item) => sum + item.count, 0);
  const map = new Map(perJob.map(item => [String(item._id), item.count]));
  res.json({ success: true, analytics: { totalJobs: jobs.length, activeJobs: jobs.filter(job => job.visible).length,
    inactiveJobs: jobs.filter(job => !job.visible).length, totalApplications: total, pending: counts.Pending || 0,
    accepted: counts.Accepted || 0, rejected: counts.Rejected || 0,
    applicationsPerJob: jobs.map(job => ({ id: job._id, title: job.title, count: map.get(String(job._id)) || 0 })) } });
};
export const scheduleInterview = async (req, res) => {
  const { id } = req.params;
  const { scheduledAt, status = 'Scheduled' } = req.body;
  const meetingDetails = text(req.body.meetingDetails, 2000);
  const date = new Date(scheduledAt);
  if (!objectId(id) || typeof scheduledAt !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(scheduledAt) || !Number.isFinite(date.getTime()) || !meetingDetails || !['Scheduled', 'Completed', 'Cancelled'].includes(status)) fail(400, 'Provide an interview date with timezone, meeting details and valid status');
  if (status === 'Scheduled' && date.getTime() <= Date.now()) fail(400, 'Schedule interviews in the future');
  const application = await JobApplication.findOneAndUpdate({ _id: id, companyId: req.company._id }, { $set: { interview: { scheduledAt: date, meetingDetails, status } } }, { returnDocument: 'after', runValidators: true });
  if (!application) fail(404, 'Application not found');
  const [user, job] = await Promise.all([User.findById(application.userId), Job.findById(application.jobId)]);
  const notification = user && job ? await notifyApplication(user, job, application.status, application.interview) : 'no_recipient';
  res.json({ success: true, message: 'Interview updated', application, notification });
};
export const applicantResume = async (req, res) => {
  if (!objectId(req.params.id)) fail(400, 'Invalid application ID');
  const application = await JobApplication.findOne({ _id: req.params.id, companyId: req.company._id });
  if (!application) fail(404, 'Application not found');
  const user = await User.findById(application.userId);
  const url = user && resumeUrl(user);
  if (!url) fail(404, 'Resume unavailable');
  res.json({ success: true, url });
};
