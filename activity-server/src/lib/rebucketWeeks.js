const GoalHistory = require("../models/goalHistory");
const { getPeriodStartDate, startOfWeek, dayjs } = require("./periods");

/**
 * Move an account's weekly history onto a different week boundary.
 *
 * `periodStart` for a weekly row is the first day of that week, so changing
 * which day starts the week changes where every existing weekly row belongs.
 * Without this, those rows keep their old boundary, stop matching the queries
 * the app now makes, and silently vanish from the UI while still occupying the
 * unique index.
 *
 * A row is placed by its old week's MIDPOINT, not its first day. Shifting the
 * boundary means the old and new weeks overlap only partially, and the midpoint
 * picks the new week sharing the most days with the old one — at least four of
 * seven. Mapping from the first day instead drags every row into the preceding
 * new-week, which puts it outside the range the app then queries and makes the
 * progress look lost.
 *
 * The result is then clamped so nothing lands in a week that has not started.
 * The week in progress is the case that needs it: change the boundary early in
 * a week and max-overlap points at the NEXT new-week, so the progress recorded
 * today would move into the future and vanish from the view of today. A week
 * can only overshoot by one, so clamping to the week containing `today` is
 * enough. `today` is the user's local date and must be passed in — the server
 * cannot know what day it is where they are.
 *
 * Two old weeks can still land in one new week, so collisions are summed rather
 * than resolved by picking a winner — dropping a week of recorded progress to
 * avoid a duplicate key would be the worst possible outcome here.
 *
 * Returns a summary; pass `{ dryRun: true }` to compute it without writing.
 */
const rebucketWeeks = async (accountId, fromWeekStart, toWeekStart, { dryRun = false, today } = {}) => {
  if (fromWeekStart === toWeekStart) {
    return { moved: 0, merged: 0, scanned: 0, unchanged: true };
  }

  const rows = await GoalHistory.find({ accountId, interval: "weekly" }).lean();
  if (rows.length === 0) return { moved: 0, merged: 0, scanned: 0, unchanged: false };

  // Nothing may be placed later than the week the user is currently in.
  const ceiling = startOfWeek(today ? dayjs.utc(today) : dayjs.utc(), toWeekStart);

  // Group by where each row is going.
  const target = new Map();
  let moved = 0;

  for (const row of rows) {
    const midpoint = dayjs.utc(row.periodStart).add(3, "day");
    const byOverlap = getPeriodStartDate("weekly", midpoint, toWeekStart);
    // Only the in-progress week can overshoot, and only by one week.
    const recomputed = ceiling.isBefore(dayjs.utc(byOverlap)) ? ceiling.toDate() : byOverlap;
    if (recomputed.getTime() !== new Date(row.periodStart).getTime()) moved += 1;

    const key = `${row.goalId}|${recomputed.toISOString()}`;
    const existing = target.get(key);
    if (existing) {
      existing.achieved += row.achieved;
      existing.targetPerDuration = Math.max(existing.targetPerDuration, row.targetPerDuration);
      existing.note = [existing.note, row.note].filter(Boolean).join(" · ");
      existing.sourceIds.push(row._id);
    } else {
      target.set(key, {
        goalId: row.goalId,
        accountId: row.accountId,
        interval: "weekly",
        periodStart: recomputed,
        targetPerDuration: row.targetPerDuration,
        achieved: row.achieved,
        note: row.note || "",
        sourceIds: [row._id],
      });
    }
  }

  const merged = rows.length - target.size;
  if (dryRun) return { moved, merged, scanned: rows.length, unchanged: false };

  // Delete then insert, because the unique key is (goalId, interval, periodStart)
  // and an in-place update would collide with a row that has not moved yet.
  await GoalHistory.deleteMany({ _id: { $in: rows.map((row) => row._id) } });
  await GoalHistory.insertMany(
    [...target.values()].map(({ sourceIds, ...doc }) => doc),
    { ordered: false }
  );

  return { moved, merged, scanned: rows.length, unchanged: false };
};

module.exports = { rebucketWeeks };
