import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { chatGenerateAssessment } from "../utils/gemini.js";

const router = express.Router();
router.use(protect);

/**
 * POST /api/ai/chat
 * Multi-turn chat for AI assessment generation.
 * Body: { messages: [{role, content}], currentAssessment }
 * Returns: { reply, assessment, ready }
 */
router.post("/chat", async (req, res) => {
  try {
    const { messages, currentAssessment } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "messages array is required" });
    }

    const result = await chatGenerateAssessment(messages, currentAssessment);
    res.json(result);
  } catch (err) {
    console.error("AI chat error:", err.message);
    res.status(500).json({ message: err.message || "AI generation failed" });
  }
});

export default router;
