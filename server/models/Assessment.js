import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: "" },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
}, { _id: true });

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  starterCode: { type: String, default: "" },
  testCases: [testCaseSchema],
}, { _id: true });

const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    language: {
      type: String,
      enum: ["javascript", "python", "typescript"],
      default: "javascript",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    timeLimit: { type: Number, default: 45, min: 5, max: 180 }, // minutes
    problems: [problemSchema],
    isTemplate: { type: Boolean, default: false },
    submissionCount: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Assessment", assessmentSchema);
