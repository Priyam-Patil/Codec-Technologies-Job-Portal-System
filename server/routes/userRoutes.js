import express from "express";
import {
  getUserData,
  applyForJob,
  getUserJobApplications,
  updateUserResume,
  updateProfile, getSavedJobs, saveJob, removeSavedJob, recommendations, getResume,
} from "../controllers/userController.js";

import upload from "../middleware/multer.js";
import { protectUser } from '../middleware/authMiddleware.js';
import { rateLimit } from '../middleware/security.js';

const router = express.Router();
router.use(protectUser);
router.get('/recommendations', recommendations);
router.put('/profile', updateProfile);
router.get('/saved-jobs', getSavedJobs);
router.put('/saved-jobs/:id', saveJob);
router.delete('/saved-jobs/:id', removeSavedJob);
router.get('/resume', getResume);

// Get user data
router.get("/user", getUserData);

// Apply for a job
router.post("/apply", applyForJob);

// Get applied job data
router.get("/applications", getUserJobApplications);

// Update user profile resume
router.post("/update-resume", rateLimit({ limit: 5 }), upload.single("resume"), updateUserResume);

export default router;
