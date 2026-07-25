const mongoose = require("mongoose");
const { INTERVALS, normalizeInterval } = require("../lib/periods");

const goalSchema = new mongoose.Schema(
  {
    task: { type: String, required: true, trim: true },
    interval: {
      type: String,
      required: true,
      enum: INTERVALS,
      default: "daily",
      set: normalizeInterval,
    },
    defaultTarget: { type: Number, required: true, min: 0 },
    // "target": hitting the number is the whole job, overshoot is not an
    // achievement (take medication). "more": beyond the target keeps counting and
    // earns laps (push-ups). Drives how the ring renders past 100%.
    trackingMode: { type: String, enum: ["target", "more"], default: "target" },
    category: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hidden: { type: Boolean, default: false },
    // Optional presentation hints, used by the client to colour the rings.
    color: { type: String, default: null },
    icon: { type: String, default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// The log view always loads one account's goals in display order.
goalSchema.index({ accountId: 1, order: 1 });

// `history` used to live here as an embedded array. It moved to the GoalHistory
// collection; strict mode already drops it on write, and reads ignore it.
goalSchema.set("strict", true);

module.exports = mongoose.model("Goal", goalSchema);
