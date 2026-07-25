import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Container, TextField, Typography } from "@mui/material";
import EmptyState from "../components/EmptyState";
import Stave from "../components/Stave";
import {
  fetchMatrix,
  fetchStreaks,
  fetchSummary,
  selectMatrix,
  selectStatsError,
  selectStreaks,
  selectSummary,
} from "../features/history/historySlice";
import {
  selectGoalsStatus,
  selectRecordRange,
  selectVisibleGoals,
} from "../features/goals/goalsSlice";
import { useAutoFetch } from "../hooks/useAutoFetch";
import { dayjs, eachPeriod } from "../lib/periods";

const WINDOWS = [
  { id: "30d", days: 30, label: "30 days" },
  { id: "90d", days: 90, label: "90 days" },
  { id: "1y", days: 365, label: "A year" },
  { id: "all", days: null, label: "All time" },
  { id: "custom", days: null, label: "Custom" },
];

/**
 * Picks a bucket that keeps the chart readable and the response small.
 * A decade of daily buckets is 3,650 bars in a 900px box; nobody can read that
 * and the server refuses it anyway.
 */
const bucketFor = (days) => {
  if (days <= 45) return "day";
  if (days <= 200) return "week";
  if (days <= 2200) return "month";
  return "year";
};

const staveIntervalFor = (bucket) => (bucket === "year" ? "yearly" : "monthly");

/** Naming a bucket by the month it fell in is wrong for day and week buckets. */
const bucketLabel = (bucket, value) => {
  const d = dayjs.utc(value);
  switch (bucket) {
    case "day":
      return d.format("D MMM YYYY");
    case "week":
      return `week of ${d.format("D MMM YYYY")}`;
    case "year":
      return d.format("YYYY");
    default:
      return d.format("MMMM YYYY");
  }
};

/** Axis ends: enough to place the bar, without repeating the full date. */
const axisLabel = (bucket, value) => {
  const d = dayjs.utc(value);
  if (bucket === "day" || bucket === "week") return d.format("D MMM YY");
  if (bucket === "year") return d.format("YYYY");
  return d.format("MMM YYYY");
};

/**
 * The review surface: what the long run looks like.
 *
 * Everything here is aggregated by the server — five years of monthly totals is
 * under 2 KB, where the underlying rows would be tens of thousands.
 */
