import mongoose from "mongoose";

const automationRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    trigger: {
      type: String,
      enum: ["assessment_completed", "score_above", "score_below", "stage_change"],
      required: true,
    },
    condition: {
      field: { type: String, default: "score" },
      operator: { type: String, enum: ["gt", "lt", "eq", "gte", "lte"], default: "gt" },
      value: { type: mongoose.Schema.Types.Mixed, default: 0 },
    },
    action: {
      type: { type: String, enum: ["move_stage", "send_email", "add_tag"], required: true },
      params: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    enabled: { type: Boolean, default: true },
    executionCount: { type: Number, default: 0 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("AutomationRule", automationRuleSchema);
