import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isoWeek from "dayjs/plugin/isoWeek";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(utc);
dayjs.extend(isoWeek);
dayjs.extend(advancedFormat);

/**
 * Mirror of activity-server/src/lib/periods.js. These two must agree exactly —
 * if they diverge, a tap is stored in one bucket and read back from another.
 *
 * Everything is UTC. Weeks are ISO weeks, starting Monday.
 */

export const INTERVALS = ["daily", "weekly", "monthly", "yearly", "none"];

export const INTERVAL_OPTIONS = [
  { value: "daily", label: "Daily", noun: "day" },
  { value: "weekly", label: "Weekly", noun: "week" },
  { value: "monthly", label: "Monthly", noun: "month" },
  { value: "yearly", label: "Yearly", noun: "year" },
  { value: "none", label: "No schedule", noun: "entry" },
];

const INTERVAL_SET = new Set(INTERVALS);

const LEGACY_ALIASES = {
  "no schedule": "none",
  "no-schedule": "none",
  unscheduled: "none",
  nonscheduled: "none",
  day: "daily",
  week: "weekly",
  month: "monthly",
  year: "yearly",
};

export const normalizeInterval = (value) => {
  if (!value) return "daily";
  const normalized = String(value).trim().toLowerCase();
  if (LEGACY_ALIASES[normalized]) return LEGACY_ALIASES[normalized];
  return INTERVAL_SET.has(normalized) ? normalized : "daily";
};

export const unitFor = (interval) => {
  switch (normalizeInterval(interval)) {
    case "weekly":
      return "isoWeek";
    case "monthly":
      return "month";
    case "yearly":
      return "year";
    case "none":
    case "daily":
    default:
      return "day";
  }
};

const addUnitFor = (interval) => {
  const unit = unitFor(interval);
  return unit === "isoWeek" ? "week" : unit;
};

export const getPeriodStart = (interval, date) => dayjs.utc(date).startOf(unitFor(interval));

export const getPeriodKey = (interval, date) => getPeriodStart(interval, date).format("YYYY-MM-DD");

export const addPeriods = (interval, date, count) =>
  dayjs.utc(date).add(count, addUnitFor(interval));

/** Cache key for a single goal's slot in a single period. */
export const entryKey = (goalId, interval, date) =>
  `${goalId}|${normalizeInterval(interval)}|${getPeriodKey(interval, date)}`;

export const todayKey = () => dayjs.utc().format("YYYY-MM-DD");

/**
 * Human label for a period. Kept deliberately plain — a date the user recognises
 * beats a clever notation they have to decode.
 */
export const periodLabel = (interval, date) => {
  const normalized = normalizeInterval(interval);
  const start = getPeriodStart(normalized, date);
  switch (normalized) {
    case "weekly":
      return `Week of ${start.format("MMM D, YYYY")}`;
    case "monthly":
      return start.format("MMMM YYYY");
    case "yearly":
      return start.format("YYYY");
    default:
      return start.format("ddd D MMM YYYY");
  }
};

export const shortPeriodLabel = (interval, date) => {
  const normalized = normalizeInterval(interval);
  const start = getPeriodStart(normalized, date);
  switch (normalized) {
    case "weekly":
      return start.format("D MMM");
    case "monthly":
      return start.format("MMM");
    case "yearly":
      return start.format("YYYY");
    default:
      return start.format("D");
  }
};

/** Every period start in [from, to], oldest first. Bounded. */
export const eachPeriod = (interval, from, to, cap = 400) => {
  const normalized = normalizeInterval(interval);
  let cursor = getPeriodStart(normalized, from);
  const end = getPeriodStart(normalized, to);
  const out = [];
  while (!cursor.isAfter(end) && out.length < cap) {
    out.push(cursor);
    cursor = getPeriodStart(normalized, addPeriods(normalized, cursor, 1));
  }
  return out;
};

/** Progress state for a ring. `mode` is the goal's trackingMode. */
export const progressState = (achieved, target, mode = "target") => {
  const value = Number(achieved) || 0;
  const goal = Number(target) || 0;
  if (value <= 0) return "empty";
  if (goal <= 0) return value > 0 ? "complete" : "empty";
  if (value < goal) return "partial";
  if (value >= goal && (mode !== "more" || value < goal * 2)) return "complete";
  return "over";
};

/**
 * Dynamic mark for a more-is-better goal past its target.
 *
 * Twice the target is f, three times is ff, four or more is fff. It stops there
 * because fff is where the notation stops — ffff would be a mark no score uses.
 */
export const dynamicMark = (achieved, target, mode = "target") => {
  if (mode !== "more") return null;
  const goal = Number(target) || 0;
  if (goal <= 0) return null;
  const laps = Math.floor((Number(achieved) || 0) / goal);
  if (laps < 2) return null;
  return "f".repeat(Math.min(laps - 1, 3));
};

export { dayjs };
