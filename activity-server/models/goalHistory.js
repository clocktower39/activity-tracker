const mongoose = require("mongoose");

const goalHistorySchema = new mongoose.Schema(
  {
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal", required: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    interval: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly", "yearly", "none"],
    },
    periodStart: { type: Date, required: true },
    targetPerDuration: { type: Number, required: true },
    achieved: { type: Number, required: true },
    note: { type: String, required: false },
  },
  { timestamps: true }
);

goalHistorySchema.index({ goalId: 1, interval: 1, periodStart: 1 }, { unique: true });
goalHistorySchema.index({ accountId: 1, periodStart: 1 });

const GoalHistory = mongoose.model("GoalHistory", goalHistorySchema);
module.exports = GoalHistory;
