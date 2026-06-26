import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["stage_change", "new_candidate", "note_added"],
      required: true,
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    meta: {
      candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
      candidateName: String,
      stage: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
