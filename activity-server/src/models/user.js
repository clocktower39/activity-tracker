const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { saltWorkFactor } = require("../config/env");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    // select: false keeps the hash out of every query result by default, so it
    // can never be accidentally serialised into a response or a JWT payload.
    password: { type: String, required: true, select: false },
    themeMode: { type: String, enum: ["light", "dark", "system"], default: "dark" },
    // First day of the week, 0 = Sunday … 6 = Saturday. Decides where weekly
    // goals bucket, so changing it re-buckets existing weekly history.
    weekStart: { type: Number, min: 0, max: 6, default: 0 },
    // Replaces the old hard-coded DEMO@FAKEACCOUNT.COM string comparison.
    isDemo: { type: Boolean, default: false },
    // Bumped whenever credentials change; refresh tokens carrying an older value
    // are rejected, which logs out every other session on password change.
    tokenVersion: { type: Number, default: 0 },
    // Secret in the private calendar-feed URL (GET /api/calendar/:token.ics).
    // Absent until the user creates a link; unset to turn the feed off. No
    // default on purpose: a sparse unique index skips missing fields, not nulls.
    calendarToken: { type: String, select: false },
  },
  { timestamps: true, minimize: false }
);

// Mongoose 9 no longer passes `next` to async middleware: the returned promise
// is the signal, and a throw is the error. Calling next() here threw on every
// save, which broke sign-up and password changes alike.
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, saltWorkFactor);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) {
    throw new Error("comparePassword called on a user loaded without the password field");
  }
  return bcrypt.compare(candidate, this.password);
};

/** The only shape of a user that may leave the server. */
userSchema.index({ calendarToken: 1 }, { unique: true, sparse: true });

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    _id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    themeMode: this.themeMode,
    weekStart: this.weekStart ?? 0,
    isDemo: this.isDemo,
  };
};

module.exports = mongoose.model("User", userSchema);
