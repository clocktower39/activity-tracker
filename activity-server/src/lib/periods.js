const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const isoWeek = require("dayjs/plugin/isoWeek");

dayjs.extend(utc);
dayjs.extend(isoWeek);

/**
 * Period math. This module is the single source of truth for how a date maps to
 * a storage bucket; the client mirrors it in src/lib/periods.js. If the two ever
 * disagree, progress ticks land in the wrong bucket.
 *
 * Every boundary is computed in UTC. Weeks use ISO weeks (Monday start) so the
 * result never depends on the runtime's locale.
 */

const INTERVALS = ["daily", "weekly", "monthly", "yearly", "none"];
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

const normalizeInterval = (value) => {
  if (!value) return "daily";
  const normalized = String(value).trim().toLowerCase();
  if (LEGACY_ALIASES[normalized]) return LEGACY_ALIASES[normalized];
  return INTERVAL_SET.has(normalized) ? normalized : "daily";
};

/** dayjs unit used for startOf/add on a given interval. */
const unitFor = (interval) => {
  switch (normalizeInterval(interval)) {
    case "weekly":
      return "isoWeek";
    case "monthly":
      return "month";
    case "yearly":
      return "year";
    // "none" has no schedule, but still buckets by day so ad-hoc ticks have a home.
    case "none":
    case "daily":
    default:
      return "day";
  }
};

/** Unit accepted by dayjs .add()/.subtract() — isoWeek is not one of them. */
const addUnitFor = (interval) => {
  const unit = unitFor(interval);
  return unit === "isoWeek" ? "week" : unit;
};

/** Start of the period containing `date`, as a UTC dayjs. */
const getPeriodStart = (interval, date) => dayjs.utc(date).startOf(unitFor(interval));

/** Start of the period containing `date`, as a JS Date (what Mongo stores). */
const getPeriodStartDate = (interval, date) => getPeriodStart(interval, date).toDate();

/** Stable string key for a period, e.g. "2026-07-20". */
const getPeriodKey = (interval, date) => getPeriodStart(interval, date).format("YYYY-MM-DD");

const addPeriods = (interval, date, count) =>
  dayjs.utc(date).add(count, addUnitFor(interval));

/**
 * Every period start between `from` and `to` inclusive, oldest first.
 * Guarded with a hard cap so a bad range cannot spin forever.
 */
const listPeriodStarts = (interval, from, to, cap = 4000) => {
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

/**
 * Half-open [start, end) range covering every period that overlaps [from, to].
 * Used to bound history queries so we never scan the whole collection.
 */
const getQueryRange = (interval, from, to) => {
  const normalized = normalizeInterval(interval);
  const start = getPeriodStart(normalized, from);
  const end = getPeriodStart(normalized, addPeriods(normalized, getPeriodStart(normalized, to), 1));
  return { start: start.toDate(), end: end.toDate() };
};

module.exports = {
  INTERVALS,
  normalizeInterval,
  unitFor,
  addUnitFor,
  getPeriodStart,
  getPeriodStartDate,
  getPeriodKey,
  addPeriods,
  listPeriodStarts,
  getQueryRange,
  dayjs,
};
