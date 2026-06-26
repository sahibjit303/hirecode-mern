import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { body, validationResult } from "express-validator";
import Candidate from "../models/Candidate.js";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../utils/upload.js";
import {
  sendEmail,
  interviewScheduledEmail,
  stageChangeEmail,
} from "../utils/email.js";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// All candidate routes require login
router.use(protect);

// GET /api/candidates — supports pagination, search, sort, filter
router.get("/", async (req, res) => {
  try {
    const {
      page,
      limit = 20,
      sort = "score",
      order = "desc",
      stage,
      search,
    } = req.query;

    const query = { owner: req.user._id };

    // Stage filter
    if (stage && stage !== "all") {
      query.stage = stage;
    }

    // Search filter (name or role)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    // If no page param, return all (backward compatible)
    if (!page) {
      const candidates = await Candidate.find(query).sort({
        [sort]: order === "asc" ? 1 : -1,
      });
      return res.json({ candidates });
    }

    // Paginated response
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [candidates, total] = await Promise.all([
      Candidate.find(query)
        .sort({ [sort]: order === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limitNum),
      Candidate.countDocuments(query),
    ]);

    res.json({
      candidates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/candidates/:id — single candidate
router.get("/:id", async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });
    res.json({ candidate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/candidates
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("role").trim().notEmpty().withMessage("Role is required"),
    body("score")
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage("Score must be 0–100"),
    body("stage")
      .optional()
      .isIn(["screen", "assess", "interview", "offer", "hired", "rejected"])
      .withMessage("Invalid stage"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
      const { name, role, email, stack, score, stage, tags } = req.body;
      const candidate = await Candidate.create({
        name,
        role,
        email,
        stack,
        score,
        stage,
        tags,
        owner: req.user._id,
      });

      // Create notification
      Notification.create({
        user: req.user._id,
        type: "new_candidate",
        message: `${name} was added to the pipeline`,
        meta: {
          candidateId: candidate._id,
          candidateName: name,
          stage: stage || "screen",
        },
      }).catch(() => {});

      res.status(201).json({ candidate });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/candidates/:id — edit candidate
router.put("/:id", async (req, res) => {
  try {
    // Get old candidate to check for stage change
    const oldCandidate = await Candidate.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!oldCandidate)
      return res.status(404).json({ message: "Candidate not found" });

    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    // Create notification on stage change
    if (req.body.stage && req.body.stage !== oldCandidate.stage) {
      Notification.create({
        user: req.user._id,
        type: "stage_change",
        message: `${candidate.name} moved from ${oldCandidate.stage} to ${req.body.stage}`,
        meta: {
          candidateId: candidate._id,
          candidateName: candidate.name,
          stage: req.body.stage,
        },
      }).catch(() => {});

      // Send stage change email if candidate has an email address
      if (candidate.email) {
        const owner = await User.findById(req.user._id);
        const emailData = stageChangeEmail({
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          newStage: req.body.stage,
          company: owner?.company || "",
        });
        sendEmail(emailData).catch(() => {});
      }
    }

    res.json({ candidate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/candidates/:id/schedule-interview — schedule + email
router.post("/:id/schedule-interview", async (req, res) => {
  try {
    const { interviewDate, interviewNotes } = req.body;
    if (!interviewDate) {
      return res.status(400).json({ message: "Interview date is required" });
    }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        interviewDate: new Date(interviewDate),
        interviewNotes: interviewNotes || "",
        stage: "interview",
      },
      { new: true, runValidators: true }
    );

    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    // Create notification
    Notification.create({
      user: req.user._id,
      type: "stage_change",
      message: `Interview scheduled with ${candidate.name} on ${new Date(interviewDate).toLocaleDateString()}`,
      meta: {
        candidateId: candidate._id,
        candidateName: candidate.name,
        stage: "interview",
      },
    }).catch(() => {});

    // Send interview email if candidate has an email
    if (candidate.email) {
      const owner = await User.findById(req.user._id);
      const emailData = interviewScheduledEmail({
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        date: interviewDate,
        notes: interviewNotes,
        company: owner?.company || "",
      });
      const result = await sendEmail(emailData);
      return res.json({
        candidate,
        emailSent: true,
        previewUrl: result?.previewUrl || null,
      });
    }

    res.json({ candidate, emailSent: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/candidates/:id/resume — upload resume
router.post("/:id/resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Remove old resume file if exists
    const oldCandidate = await Candidate.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!oldCandidate)
      return res.status(404).json({ message: "Candidate not found" });

    if (oldCandidate.resume?.filename) {
      const oldPath = path.join(__dirname, "..", "uploads", oldCandidate.resume.filename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        resume: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      },
      { new: true }
    );

    res.json({ candidate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/candidates/:id/resume — download resume
router.get("/:id/resume", async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!candidate || !candidate.resume?.filename) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const filePath = path.join(__dirname, "..", "uploads", candidate.resume.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Resume file not found on disk" });
    }

    res.download(filePath, candidate.resume.originalName);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/candidates/:id/resume — remove resume
router.delete("/:id/resume", async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    if (candidate.resume?.filename) {
      const filePath = path.join(__dirname, "..", "uploads", candidate.resume.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    candidate.resume = { filename: "", originalName: "", mimetype: "", size: 0 };
    await candidate.save();

    res.json({ candidate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/candidates/:id — delete candidate + cleanup files
router.delete("/:id", async (req, res) => {
  try {
    const candidate = await Candidate.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    // Clean up resume file
    if (candidate.resume?.filename) {
      const filePath = path.join(__dirname, "..", "uploads", candidate.resume.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ message: "Candidate removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
