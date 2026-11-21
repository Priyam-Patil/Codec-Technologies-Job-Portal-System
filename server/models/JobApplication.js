import mongoose from "mongoose";

const JobApplicationsSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: "User",
    required: true,
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },

  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },

  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: "Pending",
  },
  interview: {
    scheduledAt: Date,
    meetingDetails: String,
    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'] },
  },

  date: {
    type: Number,
    required: true,
  },
});

// Applied explicitly against a reviewed database; automatic production index creation is disabled.
JobApplicationsSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const JobApplication = mongoose.model(
  "JobApplication",
  JobApplicationsSchema
);

export default JobApplication;
