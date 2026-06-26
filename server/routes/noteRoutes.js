import express from "express";
import { body, validationResult } from "express-validator";
import Note from "../models/Note.js";
import Candidate from "../models/Candidate.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All note routes require login
router.use(protect);

// GET /api/candidates/:id/notes — get notes for a candidate (own candidates only)
router.get("/:id/notes", async (req, res) => {
  try {
    // Verify ownership
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!candidate)
      return res.status(404).json({ message: "Candidate not found" });

    const notes = await Note.find({ candidate: req.params.id })
      .sort({ createdAt: -1 })
      .populate("author", "name");

    res.json({ notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/candidates/:id/notes — add a note
router.post(
  "/:id/notes",
  [body("text").trim().notEmpty().withMessage("Note text is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
      // Verify ownership
      const candidate = await Candidate.findOne({
        _id: req.params.id,
        owner: req.user._id,
      });
      if (!candidate)
        return res.status(404).json({ message: "Candidate not found" });

      const note = await Note.create({
        candidate: req.params.id,
        author: req.user._id,
        text: req.body.text,
      });

      // Populate author for the response
      await note.populate("author", "name");

      res.status(201).json({ note });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE /api/candidates/:candidateId/notes/:noteId — delete own note
router.delete("/:candidateId/notes/:noteId", async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.noteId,
      author: req.user._id,
    });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
