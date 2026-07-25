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
  },
  { timestamps: true, minimize: false }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, saltWorkFactor);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) {
    throw new Error("comparePassword called on a user loaded without the password field");
  }
  return bcrypt.compare(candidate, this.password);
};

/** The only shape of a user that may leave the server. */
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