export default function ReviewView() {
  const dispatch = useDispatch();
  const goalsStatus = useSelector(selectGoalsStatus);
  const goals = useSelector(selectVisibleGoals);
  const recordRange = useSelector(selectRecordRange);
  const [windowId, setWindowId] = useState("1y");

  const active = WINDOWS.find((w) => w.id === windowId) || WINDOWS[2];
  const isCustom = windowId === "custom";

  const today = dayjs.utc().format("YYYY-MM-DD");
  const recordStart = recordRange?.first
    ? dayjs.utc(recordRange.first).format("YYYY-MM-DD")
    : null;

  // Seeded to the last 6 months, which is long enough to be interesting and
  // short enough to be a sensible starting point to narrow from.
  const [draft, setDraft] = useState(() => ({
    from: dayjs.utc().subtract(6, "month").format("YYYY-MM-DD"),
    to: dayjs.utc().format("YYYY-MM-DD"),
  }));
  const [custom, setCustom] = useState(draft);

  const draftProblem = useMemo(() => {
    if (!draft.from || !draft.to) return "Pick both dates";
    const from = dayjs.utc(draft.from, "YYYY-MM-DD", true);
    const to = dayjs.utc(draft.to, "YYYY-MM-DD", true);
    if (!from.isValid() || !to.isValid()) return "Those aren't valid dates";
    if (to.isBefore(from)) return "The end date is before the start date";
    return null;
  }, [draft]);

  const draftDirty = draft.from !== custom.from || draft.to !== custom.to;

  const range = useMemo(() => {
    if (isCustom) {
      const days = dayjs.utc(custom.to).diff(dayjs.utc(custom.from), "day") + 1;
      return { from: custom.from, to: custom.to, bucket: bucketFor(days), days };
    }

    const to = today;
    // "All time" starts at the first thing this account ever recorded, not at
    // an arbitrary cutoff.
    const from =
      active.days === null
        ? recordStart
          ? dayjs.utc(recordStart).startOf("month").format("YYYY-MM-DD")
          : dayjs.utc().subtract(365, "day").format("YYYY-MM-DD")
        : dayjs.utc().subtract(active.days, "day").format("YYYY-MM-DD");

    const days = dayjs.utc(to).diff(dayjs.utc(from), "day") + 1;
    return { from, to, bucket: bucketFor(days), days };
  }, [active, recordStart, isCustom, custom, today]);

  // Streaks are computed from now backwards, so a custom range that does not
  // end today cannot produce a meaningful "current" streak. Ask for the whole
  // record and label the section honestly.
  const streakWindow = isCustom || active.days === null ? "all" : active.days;

  useAutoFetch(
    () => dispatch(fetchSummary({ from: range.from, to: range.to, bucket: range.bucket })),
    [range.from, range.to, range.bucket]
  );
  useAutoFetch(() => dispatch(fetchStreaks(streakWindow)), [streakWindow]);

  // The goal x period grid only makes sense once the window is long enough to
  // have more than a couple of columns.
  const wantsStave = range.days > 200;
  const staveBucket = range.bucket === "year" ? "year" : "month";

  useAutoFetch(() => {
    if (wantsStave) {
      dispatch(fetchMatrix({ from: range.from, to: range.to, bucket: staveBucket }));
    }
  }, [range.from, range.to, staveBucket, wantsStave]);

  const buckets = useSelector(selectSummary(range.bucket, range.from, range.to));
  const streaks = useSelector(selectStreaks(streakWindow));
  const matrixRows = useSelector(selectMatrix(staveBucket, range.from, range.to));
  const statsError = useSelector(selectStatsError(range.bucket, range.from, range.to));

  const ranked = useMemo(() => {
    if (!streaks) return [];
    return [...streaks]
      .filter((row) => row.completedPeriods > 0)
      .sort((a, b) => b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak);
  }, [streaks]);

  const peak = useMemo(() => Math.max(1, ...(buckets || []).map((b) => b.achieved)), [buckets]);

  const peakBucket = useMemo(
    () => (buckets || []).find((b) => b.achieved === peak && b.achieved > 0) || null,
    [buckets, peak]
  );

  const average = useMemo(() => {
    const activeBuckets = (buckets || []).filter((b) => b.achieved > 0);
    if (activeBuckets.length === 0) return 0;
    return Math.round(
      activeBuckets.reduce((sum, b) => sum + b.achieved, 0) / activeBuckets.length
    );
  }, [buckets]);

  const lifetimeTotal = useMemo(
    () => (buckets || []).reduce((sum, b) => sum + b.achieved, 0),
    [buckets]
  );

  const staveColumns = useMemo(() => {
    if (!wantsStave) return [];
    return eachPeriod(staveIntervalFor(staveBucket), range.from, range.to, 200).map((d) =>
      d.format("YYYY-MM-DD")
    );
  }, [wantsStave, staveBucket, range.from, range.to]);

  const staveCells = useMemo(() => {
    if (!matrixRows) return null;
    const out = {};
    matrixRows.forEach((row) => {
      const key = `${row.goalId}|${dayjs.utc(row.periodStart).format("YYYY-MM-DD")}`;
      out[key] = { achieved: row.achieved, target: row.target };
    });
    return out;
  }, [matrixRows]);

  const staveGroups = useMemo(() => {
    const map = new Map();
    goals.forEach((goal) => {
      const key = goal.category || "Uncategorised";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(goal);
    });
    return [...map.entries()].map(([category, items]) => ({ category, goals: items }));
  }, [goals]);

  const spanLabel = recordRange?.first
    ? `${dayjs.utc(recordRange.first).format("MMM YYYY")} – ${dayjs.utc().format("MMM YYYY")}`
    : null;

  const bucketNoun = { day: "day", week: "week", month: "month", year: "year" }[range.bucket];

  return (
    <>
      <Container maxWidth="md" sx={{ pt: 8, pb: 6 }}>
        <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
          Review
        </Typography>
        <Typography variant="h2" sx={{ mb: 3 }}>
          The long run
        </Typography>

        {windowId === "all" && spanLabel && (
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 5 }}>
            Everything on record — {spanLabel}
            {lifetimeTotal > 0 && (
              <>
                {" · "}
                <Typography component="span" variant="body2" sx={{ color: "chart.brass" }}>
                  {lifetimeTotal.toLocaleString()} recorded
                </Typography>
              </>
            )}
          </Typography>
        )}

        {isCustom && (
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 5 }}>
            {dayjs.utc(range.from).format("D MMM YYYY")} –{" "}
            {dayjs.utc(range.to).format("D MMM YYYY")} · {range.days.toLocaleString()} days, by{" "}
            {range.bucket}
            {lifetimeTotal > 0 && (
              <>
                {" · "}
                <Typography component="span" variant="body2" sx={{ color: "chart.brass" }}>
                  {lifetimeTotal.toLocaleString()} recorded
                </Typography>
              </>
            )}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {WINDOWS.map((option) => (
            <Box
              key={option.id}
              component="button"
              type="button"
              onClick={() => setWindowId(option.id)}
              aria-pressed={option.id === windowId}
              sx={{
                border: 0,
                bgcolor: "transparent",
                p: 0,
                py: 2,
                cursor: "pointer",
                fontFamily: (t) => t.typography.overline.fontFamily,
                fontSize: (t) => t.typography.overline.fontSize,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: option.id === windowId ? "chart.vermilion" : "text.secondary",
                borderBottom: "2px solid",
                borderColor: option.id === windowId ? "chart.vermilion" : "transparent",
              }}
            >
              {option.label}
            </Box>
          ))}
        </Box>

        {isCustom && (
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draftProblem) setCustom(draft);
            }}
            sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 4, mt: 5 }}
          >
            <TextField
              label="From"
              type="date"
              value={draft.from}
              onChange={(event) => setDraft((p) => ({ ...p, from: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: recordStart || undefined, max: today }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="To"
              type="date"
              value={draft.to}
              onChange={(event) => setDraft((p) => ({ ...p, to: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: draft.from || undefined, max: today }}
              sx={{ minWidth: 150 }}
            />
            <Button type="submit" variant="contained" disabled={Boolean(draftProblem) || !draftDirty}>
              Show
            </Button>
            {recordStart && (
              <Button
                onClick={() => {
                  const next = { from: recordStart, to: today };
                  setDraft(next);
                  setCustom(next);
                }}
                sx={{ color: "text.secondary" }}
              >
                Whole record
              </Button>
            )}
            {draftProblem && (
              <Typography
                role="alert"
                variant="body2"
                sx={{ color: "chart.vermilion", width: "100%" }}
              >
                {draftProblem}
              </Typography>
            )}
          </Box>
        )}
      </Container>

      <Container maxWidth="md">
        <Box component="section" sx={{ mb: 12 }}>
          <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
            Recorded per {bucketNoun}
          </Typography>
          <Box sx={{ height: 2, bgcolor: "divider", mb: 5 }} />

          {buckets && buckets.length > 0 ? (
            <>
              <Box sx={{ position: "relative", height: 140 }}>
                {average > 0 && (
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${140 - (average / peak) * 140}px`,
                      borderTop: "1px dashed",
                      borderColor: "chart.empty",
                    }}
                  />
                )}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "2px",
                    height: 140,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {buckets.map((bucket) => (
                    <Box
                      key={bucket.periodStart}
                      title={`${bucketLabel(range.bucket, bucket.periodStart)} — ${bucket.achieved} recorded, ${bucket.goalsCompleted} goals completed`}
                      sx={{
                        flex: 1,
                        minWidth: 2,
                        height: 140,
                        bgcolor: bucket.achieved === peak ? "chart.brass" : "chart.vermilion",
                        opacity: bucket.achieved > 0 ? 0.85 : 0,
                        transformOrigin: "bottom",
                        transform: `scaleY(${
                          bucket.achieved > 0 ? Math.max(2 / 140, bucket.achieved / peak) : 0
                        })`,
                      }}
                    />
                  ))}
                </Box>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  {axisLabel(range.bucket, buckets[0].periodStart)}
                </Typography>
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  typical {average}
                </Typography>
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  {axisLabel(range.bucket, buckets[buckets.length - 1].periodStart)}
                </Typography>
              </Box>
              {peakBucket && (
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 3 }}>
                  Best {bucketNoun}:{" "}
                  <Typography component="span" variant="body2" sx={{ color: "chart.brass" }}>
                    {bucketLabel(range.bucket, peakBucket.periodStart)} — {peak} recorded
                  </Typography>
                </Typography>
              )}
            </>
          ) : statsError ? (
            <Typography role="alert" variant="body2" sx={{ color: "chart.vermilion" }}>
              {statsError}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Nothing recorded in this window.
            </Typography>
          )}
        </Box>

        {wantsStave && staveColumns.length > 0 && goals.length > 0 && (
          <Stave
            goals={goals}
            groups={staveGroups}
            columns={staveColumns}
            interval={staveIntervalFor(staveBucket)}
            cells={staveCells}
          />
        )}

        <Box component="section" sx={{ mb: 12 }}>
          <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
            Streaks {streakWindow === "all" ? "· all time" : `· last ${active.label.toLowerCase()}`}
          </Typography>
          {isCustom && (
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
              Streaks always run to today, so they cover the whole record rather than the
              range above.
            </Typography>
          )}
          <Box sx={{ height: 2, bgcolor: "divider", mb: 5 }} />

          {goalsStatus === "ready" && ranked.length === 0 && (
            <EmptyState
              title="No streaks yet"
              body="Hit a goal's target for two periods in a row and it will show up here."
            />
          )}

          {ranked.map((row) => (
            <Box
              key={row.goalId}
              sx={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                py: 3,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="body1"
                  sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {row.task}
                </Typography>
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  {row.category} · {row.completedPeriods} hit
                </Typography>
              </Box>

              <Box sx={{ textAlign: "right", minWidth: 64 }}>
                <Typography
                  sx={{
                    fontFamily: (t) => t.typography.h1.fontFamily,
                    fontSize: "1.375rem",
                    fontWeight: 500,
                    color: row.currentStreak > 0 ? "chart.brass" : "text.secondary",
                  }}
                >
                  {row.currentStreak}
                </Typography>
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  now
                </Typography>
              </Box>

              <Box sx={{ textAlign: "right", minWidth: 64 }}>
                <Typography
                  sx={{
                    fontFamily: (t) => t.typography.h1.fontFamily,
                    fontSize: "1.375rem",
                    fontWeight: 500,
                    color: "text.secondary",
                  }}
                >
                  {row.longestStreak}
                </Typography>
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  best
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </>
  );
}
