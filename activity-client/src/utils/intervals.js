import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const INTERVAL_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "No Schedule", value: "none" },
];

const INTERVALS = new Set(INTERVAL_OPTIONS.map((opt) => opt.value));

export const normalizeInterval = (value) => {
  if (!value) return "daily";
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "no schedule" || normalized === "unscheduled" || normalized === "nonscheduled") {
    return "none";
  }
  return INTERVALS.has(normalized) ? normalized : "daily";
};

export const getPeriodStart = (interval, date) => {
  const normalized = normalizeInterval(interval);
  const base = dayjs.utc(date, "YYYY-MM-DD");
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

export const getPeriodKey = (interval, date) => getPeriodStart(interval, date).format("YYYY-MM-DD");

export const getPeriodLabels = (interval, date) => {
  const normalized = normalizeInterval(interval);
  const periodStart = getPeriodStart(normalized, date).local();
  switch (normalized) {
    case "weekly":
      return {
        short: periodStart.format("[Wk] MMM D"),
        long: periodStart.format("[Week of] MMM D, YYYY"),
      };
    case "monthly":
      return {
        short: periodStart.format("MMM"),
        long: periodStart.format("MMMM YYYY"),
      };
    case "yearly":
      return {
        short: periodStart.format("YYYY"),
        long: periodStart.format("YYYY"),
      };
    case "none":
      return {
        short: periodStart.format("MMM D"),
        long: periodStart.format("MMM D, YYYY"),
      };
    case "daily":
    default:
      return {
        short: periodStart.format("ddd"),
        long: periodStart.format("MMM D, YYYY"),
      };
  }
};

export const addPeriod = (interval, date) => {
  const normalized = normalizeInterval(interval);
  switch (normalized) {
    case "weekly":
      return date.add(1, "week");
    case "monthly":
      return date.add(1, "month");
    case "yearly":
      return date.add(1, "year");
    case "none":
    case "daily":
    default:
      return date.add(1, "day");
  }
};
