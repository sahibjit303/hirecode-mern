import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import automationRoutes from "./routes/automationRoutes.js";
import compareRoutes from "./routes/compareRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Security headers — relax crossOriginResourcePolicy for API use
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Allowed origins: localhost dev + any deployed client URL from env
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.CLIENT_URL,           // e.g. https://hirecode-mern.vercel.app
  process.env.CLIENT_URL_PREVIEW,   // optional: Vercel preview URLs
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, mobile apps)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      // Allow any *.vercel.app subdomain (preview deployments)
      if (/\.vercel\.app$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "200kb" }));


// Serve uploaded files (resumes etc.)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limiting for auth routes (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CodeHire API is running" });
});

// Auth routes
app.use("/api/auth", authLimiter, authRoutes);

// Protected routes
app.use("/api/applications", applicationRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/candidates", noteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/automations", automationRoutes);
app.use("/api/compare", compareRoutes);
app.use("/api/ai", aiRoutes);

// Submission routes (contains both public and protected endpoints)
app.use("/api", submissionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CodeHire API running on port ${PORT}`));
