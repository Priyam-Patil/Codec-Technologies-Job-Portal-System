import express from "express";
import {
  ChangeJobApplicationsStatus,
  changeVisibility,
  getCompanyData,
  getCompanyJobApplicants,
  getCompanyPostedJobs,
  loginCompany,
  postJob,
  registerCompany,
  editJob, analytics, scheduleInterview, applicantResume,
} from "../controllers/companyController.js";

import upload from "../middleware/multer.js";
import { protectCompany } from "../middleware/authMiddleware.js";
import { rateLimit } from '../middleware/security.js';

const router = express.Router();

// Register a company
router.post("/register", rateLimit({ limit: 10, windowMs: 15 * 60000 }), upload.single("image"), registerCompany);

// Company login
router.post("/login", rateLimit({ limit: 15, windowMs: 15 * 60000 }), loginCompany);
router.get('/analytics', protectCompany, analytics);
router.put('/jobs/:id', protectCompany, editJob);
router.put('/interviews/:id', protectCompany, scheduleInterview);
router.get('/applications/:id/resume', protectCompany, applicantResume);

// Get company data
router.get("/company",protectCompany, getCompanyData);

// Post a job
router.post("/post-job", protectCompany, postJob);

// Get company job applicants
router.get("/applicants",protectCompany, getCompanyJobApplicants);

// Get company posted jobs list
router.get("/list-jobs", protectCompany, getCompanyPostedJobs);

// Change job application status
router.put("/change-status", protectCompany, ChangeJobApplicationsStatus);

// Change job visibility
router.put("/change-visibility", protectCompany, changeVisibility);

export default router;
