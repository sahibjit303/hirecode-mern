import express from "express";
import { body, validationResult } from "express-validator";
import Application from "../models/Application.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/applications - public, submit a beta application
router.post(
  "/",
  [
    body("founderName").trim().notEmpty().withMessage("Founder name is required"),
    body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
    body("company").trim().notEmpty().withMessage("Company name is required"),
    body("teamSize")
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage("Team size must be a positive number"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
      const { founderName, email, company, ycBatch, teamSize, stack, message } = req.body;
      const application = await Application.create({
        founderName,
        email,
        company,
        ycBatch,
        teamSize,
        stack,
        message,
      });
      res.status(201).json({ application });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/applications - protected + admin only
router.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const applications = await Application.find().sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/applications/:id - protected + admin only
router.patch("/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!application) return res.status(404).json({ message: "Application not found" });
    res.json({ application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
