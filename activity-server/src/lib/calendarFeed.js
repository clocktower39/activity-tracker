const GoalHistory = require("../models/goalHistory");
const timezone = require("dayjs/plugin/timezone");
const { isRolling, rollingWindowStart, getPeriodStart, addPeriods, dayjs } = require("./periods");

dayjs.extend(timezone);

/**
 * The private calendar feed: one all-day event per weekly or monthly goal, on
 * the day it next falls due.
 *
 * "Due" follows the goal's cadence:
 *  - Rolling: the window (last 7 days / last month) is short of the target →
 *    due today. Otherwise due on the first day the window, with no new taps,
 *    would drop below the target — the day the oldest counted tap ages out.
 *  - Calendar: the current week/month is short → due on its last day.
 *    Otherwise due on the first day of the next one.
 *
 * Daily and unscheduled goals are left out; a calendar full of them is noise.
 *
 * "Today" is the subscriber's calendar date, from the tz in the feed URL.
 * The server never guesses a user's day (ARCHITECTURE §6.1), and nothing is
 * stored per user, so the timezone lives in the subscription link itself.
 */

const fmt = (d) => d.format("YYYY-MM-DD");
const ymd = (d) => d.format("YYYYMMDD");

/** The subscriber's local date as a UTC-midnight label, like every other periodStart. */
const todayIn = (tz) => {
  let local;
  try {
    local = dayjs().tz(tz).format("YYYY-MM-DD");
  } catch {
    local = dayjs.utc().format("YYYY-MM-DD");
  }
  return dayjs.utc(local);
};

const validTimeZone = (tz) => {
  if (typeof tz !== "string" || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/** When a rolling goal next falls due, given its taps in the current window. */
const rollingDue = (goal, today, rows, target) => {
  const sumFrom = (from) =>
    rows.reduce((acc, r) => (!dayjs.utc(r.periodStart).isBefore(from) ? acc + r.achieved : acc), 0);
  const now = sumFrom(rollingWindowStart(goal.interval, today));
  if (now < target) return { due: today, achieved: now };
  for (let d = 1; d <= 32; d += 1) {
    const day = today.add(d, "day");
    if (sumFrom(rollingWindowStart(goal.interval, day)) < target) return { due: day, achieved: now };
  }
  return { due: today.add(1, "month"), achieved: now };
};

const calendarDue = (goal, today, rows, target, weekStart) => {
  const start = getPeriodStart(goal.interval, today, weekStart);
  const next = getPeriodStart(goal.interval, addPeriods(goal.interval, start, 1), weekStart);
  const now = rows
    .filter((r) => dayjs.utc(r.periodStart).isSame(start, "day"))
    .reduce((acc, r) => acc + r.achieved, 0);
  return now < target
    ? { due: next.subtract(1, "day"), achieved: now }
    : { due: next, achieved: now };
};

/** Escape per RFC 5545 §3.3.11 and fold lines at 75 octets. */
const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line) => {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + (parts.length ? 74 : 75), bytes.length);
    // Never split a multi-byte character.
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end -= 1;
    parts.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
  }
  return parts.join("\r\n ");
};

/**
 * Build the .ics body for one account. Bounded: at most one month (plus a
 * calendar period) of day rows per weekly/monthly goal, and one indexed
 * last-done lookup each.
 */
const buildFeed = async ({ user, goals, tz }) => {
  const today = todayIn(tz);
  const stamp = `${dayjs.utc().format("YYYYMMDD[T]HHmmss")}Z`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Activity Tracker//Goals//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Activity Tracker",
    `X-WR-TIMEZONE:${esc(tz)}`,
    // A hint; Google refreshes on its own schedule regardless.
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  const scheduled = goals.filter((g) => g.interval === "weekly" || g.interval === "monthly");
  for (const goal of scheduled) {
    const target = Math.max(1, Number(goal.defaultTarget) || 1);
    const rolling = isRolling(goal);
    const windowFrom = rolling
      ? rollingWindowStart(goal.interval, today)
      : getPeriodStart(goal.interval, today, user.weekStart);
    const [rows, last] = await Promise.all([
      GoalHistory.find({
        goalId: goal._id,
        achieved: { $gt: 0 },
        periodStart: { $gte: windowFrom.toDate(), $lte: today.toDate() },
      })
        .select("periodStart achieved")
        .lean(),
      GoalHistory.findOne({ goalId: goal._id, achieved: { $gt: 0 }, periodStart: { $lte: today.toDate() } })
        .sort({ periodStart: -1 })
        .select("periodStart")
        .lean(),
    ]);

    const { due, achieved } = rolling
      ? rollingDue(goal, today, rows, target)
      : calendarDue(goal, today, rows, target, user.weekStart);

    const lastDone = last ? dayjs.utc(last.periodStart) : null;
    const span = goal.interval === "weekly" ? (rolling ? "the last 7 days" : "this week") : rolling ? "the last month" : "this month";
    const summary =
      target > 1 && fmt(due) === fmt(today) ? `${goal.task} · ${achieved} of ${target}` : goal.task;
    const description = [
      lastDone ? `Last done ${lastDone.format("ddd D MMM YYYY")}.` : "Not done yet.",
      `${achieved} of ${target} in ${span}.`,
    ].join(" ");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${goal._id}@activity-tracker`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(due)}`,
      `DTEND;VALUE=DATE:${ymd(due.add(1, "day"))}`,
      `SUMMARY:${esc(summary)}`,
      `DESCRIPTION:${esc(description)}`,
      `CATEGORIES:${esc(goal.category || "Goals")}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
};

module.exports = { buildFeed, validTimeZone, todayIn };
