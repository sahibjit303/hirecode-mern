import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    founderName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    company: { type: String, required: true, trim: true },
    ycBatch: { type: String, default: "" },
    teamSize: { type: Number, default: 1 },
    stack: { type: String, default: "" },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "reviewing", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);
