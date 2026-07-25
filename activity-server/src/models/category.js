const mongoose = require("mongoose");

/**
 * One document per account holding that account's ordered category list.
 *
 * The old schema declared this field as `account` while every document on disk
 * and every query used `accountId` — the schema was simply wrong. No migration
 * is needed, only this correction.
 */
const categorySchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    categories: {
      type: [
        {
          _id: false,
          category: { type: String, required: true, trim: true },
          order: { type: Number, required: true, default: 0 },
          color: { type: String, default: null },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
