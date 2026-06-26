import mongoose from "mongoose";

const testResultSchema = new mongoose.Schema({
  passed: { type: Boolean, default: false },
  input: { type: String, default: "" },
  expected: { type: String, default: "" },
  actual: { type: String, default: "" },
  error: { type: String, default: "" },
}, { _id: false });

const submissionSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "submitted", "evaluated"],
      default: "pending",
    },
    startedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    code: { type: String, default: "" },
    testResults: [testResultSchema],
    aiEvaluation: {
      correctness: { type: Number, default: 0 },
      codeQuality: { type: Number, default: 0 },
      efficiency: { type: Number, default: 0 },
      originality: { type: Number, default: 0 },
      overallScore: { type: Number, default: 0 },
      feedback: { type: String, default: "" },
      rawResponse: { type: String, default: "" },
    },
    antiCheat: {
      tabSwitches: { type: Number, default: 0 },
      pasteEvents: { type: Number, default: 0 },
      copyEvents: { type: Number, default: 0 },
      idleTime: { type: Number, default: 0 },
      typingSpeed: { type: Number, default: 0 },
      suspiciousPatterns: [{ type: String }],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema);
