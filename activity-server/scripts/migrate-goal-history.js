const mongoose = require("mongoose");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const Goal = require("../models/goal");
const GoalHistory = require("../models/goalHistory");

dayjs.extend(utc);

const INTERVALS = new Set(["daily", "weekly", "monthly", "yearly", "none"]);

const normalizeInterval = (value) => {
  if (!value) return "daily";
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "no schedule" || normalized === "unscheduled" || normalized === "nonscheduled") {
    return "none";
  }
  return INTERVALS.has(normalized) ? normalized : "daily";
};

const getPeriodStart = (interval, date) => {
  const normalized = normalizeInterval(interval);
  const base = dayjs.utc(date);
  switch (normalized) {
    case "weekly":
      return base.startOf("week");
    case "monthly":
      return base.startOf("month");
    case "yearly":
      return base.startOf("year");
    case "none":
    case "daily":
    default:
      return base.startOf("day");
  }
};

const flushBulk = async (model, ops) => {
  if (!ops.length) return;
  await model.bulkWrite(ops, { ordered: false });
  ops.length = 0;
};

const run = async () => {
  require("dotenv").config();
  const dbUrl = process.env.DBURL;
  if (!dbUrl) {
    throw new Error("DBURL is not set in environment");
  }

  await mongoose.connect(dbUrl);
  console.log("Connected to MongoDB");

  const goals = await Goal.find({}).lean();
  const historyOps = [];
  const goalOps = [];

  for (const goal of goals) {
    const interval = normalizeInterval(goal.interval);

    if (interval !== goal.interval) {
      goalOps.push({
        updateOne: {
          filter: { _id: goal._id },
          update: { $set: { interval } },
        },
      });
    }

    const historyItems = Array.isArray(goal.history) ? goal.history : [];
    historyItems.forEach((item) => {
      if (!item?.date) return;
      const periodStart = getPeriodStart(interval, item.date).toDate();
      historyOps.push({
        updateOne: {
          filter: { goalId: goal._id, interval, periodStart },
          update: {
            $setOnInsert: {
              accountId: goal.accountId,
              targetPerDuration: Number(item.targetPerDuration ?? goal.defaultTarget) || 0,
              achieved: Number(item.achieved) || 0,
              note: item.note,
            },
          },
          upsert: true,
        },
      });
    });

    if (historyOps.length >= 1000) {
      await flushBulk(GoalHistory, historyOps);
    }
    if (goalOps.length >= 1000) {
      await flushBulk(Goal, goalOps);
    }
  }

  await flushBulk(GoalHistory, historyOps);
  await flushBulk(Goal, goalOps);

  await Goal.updateMany({ history: { $exists: true } }, { $unset: { history: "" } });

  await mongoose.disconnect();
  console.log("Migration complete");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
