import "./config/instrument.js";
import express from "express";
import cors from "cors";
import "dotenv/config";
import dns from "dns";
import * as Sentry from "@sentry/node";

import connectDB from "./config/db.js";
import clerkWebhooks from "./controllers/webhooks.js";
import companyRoutes from "./routes/companyRoutes.js";
import connectCloudinary from "./config/cloudinary.js";
import jobRoutes from "./routes/jobRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import {clerkMiddleware} from '@clerk/express'


// Initialize express
const app = express();

// DNS fix
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Connect to database
await connectDB();

// Connect Cloudinary
connectCloudinary();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware())


// Routes
app.get("/", (req, res) => {
  res.send("API Working");
});

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

app.post("/webhooks", clerkWebhooks);




app.use("/api/company", companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use("/api/users", userRoutes);




// Sentry error handler should be after routes
Sentry.setupExpressErrorHandler(app);

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});