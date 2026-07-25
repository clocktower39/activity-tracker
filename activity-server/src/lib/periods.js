const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const customParseFormat = require("dayjs/plugin/customParseFormat");

dayjs.extend(utc);
dayjs.extend(customParseFormat);

/**
 * Period math. This module is the single source of truth for how a date maps to
 * a storage bucket; the client mirrors it in src/lib/periods.js. If the two ever
 * disagree, progress ticks land in the wrong bucket.
 *
 * Every boundary is computed in UTC.
 *
 * Week boundaries depend on the account's `weekStart` (0 = Sunday … 6 = Saturday)
 * and are computed arithmetically rather than through a dayjs locale or the
 * isoWeek plugin, so the result can never drift with the runtime's locale.
 *
 * On the server, weekStart is ALWAYS passed explicitly — it is a per-account
 * setting and there is no such thing as an ambient one.
 */

const INTERVALS = ["daily", "weekly", "monthly", "yearly", "none"];
const INTERVAL_SET = new Set(INTERVALS);

/** 0-indexed from Sunday, matching JS getDay() and dayjs .day(). */
const WEEK_DAYS = [
  { value: 0, name: "sunday", label: "Sunday" },
  { value: 1, name: "monday", label: "Monday" },
  { value: 2, name: "tuesday", label: "Tuesday" },
  { value: 3, name: "wednesday", label: "Wednesday" },
  { value: 4, name: "thursday", label: "Thursday" },
  { value: 5, name: "friday", label: "Friday" },
  { value: 6, name: "saturday", label: "Saturday" },
];

const DEFAULT_WEEK_START = 0; // Sunday

const normalizeWeekStart = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : DEFAULT_WEEK_START;
};

/** The name $dateTrunc expects for a given weekStart. */
const weekStartName = (weekStart) => WEEK_DAYS[normalizeWeekStart(weekStart)].name;

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

const normalizeInterval = (value) => {
  if (!value) return "daily";
  const normalized = String(value).trim().toLowerCase();
  if (LEGACY_ALIASES[normalized]) return LEGACY_ALIASES[normalized];
  return INTERVAL_SET.has(normalized) ? normalized : "daily";
};

/** Start of the week containing `date`, for an arbitrary first day of week. */
const startOfWeek = (date, weekStart = DEFAULT_WEEK_START) => {
  const base = dayjs.utc(date).startOf("day");
  const offset = (base.day() - normalizeWeekStart(weekStart) + 7) % 7;
  return base.subtract(offset, "day");
};

/** Start of the period containing `date`, as a UTC dayjs. */
const getPeriodStart = (interval, date, weekStart = DEFAULT_WEEK_START) => {
  const base = dayjs.utc(date);
  switch (normalizeInterval(interval)) {
    case "weekly":
      return startOfWeek(base, weekStart);
    case "monthly":
      return base.startOf("month");
    case "yearly":
      return base.startOf("year");
    // "none" has no schedule, but still buckets by day so ad-hoc ticks have a home.
    case "none":
    case "daily":
    default:
      return base.startOf("day");
  }
};

/** Start of the period containing `date`, as a JS Date (what Mongo stores). */
const getPeriodStartDate = (interval, date, weekStart) =>
  getPeriodStart(interval, date, weekStart).toDate();

/** Stable string key for a period, e.g. "2026-07-19". */
const getPeriodKey = (interval, date, weekStart) =>
  getPeriodStart(interval, date, weekStart).format("YYYY-MM-DD");

/** Unit accepted by dayjs .add()/.subtract() for an interval. */
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

const addPeriods = (interval, date, count) => dayjs.utc(date).add(count, addUnitFor(interval));

/**
 * Every period start between `from` and `to` inclusive, oldest first.
 * Guarded with a hard cap so a bad range cannot spin forever.
 */
const listPeriodStarts = (interval, from, to, weekStart, cap = 4000) => {
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

/**
 * Half-open [start, end) range covering every period that overlaps [from, to].
 * Used to bound history queries so we never scan the whole collection.
 */
const getQueryRange = (interval, from, to, weekStart) => {
  const normalized = normalizeInterval(interval);
  const start = getPeriodStart(normalized, from, weekStart);
  const end = getPeriodStart(
    normalized,
    addPeriods(normalized, getPeriodStart(normalized, to, weekStart), 1),
    weekStart
  );
  return { start: start.toDate(), end: end.toDate() };
};

module.exports = {
  INTERVALS,
  WEEK_DAYS,
  DEFAULT_WEEK_START,
  normalizeWeekStart,
  weekStartName,
  normalizeInterval,
  addUnitFor,
  startOfWeek,
  getPeriodStart,
  getPeriodStartDate,
  getPeriodKey,
  addPeriods,
  listPeriodStarts,
  getQueryRange,
  dayjs,
};
