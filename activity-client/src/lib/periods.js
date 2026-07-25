import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

/**
 * Mirror of activity-server/src/lib/periods.js. These two must agree exactly —
 * if they diverge, a tap is stored in one bucket and read back from another.
 *
 * Everything is UTC. Week boundaries follow the signed-in account's `weekStart`
 * (0 = Sunday … 6 = Saturday) and are computed arithmetically rather than via a
 * dayjs locale, so they cannot drift with the browser's locale.
 *
 * The server passes weekStart explicitly on every call because it serves many
 * accounts. This client only ever serves one, so it holds a configured default
 * that `configureWeekStart` sets from the signed-in user — an explicit argument
 * still wins wherever one is passed.
 */

export const WEEK_DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export const DEFAULT_WEEK_START = 0;

export const normalizeWeekStart = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : DEFAULT_WEEK_START;
};

let configuredWeekStart = DEFAULT_WEEK_START;

/** Set from the signed-in user; reset on sign-out. */
export const configureWeekStart = (value) => {
  configuredWeekStart = normalizeWeekStart(value);
};

export const getConfiguredWeekStart = () => configuredWeekStart;

/** Start of the week containing `date`, for an arbitrary first day of week. */
export const startOfWeek = (date, weekStart) => {
  const base = dayjs.utc(date).startOf("day");
  const offset = (base.day() - normalizeWeekStart(weekStart ?? configuredWeekStart) + 7) % 7;
  return base.subtract(offset, "day");
};

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

const addUnitFor = (interval) => {
  switch (normalizeInterval(interval)) {
    case "weekly":
      return "week";
    case "monthly":
      return "month";
    case "yearly":
      return "year";
    default:
      return "day";
  }
};

export const getPeriodStart = (interval, date, weekStart) => {
  const base = dayjs.utc(date);
  switch (normalizeInterval(interval)) {
    case "weekly":
      return startOfWeek(base, weekStart);
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

export const getPeriodKey = (interval, date, weekStart) =>
  getPeriodStart(interval, date, weekStart).format("YYYY-MM-DD");

export const addPeriods = (interval, date, count) =>
  dayjs.utc(date).add(count, addUnitFor(interval));

/** Cache key for a single goal's slot in a single period. */
export const entryKey = (goalId, interval, date, weekStart) =>
  `${goalId}|${normalizeInterval(interval)}|${getPeriodKey(interval, date, weekStart)}`;

/**
 * The user's LOCAL calendar date, as "YYYY-MM-DD".
 *
 * This is deliberately not `dayjs.utc()`. A `periodStart` is a date *label*
 * that happens to be stored at UTC midnight — it is not an instant — so the
 * label has to come from the calendar the user is actually looking at. Deriving
 * it from UTC meant that everywhere behind UTC the app rolled over to tomorrow
 * partway through the evening (in UTC-7, at 17:00 local), showing an empty day
 * and recording taps against the wrong date.
 *
 * Everything downstream still parses these strings as UTC, which is what keeps
 * a given calendar date the same bucket for everyone.
 */
export const todayKey = () => dayjs().format("YYYY-MM-DD");

/** A local calendar date offset from today, e.g. localDateKey(-365). */
export const localDateKey = (offset = 0, unit = "day") =>
  dayjs().add(offset, unit).format("YYYY-MM-DD");

/** Date-string comparison; ISO dates sort lexicographically. */
export const isFutureKey = (key) => String(key) > todayKey();

/**
 * Human label for a period. Kept deliberately plain — a date the user recognises
 * beats a clever notation they have to decode.
 */
export const periodLabel = (interval, date, weekStart) => {
  const normalized = normalizeInterval(interval);
  const start = getPeriodStart(normalized, date, weekStart);
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

export const shortPeriodLabel = (interval, date, weekStart) => {
  const normalized = normalizeInterval(interval);
  const start = getPeriodStart(normalized, date, weekStart);
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
export const eachPeriod = (interval, from, to, cap = 400, weekStart) => {
  const normalized = normalizeInterval(interval);
  let cursor = getPeriodStart(normalized, from, weekStart);
  const end = getPeriodStart(normalized, to, weekStart);
  const out = [];
  while (!cursor.isAfter(end) && out.length < cap) {
    out.push(cursor);
    cursor = getPeriodStart(normalized, addPeriods(normalized, cursor, 1), weekStart);
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
