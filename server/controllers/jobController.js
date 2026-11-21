import Job from "../models/Job.js";
import { objectId, cleanHtml } from '../utils/validation.js';

// Get all jobs
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ visible: true }).populate({
      path: "companyId",
      select: "name image",
    });

    res.json({
      success: true,
      jobs: jobs.filter(job => job.companyId).map(job => ({ ...job.toObject(), description: cleanHtml(job.description) })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to load jobs',
    });
  }
};

// Get a single job by id
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!objectId(id)) return res.status(400).json({ success: false, message: 'Invalid job ID' });

    const job = await Job.findOne({ _id: id, visible: true }).populate({
      path: "companyId",
      select: "name image",
    });

    if (!job || !job.companyId) {
      return res.status(404).json({
        success: false,
        message: "Job not found!!",
      });
    }

    res.json({
      success: true,
      job: { ...job.toObject(), description: cleanHtml(job.description) },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to load job',
    });
  }
};
