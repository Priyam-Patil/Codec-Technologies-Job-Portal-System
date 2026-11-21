import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  resume: { type: String },
  resumeAsset: { publicId: String, originalName: String, uploadedAt: Date, processingStatus: String },
  resumeAnalysis: { skills: [String], experienceYears: Number, suggestions: [String] },
  skills: { type: [String], default: [] },
  education: { type: String, default: '' },
  experience: { type: String, default: '' },
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  image: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

export default User;
