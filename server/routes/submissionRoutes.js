import express from "express";
import Submission from "../models/Submission.js";
import Assessment from "../models/Assessment.js";
import Candidate from "../models/Candidate.js";
import Notification from "../models/Notification.js";
import AutomationRule from "../models/AutomationRule.js";
import { protect } from "../middleware/authMiddleware.js";
import { evaluateCode } from "../utils/gemini.js";
import { sendEmail, interviewScheduledEmail } from "../utils/email.js";

const router = express.Router();

/* ═══════════════════════════════════════════════════
   PUBLIC ROUTES — Candidate accesses via token
   ═══════════════════════════════════════════════════ */

// GET /api/assess/:token — load assessment for candidate
router.get("/assess/:token", async (req, res) => {
  try {
    const submission = await Submission.findOne({ token: req.params.token })
      .populate("candidate", "name email")
      .populate("assessment");

    if (!submission) {
      return res.status(404).json({ message: "Assessment not found or link is invalid" });
    }
    if (submission.status === "submitted" || submission.status === "evaluated") {
      return res.status(400).json({ message: "This assessment has already been submitted", submitted: true });
    }
    if (new Date() > submission.expiresAt) {
      return res.status(400).json({ message: "This assessment link has expired", expired: true });
    }

    // Return assessment data (hide hidden test case outputs)
    const assessment = submission.assessment.toObject();
    assessment.problems = assessment.problems.map((p) => ({
      ...p,
      testCases: p.testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.isHidden ? "[hidden]" : tc.expectedOutput,
        isHidden: tc.isHidden,
        _id: tc._id,
      })),
    }));

    res.json({
      assessment,
      candidate: submission.candidate,
      status: submission.status,
      startedAt: submission.startedAt,
      expiresAt: submission.expiresAt,
      timeLimit: submission.assessment.timeLimit,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assess/:token/start — mark as started
router.post("/assess/:token/start", async (req, res) => {
  try {
    const submission = await Submission.findOne({ token: req.params.token });
    if (!submission) return res.status(404).json({ message: "Not found" });
    if (submission.status !== "pending" && submission.status !== "in_progress") {
      return res.status(400).json({ message: "Cannot start — already submitted" });
    }

    if (submission.status === "pending") {
      submission.status = "in_progress";
      submission.startedAt = new Date();
      await submission.save();
    }

    res.json({ startedAt: submission.startedAt, status: submission.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assess/:token/submit — submit code + anti-cheat data
router.post("/assess/:token/submit", async (req, res) => {
  try {
    const { code, testResults, antiCheat } = req.body;

    const submission = await Submission.findOne({ token: req.params.token })
      .populate("assessment")
      .populate("candidate");

    if (!submission) return res.status(404).json({ message: "Not found" });
    if (submission.status === "submitted" || submission.status === "evaluated") {
      return res.status(400).json({ message: "Already submitted" });
    }

    submission.status = "submitted";
    submission.submittedAt = new Date();
    submission.code = code || "";
    submission.testResults = testResults || [];
    submission.antiCheat = antiCheat || {};
    await submission.save();

    // Run AI evaluation in background
    (async () => {
      try {
        const problem = submission.assessment.problems[0]; // evaluate first problem
        if (!problem) return;

        const aiResult = await evaluateCode({
          code: submission.code,
          problemTitle: problem.title,
          problemDescription: problem.description,
          language: submission.assessment.language,
          testResults: submission.testResults,
          antiCheat: submission.antiCheat,
        });

        submission.aiEvaluation = aiResult;
        submission.status = "evaluated";
        await submission.save();

        // Update candidate score
        if (aiResult.overallScore > 0) {
          await Candidate.findByIdAndUpdate(submission.candidate._id, {
            score: aiResult.overallScore,
            "flags.pasteEvents": submission.antiCheat.pasteEvents || 0,
            "flags.editPattern":
              (submission.antiCheat.pasteEvents || 0) > 5 ? "suspicious" : "organic",
          });
        }

        // Update assessment stats
        const allSubs = await Submission.find({
          assessment: submission.assessment._id,
          status: "evaluated",
        });
        const avg = Math.round(
          allSubs.reduce((s, sub) => s + (sub.aiEvaluation?.overallScore || 0), 0) /
            (allSubs.length || 1)
        );
        await Assessment.findByIdAndUpdate(submission.assessment._id, {
          submissionCount: allSubs.length,
          avgScore: avg,
        });

        // Create notification
        await Notification.create({
          user: submission.owner,
          type: "stage_change",
          message: `${submission.candidate.name} completed assessment "${submission.assessment.title}" — scored ${aiResult.overallScore}/100`,
          meta: {
            candidateId: submission.candidate._id,
            candidateName: submission.candidate.name,
            stage: "assess",
          },
        });

        // Run automation rules
        await runAutomations(submission.candidate._id, submission.owner, aiResult.overallScore);
      } catch (evalErr) {
        console.error("Background evaluation error:", evalErr.message);
      }
    })();

    res.json({ message: "Submitted successfully! AI evaluation in progress.", status: "submitted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════
   PROTECTED ROUTES — Recruiter views submissions
   ═══════════════════════════════════════════════════ */

// GET /api/submissions/:id — view detailed submission
router.get("/submissions/:id", protect, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      owner: req.user._id,
    })
      .populate("assessment")
      .populate("candidate", "name role email score stage stack tags");

    if (!submission) return res.status(404).json({ message: "Submission not found" });
    res.json({ submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/submissions — list all submissions for the user
router.get("/submissions", protect, async (req, res) => {
  try {
    const submissions = await Submission.find({ owner: req.user._id })
      .populate("assessment", "title language difficulty")
      .populate("candidate", "name role email score stage")
      .sort({ createdAt: -1 });
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ═══════════════════════════════════════════════════
   AUTOMATION ENGINE
   ═══════════════════════════════════════════════════ */
async function runAutomations(candidateId, ownerId, score) {
  try {
    const rules = await AutomationRule.find({ owner: ownerId, enabled: true });
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return;

    for (const rule of rules) {
      let shouldFire = false;

      if (rule.trigger === "assessment_completed") {
        shouldFire = true;
      }

      if (rule.trigger === "score_above" || rule.trigger === "score_below") {
        const val = score ?? candidate.score;
        const threshold = Number(rule.condition.value);
        const op = rule.condition.operator;
        if (op === "gt") shouldFire = val > threshold;
        else if (op === "gte") shouldFire = val >= threshold;
        else if (op === "lt") shouldFire = val < threshold;
        else if (op === "lte") shouldFire = val <= threshold;
        else if (op === "eq") shouldFire = val === threshold;
      }

      if (!shouldFire) continue;

      // Execute action
      if (rule.action.type === "move_stage" && rule.action.params?.stage) {
        candidate.stage = rule.action.params.stage;
        await candidate.save();

        await Notification.create({
          user: ownerId,
          type: "stage_change",
          message: `Automation "${rule.name}": ${candidate.name} moved to ${rule.action.params.stage}`,
          meta: { candidateId: candidate._id, candidateName: candidate.name, stage: rule.action.params.stage },
        });
      }

      if (rule.action.type === "add_tag" && rule.action.params?.tag) {
        if (!candidate.tags.includes(rule.action.params.tag)) {
          candidate.tags.push(rule.action.params.tag);
          await candidate.save();
        }
      }

      rule.executionCount += 1;
      await rule.save();
    }
  } catch (err) {
    console.error("Automation error:", err.message);
  }
}

export default router;
