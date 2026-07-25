const mongoose = require("mongoose");
const { INTERVALS } = require("../lib/periods");

/**
 * One row per (goal, interval, period) that actually has progress.
 *
 * Rows are created lazily — only when a user records something. A missing row
 * means "no progress", not "not loaded". Nothing on a read path may create a
 * row here; the previous implementation upserted a placeholder for every goal
 * on every page view and grew 27k empty documents doing it.
 */
const goalHistorySchema = new mongoose.Schema(
  {
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal", required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    interval: { type: String, required: true, enum: INTERVALS },
    // UTC start of the period. See src/lib/periods.js.
    periodStart: { type: Date, required: true },
    targetPerDuration: { type: Number, required: true, min: 0 },
    achieved: { type: Number, required: true, default: 0, min: 0 },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

// Idempotency key: every write upserts against this.
goalHistorySchema.index({ goalId: 1, interval: 1, periodStart: 1 }, { unique: true });
// Window queries: "everything for this account between two dates".
goalHistorySchema.index({ accountId: 1, periodStart: 1 });
// Per-goal detail and chart queries.
goalHistorySchema.index({ accountId: 1, goalId: 1, periodStart: 1 });

module.exports = mongoose.model("GoalHistory", goalHistorySchema);
