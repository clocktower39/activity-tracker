const mongoose = require("mongoose");
const GoalHistory = require("../models/goalHistory");
const Goal = require("../models/goal");
const { ApiError, asyncHandler } = require("../lib/apiError");
const { getQueryRange, dayjs } = require("../lib/periods");

const BUCKETS = { day: "day", week: "week", month: "month", year: "year" };

const parseDate = (value, label) => {
  const parsed = dayjs.utc(value, "YYYY-MM-DD", true);
  if (!parsed.isValid()) throw new ApiError(400, `${label} must be a YYYY-MM-DD date`);
  return parsed;
};

/**
 * These endpoints aggregate in MongoDB, so the response size is set by how many
 * buckets a range produces, not by how long it is. A range is therefore bounded
 * by bucket count rather than by years — asking for a decade of monthly totals
 * is 120 rows and perfectly reasonable, while a decade of daily totals is not.
 */
const MAX_BUCKETS = 3000;

const BUCKET_DAYS = { day: 1, week: 7, month: 30.4, year: 365.25 };

const parseRange = (req) => {
  const { from, to } = req.query;
  if (!from || !to) throw new ApiError(400, "`from` and `to` query parameters are required");
  const fromDate = parseDate(from, "from");
  const toDate = parseDate(to, "to");
  if (toDate.isBefore(fromDate)) throw new ApiError(400, "`to` must not be before `from`");
  return { fromDate, toDate };
};

const assertBucketCount = (fromDate, toDate, bucket) => {
  const days = toDate.diff(fromDate, "day") + 1;
  const estimated = Math.ceil(days / BUCKET_DAYS[bucket]);
  if (estimated > MAX_BUCKETS) {
    throw new ApiError(
      400,
      `That range is ${estimated} ${bucket} buckets, over the ${MAX_BUCKETS} limit. Use a coarser bucket.`
    );
  }
};

/**
 * Totals per time bucket across every goal.
 *
 * Mongo does the rollup, so the week / month / year views transfer one row per
 * bucket instead of every underlying history document.
 */
