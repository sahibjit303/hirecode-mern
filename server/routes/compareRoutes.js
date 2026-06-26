import express from "express";
import Candidate from "../models/Candidate.js";
import Submission from "../models/Submission.js";
import { protect } from "../middleware/authMiddleware.js";
import { compareCandidates } from "../utils/gemini.js";

const router = express.Router();
router.use(protect);

// POST /api/compare — compare selected candidates
router.post("/", async (req, res) => {
  try {
    const { candidateIds } = req.body;
    if (!candidateIds || candidateIds.length < 2) {
      return res.status(400).json({ message: "Select at least 2 candidates" });
    }

    const candidates = await Candidate.find({
      _id: { $in: candidateIds },
      owner: req.user._id,
    });

    if (candidates.length < 2) {
      return res.status(400).json({ message: "Not enough candidates found" });
    }

    // Get submissions for these candidates
    const submissions = await Submission.find({
      candidate: { $in: candidateIds },
      owner: req.user._id,
      status: "evaluated",
    })
      .populate("assessment", "title language difficulty")
      .sort({ createdAt: -1 });

    // Group submissions by candidate
    const submissionMap = {};
    submissions.forEach((s) => {
      const cid = s.candidate.toString();
      if (!submissionMap[cid]) submissionMap[cid] = [];
      submissionMap[cid].push(s);
    });

    // AI comparison
    const aiSummary = await compareCandidates(candidates);

    res.json({
      candidates: candidates.map((c) => ({
        ...c.toObject(),
        submissions: submissionMap[c._id.toString()] || [],
      })),
      aiSummary,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
