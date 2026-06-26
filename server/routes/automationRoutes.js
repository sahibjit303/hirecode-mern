import express from "express";
import AutomationRule from "../models/AutomationRule.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// GET /api/automations
router.get("/", async (req, res) => {
  try {
    const rules = await AutomationRule.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ rules });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/automations
router.post("/", async (req, res) => {
  try {
    const { name, trigger, condition, action } = req.body;
    if (!name || !trigger || !action?.type) {
      return res.status(400).json({ message: "Name, trigger, and action type are required" });
    }
    const rule = await AutomationRule.create({
      name,
      trigger,
      condition: condition || {},
      action,
      owner: req.user._id,
    });
    res.status(201).json({ rule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/automations/:id
router.put("/:id", async (req, res) => {
  try {
    const rule = await AutomationRule.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!rule) return res.status(404).json({ message: "Rule not found" });
    res.json({ rule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/automations/:id
router.delete("/:id", async (req, res) => {
  try {
    const rule = await AutomationRule.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!rule) return res.status(404).json({ message: "Rule not found" });
    res.json({ message: "Rule deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
