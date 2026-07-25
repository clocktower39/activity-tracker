const GoalHistory = require("../models/goalHistory");
const Goal = require("../models/goal");
const { ApiError, asyncHandler } = require("../lib/apiError");
const {
  INTERVALS,
  normalizeInterval,
  getPeriodStartDate,
  getQueryRange,
  dayjs,
} = require("../lib/periods");

const serialize = (row) => ({
  _id: row._id,
  goalId: row.goalId,
  interval: row.interval,
  periodStart: row.periodStart,
  targetPerDuration: row.targetPerDuration,
  achieved: row.achieved,
  note: row.note || "",
});

const parseDate = (value, label) => {
  const parsed = dayjs.utc(value, "YYYY-MM-DD", true);
  if (!parsed.isValid()) throw new ApiError(400, `${label} must be a YYYY-MM-DD date`);
  return parsed;
};

/**
 * Rows covering a single calendar date.
 *
 * Each goal buckets by its own interval, so "the row for today" means a
 * different periodStart per interval. One indexed $or covers all of them and
 * returns at most one row per goal — a few KB rather than the whole collection.
 */
const getForDate = asyncHandler(async (req, res) => {
  // The client always sends its local calendar date. The UTC fallback exists
  // for non-browser callers and is a day out either side of midnight for anyone
  // not on UTC, which is exactly the bug this parameter avoids.
  const date = parseDate(req.query.date || dayjs.utc().format("YYYY-MM-DD"), "date");

  const { weekStart } = res.locals.user;

  const rows = await GoalHistory.find({
    accountId: res.locals.user._id,
    $or: INTERVALS.map((interval) => ({
      interval,
      periodStart: getPeriodStartDate(interval, date, weekStart),
    })),
  }).lean();

  res.json({ date: date.format("YYYY-MM-DD"), entries: rows.map(serialize) });
});

/**
 * Rows whose period overlaps [from, to]. Backs the week / month / year views
 * and the per-goal charts. The range is always bounded and always indexed.
 */
const getRange = asyncHandler(async (req, res) => {
  const { from, to, goalId, interval } = req.query;
  if (!from || !to) throw new ApiError(400, "`from` and `to` query parameters are required");

  const fromDate = parseDate(from, "from");
  const toDate = parseDate(to, "to");
  if (toDate.isBefore(fromDate)) throw new ApiError(400, "`to` must not be before `from`");
  if (toDate.diff(fromDate, "year", true) > 5) {
    throw new ApiError(400, "Range must not exceed 5 years");
  }

  const { weekStart } = res.locals.user;
  const query = { accountId: res.locals.user._id };
  if (goalId) query.goalId = goalId;

  if (interval) {
    const normalized = normalizeInterval(interval);
    const { start, end } = getQueryRange(normalized, fromDate, toDate, weekStart);
    query.interval = normalized;
    query.periodStart = { $gte: start, $lt: end };
  } else {
    // Widest bucket wins, so a yearly goal overlapping the range is still found.
    const { start } = getQueryRange("yearly", fromDate, fromDate, weekStart);
    const { end } = getQueryRange("daily", toDate, toDate, weekStart);
    query.periodStart = { $gte: start, $lt: end };
  }

  const rows = await GoalHistory.find(query).sort({ periodStart: 1 }).lean();
  res.json({ from: fromDate.format("YYYY-MM-DD"), to: toDate.format("YYYY-MM-DD"), entries: rows.map(serialize) });
});

/**
 * Record progress against a goal for the period containing `date`.
 *
 * `delta` increments atomically via $inc so two quick taps cannot lose one
 * another — the old client read a value, added to it locally and wrote the
 * result back. `achieved` sets an absolute value instead, for the detail editor.
 */
const recordProgress = asyncHandler(async (req, res) => {
  const { goalId, date, delta, achieved, note } = req.body;
  if (!goalId) throw new ApiError(400, "goalId is required");

  const goal = await Goal.findOne({ _id: goalId, accountId: res.locals.user._id }).lean();
  if (!goal) throw new ApiError(404, "Goal not found");

  // Same as above: the client sends the date it is displaying, so a tap lands
  // on the day the user is looking at rather than the server's UTC day.
  const when = date ? parseDate(date, "date") : dayjs.utc();
  const interval = normalizeInterval(goal.interval);
  const periodStart = getPeriodStartDate(interval, when, res.locals.user.weekStart);
  const target = Number(goal.defaultTarget) || 0;

  const filter = { goalId: goal._id, interval, periodStart };
  const update = {
    $setOnInsert: {
      accountId: res.locals.user._id,
      targetPerDuration: target,
    },
  };

  if (achieved !== undefined) {
    const value = Number(achieved);
    if (!Number.isFinite(value) || value < 0) throw new ApiError(400, "achieved must be >= 0");
    update.$set = { achieved: value };
  } else {
    const step = Number(delta);
    if (!Number.isFinite(step) || step === 0) {
      throw new ApiError(400, "Provide a non-zero `delta` or an `achieved` value");
    }
    update.$inc = { achieved: step };
  }

  if (note !== undefined) {
    update.$set = { ...(update.$set || {}), note: String(note).slice(0, 2000) };
  }

  let row = await GoalHistory.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });

  // $inc can drive a value below zero; clamp rather than reject so the UI's
  // minus button is always safe to press.
  if (row.achieved < 0) {
    row = await GoalHistory.findOneAndUpdate(filter, { $set: { achieved: 0 } }, { new: true });
  }

  // A row that carries neither progress nor a note is noise. Delete it instead
  // of leaving an empty placeholder behind.
  if (row.achieved === 0 && !row.note) {
    await GoalHistory.deleteOne({ _id: row._id });
    return res.json({
      entry: {
        goalId: goal._id,
        interval,
        periodStart,
        targetPerDuration: target,
        achieved: 0,
        note: "",
      },
    });
  }

  res.json({ entry: serialize(row) });
});

module.exports = { getForDate, getRange, recordProgress };
