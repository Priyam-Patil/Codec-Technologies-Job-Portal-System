// registerCompany              → recruiter/company signup
// loginCompany                 → recruiter/company login
// getCompanyData               → get company profile data
// postJob                      → add new job
// getCompanyJobApplicants      → view applicants
// getCompanyPostedJobs         → view posted jobs
// ChangeJobApplicationsStatus  → accept/reject applicant
// changeVisibility             → show/hide job

import Company from "../models/Company.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";

// Register a new company
export const registerCompany = async (req, res) => {
  const { name, email, password } = req.body;
  const imageFile = req.file;

  if (!name || !email || !password || !imageFile) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const companyExists = await Company.findOne({ email });

    if (companyExists) {
      return res.status(400).json({
        success: false,
        message: "Company already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const imageUpload = await cloudinary.uploader.upload(imageFile.path);

    const company = await Company.create({
      name,
      email,
      password: hashPassword,
      image: imageUpload.secure_url,
    });

    res.json({
      success: true,
      message: "Company registered successfully",
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
      },
      token: generateToken(company._id),
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Company login
export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  try {
    const company = await Company.findOne({ email });

    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, company.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
      },
      token: generateToken(company._id),
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get Company data
export const getCompanyData = async (req, res) => {
  try {
    const company = req.company;

    res.json({
      success: true,
      company,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Post a new job
export const postJob = async (req, res) => {
  try {
    const { title, description, location, salary, level, category } = req.body;

    const companyId = req.company._id;

    if (!title || !description || !location || !salary || !level || !category) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }

    const newJob = new Job({
      title,
      description,
      location,
      salary,
      companyId,
      date: Date.now(),
      level,
      category,
    });

    await newJob.save();

    res.json({
      success: true,
      message: "Job posted successfully",
      job: newJob,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get Company job applicants
export const getCompanyJobApplicants = async (req, res) => {
  try {
    const companyId = req.company._id;

    // Find job applications for this company and populate related data
    const applications = await JobApplication.find({ companyId })
      .populate("userId", "name email image resume")
      .populate("jobId", "title location category level salary")
      .sort({ date: -1 })
      .exec();

    return res.json({
      success: true,
      applications,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get Company posted jobs
export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company._id;

    const jobs = await Job.find({ companyId });

    const jobsData = await Promise.all(
      jobs.map(async (job) => {
        const applicants = await JobApplication.find({ jobId: job._id });

        return {
          ...job.toObject(),
          applicants: applicants.length,
        };
      })
    );

    res.json({
      success: true,
      jobsData,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Change job application status
export const ChangeJobApplicationsStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    const companyId = req.company._id;

    if (!id || !status) {
      return res.json({
        success: false,
        message: "Application id and status are required",
      });
    }

    const application = await JobApplication.findOne({
      _id: id,
      companyId,
    });

    if (!application) {
      return res.json({
        success: false,
        message: "Application not found",
      });
    }

    application.status = status;
    await application.save();

    return res.json({
      success: true,
      message: `Application ${status}`,
      application,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Change job visibility
export const changeVisibility = async (req, res) => {
  try {
    const { id } = req.body;

    console.log("Received job id:", id);

    if (!id) {
      return res.json({
        success: false,
        message: "Job id is required",
      });
    }

    const companyId = req.company._id;

    const job = await Job.findOne({
      _id: id,
      companyId: companyId,
    });

    if (!job) {
      return res.json({
        success: false,
        message: "Job not found",
      });
    }

    job.visible = !job.visible;

    await job.save();

    res.json({
      success: true,
      message: "Job visibility changed successfully",
      job,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
};