const summary = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = parseRange(req);
  const bucket = BUCKETS[String(req.query.bucket || "day").toLowerCase()];
  if (!bucket) throw new ApiError(400, "`bucket` must be one of day, week, month, year");
  assertBucketCount(fromDate, toDate, bucket);

  const { start } = getQueryRange("yearly", fromDate, fromDate);
  const { end } = getQueryRange("daily", toDate, toDate);

  const rows = await GoalHistory.aggregate([
    {
      $match: {
        accountId: new mongoose.Types.ObjectId(res.locals.user._id),
        periodStart: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: { $dateTrunc: { date: "$periodStart", unit: bucket, startOfWeek: "monday" } },
        achieved: { $sum: "$achieved" },
        target: { $sum: "$targetPerDuration" },
        entries: { $sum: 1 },
        goalsCompleted: {
          $sum: {
            $cond: [{ $gte: ["$achieved", "$targetPerDuration"] }, 1, 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        periodStart: "$_id",
        achieved: 1,
        target: 1,
        entries: 1,
        goalsCompleted: 1,
      },
    },
  ]);

  res.json({ bucket, from: fromDate.format("YYYY-MM-DD"), to: toDate.format("YYYY-MM-DD"), buckets: rows });
});

/**
 * Per-goal totals per time bucket — a goal × period matrix.
 *
 * The Year view needs one number per goal per month. Fetching the underlying
 * daily rows would be ~7,300 documents for a 20-goal account; this returns 12
 * buckets per goal instead.
 */
const matrix = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = parseRange(req);
  const bucket = BUCKETS[String(req.query.bucket || "month").toLowerCase()];
  if (!bucket) throw new ApiError(400, "`bucket` must be one of day, week, month, year");
  // The matrix returns a row per goal per bucket, so it is bounded harder.
  assertBucketCount(fromDate, toDate, bucket === "day" ? "day" : bucket);

  const { start } = getQueryRange("yearly", fromDate, fromDate);
  const { end } = getQueryRange("daily", toDate, toDate);

  const rows = await GoalHistory.aggregate([
    {
      $match: {
        accountId: new mongoose.Types.ObjectId(res.locals.user._id),
        periodStart: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: {
          goalId: "$goalId",
          bucket: { $dateTrunc: { date: "$periodStart", unit: bucket, startOfWeek: "monday" } },
        },
        achieved: { $sum: "$achieved" },
        target: { $sum: "$targetPerDuration" },
        periodsRecorded: { $sum: 1 },
        periodsCompleted: {
          $sum: { $cond: [{ $gte: ["$achieved", "$targetPerDuration"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        goalId: "$_id.goalId",
        periodStart: "$_id.bucket",
        achieved: 1,
        target: 1,
        periodsRecorded: 1,
        periodsCompleted: 1,
      },
    },
    { $sort: { periodStart: 1 } },
  ]);

  res.json({
    bucket,
    from: fromDate.format("YYYY-MM-DD"),
    to: toDate.format("YYYY-MM-DD"),
    cells: rows,
  });
});

/** Per-goal totals over a range — powers the leaderboard-style breakdowns. */
const byGoal = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = parseRange(req);
  const accountId = new mongoose.Types.ObjectId(res.locals.user._id);

  const { start } = getQueryRange("yearly", fromDate, fromDate);
  const { end } = getQueryRange("daily", toDate, toDate);

  const [rows, goals] = await Promise.all([
    GoalHistory.aggregate([
      { $match: { accountId, periodStart: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: "$goalId",
          achieved: { $sum: "$achieved" },
          target: { $sum: "$targetPerDuration" },
          periodsRecorded: { $sum: 1 },
          periodsCompleted: {
            $sum: { $cond: [{ $gte: ["$achieved", "$targetPerDuration"] }, 1, 0] },
          },
          best: { $max: "$achieved" },
        },
      },
    ]),
    Goal.find({ accountId }).lean(),
  ]);

  const statsByGoal = new Map(rows.map((row) => [String(row._id), row]));

  res.json({
    from: fromDate.format("YYYY-MM-DD"),
    to: toDate.format("YYYY-MM-DD"),
    goals: goals.map((goal) => {
      const stat = statsByGoal.get(String(goal._id));
      return {
        goalId: goal._id,
        task: goal.task,
        category: goal.category,
        interval: goal.interval,
        hidden: !!goal.hidden,
        achieved: stat?.achieved ?? 0,
        target: stat?.target ?? 0,
        periodsRecorded: stat?.periodsRecorded ?? 0,
        periodsCompleted: stat?.periodsCompleted ?? 0,
        best: stat?.best ?? 0,
      };
    }),
  });
});

/**
 * Current and longest completion streaks per goal, counted in that goal's own
 * periods. Bounded to the trailing window so this never scans five years.
 */
const streaks = asyncHandler(async (req, res) => {
  const accountId = new mongoose.Types.ObjectId(res.locals.user._id);

  // `days=all` walks the whole record. The query is indexed and the projection
  // is four fields, and the response is one summary row per goal either way —
  // "longest streak ever" is not a meaningful number over a trailing window.
  const all = String(req.query.days).toLowerCase() === "all";
  const days = all ? null : Math.max(1, Number(req.query.days) || 365);
  const since = all ? null : dayjs.utc().subtract(days, "day").startOf("day").toDate();

  const [goals, rows] = await Promise.all([
    Goal.find({ accountId, archivedAt: null }).lean(),
    GoalHistory.find({ accountId, ...(since ? { periodStart: { $gte: since } } : {}) })
      .select("goalId interval periodStart achieved targetPerDuration")
      .sort({ periodStart: -1 })
      .lean(),
  ]);

  const completedByGoal = new Map();
  for (const row of rows) {
    if (row.achieved < row.targetPerDuration || row.targetPerDuration <= 0) continue;
    const key = String(row.goalId);
    if (!completedByGoal.has(key)) completedByGoal.set(key, []);
    completedByGoal.get(key).push(dayjs.utc(row.periodStart));
  }

  const unitFor = { weekly: "week", monthly: "month", yearly: "year" };

  const result = goals.map((goal) => {
    const unit = unitFor[goal.interval] || "day";
    // Newest first, so index 0 is the most recent completed period.
    const completed = completedByGoal.get(String(goal._id)) || [];

    let current = 0;
    let longest = 0;
    let run = 0;
    let previous = null;

    completed.forEach((periodStart, index) => {
      if (index === 0) {
        run = 1;
      } else {
        const expected = previous.subtract(1, unit);
        run = periodStart.isSame(expected, unit) ? run + 1 : 1;
      }
      longest = Math.max(longest, run);
      previous = periodStart;
    });

    // The current streak only counts if the most recent completion is the
    // period we are in now, or the one immediately before it.
    if (completed.length > 0) {
      const now = dayjs.utc().startOf(unit === "week" ? "isoWeek" : unit);
      const latest = completed[0];
      const gap = now.diff(latest, unit);
      if (gap <= 1) {
        let streak = 1;
        for (let i = 1; i < completed.length; i += 1) {
          if (completed[i].isSame(completed[i - 1].subtract(1, unit), unit)) streak += 1;
          else break;
        }
        current = streak;
      }
    }

    return {
      goalId: goal._id,
      task: goal.task,
      category: goal.category,
      interval: goal.interval,
      currentStreak: current,
      longestStreak: longest,
      completedPeriods: completed.length,
    };
  });

  res.json({ windowDays: all ? "all" : days, streaks: result });
});

module.exports = { summary, matrix, byGoal, streaks };
