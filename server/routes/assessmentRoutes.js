import express from "express";
import { v4 as uuidv4 } from "uuid";
import Assessment from "../models/Assessment.js";
import Submission from "../models/Submission.js";
import Candidate from "../models/Candidate.js";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// GET /api/assessments — list all
router.get("/", async (req, res) => {
  try {
    const assessments = await Assessment.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ assessments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/assessments/:id — single assessment with submissions
router.get("/:id", async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, owner: req.user._id });
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    const submissions = await Submission.find({ assessment: assessment._id })
      .populate("candidate", "name role email score stage")
      .sort({ createdAt: -1 });

    res.json({ assessment, submissions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assessments — create
router.post("/", async (req, res) => {
  try {
    const { title, description, language, difficulty, timeLimit, problems } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const assessment = await Assessment.create({
      title,
      description,
      language,
      difficulty,
      timeLimit,
      problems: problems || [],
      owner: req.user._id,
    });

    res.status(201).json({ assessment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/assessments/:id — update
router.put("/:id", async (req, res) => {
  try {
    const assessment = await Assessment.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });
    res.json({ assessment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/assessments/:id
router.delete("/:id", async (req, res) => {
  try {
    const assessment = await Assessment.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });
    // Clean up submissions
    await Submission.deleteMany({ assessment: assessment._id });
    res.json({ message: "Assessment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assessments/:id/send — generate unique link for a candidate
router.post("/:id/send", async (req, res) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) return res.status(400).json({ message: "Candidate ID is required" });

    const assessment = await Assessment.findOne({ _id: req.params.id, owner: req.user._id });
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    const candidate = await Candidate.findOne({ _id: candidateId, owner: req.user._id });
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    // Check for existing pending submission
    const existing = await Submission.findOne({
      assessment: assessment._id,
      candidate: candidate._id,
      status: { $in: ["pending", "in_progress"] },
    });
    if (existing) {
      const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/assess/${existing.token}`;
      return res.json({ submission: existing, link, existing: true });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const submission = await Submission.create({
      assessment: assessment._id,
      candidate: candidate._id,
      owner: req.user._id,
      token,
      expiresAt,
    });

    const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/assess/${token}`;

    // Notification
    Notification.create({
      user: req.user._id,
      type: "new_candidate",
      message: `Assessment "${assessment.title}" sent to ${candidate.name}`,
      meta: { candidateId: candidate._id, candidateName: candidate.name },
    }).catch(() => {});

    res.status(201).json({ submission, link, existing: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/assessments/:id/submissions — list submissions
router.get("/:id/submissions", async (req, res) => {
  try {
    const submissions = await Submission.find({
      assessment: req.params.id,
      owner: req.user._id,
    })
      .populate("candidate", "name role email score stage")
      .sort({ createdAt: -1 });

    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
