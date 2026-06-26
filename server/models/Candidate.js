import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, trim: true, default: "" },
    stack: [{ type: String }],
    score: { type: Number, min: 0, max: 100, default: 0 },
    stage: {
      type: String,
      enum: ["screen", "assess", "interview", "offer", "hired", "rejected"],
      default: "screen",
    },
    tags: [{ type: String, trim: true }],
    resume: {
      filename: { type: String, default: "" },
      originalName: { type: String, default: "" },
      mimetype: { type: String, default: "" },
      size: { type: Number, default: 0 },
    },
    interviewDate: { type: Date, default: null },
    interviewNotes: { type: String, default: "" },
    flags: {
      pasteEvents: { type: Number, default: 0 },
      editPattern: { type: String, enum: ["organic", "suspicious"], default: "organic" },
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Candidate", candidateSchema);
