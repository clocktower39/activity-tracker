import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Container, Typography } from "@mui/material";
import EmptyState from "../components/EmptyState";
import Stave from "../components/Stave";
import {
  fetchMatrix,
  fetchStreaks,
  fetchSummary,
  selectMatrix,
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

  const range = useMemo(() => {
    const to = dayjs.utc().format("YYYY-MM-DD");
    // "All time" starts at the first thing this account ever recorded, not at
    // an arbitrary cutoff.
    const from =
      active.days === null
        ? recordRange?.first
          ? dayjs.utc(recordRange.first).startOf("month").format("YYYY-MM-DD")
          : dayjs.utc().subtract(365, "day").format("YYYY-MM-DD")
        : dayjs.utc().subtract(active.days, "day").format("YYYY-MM-DD");

    const days = dayjs.utc(to).diff(dayjs.utc(from), "day") + 1;
    return { from, to, bucket: bucketFor(days), days };
  }, [active, recordRange]);

  const streakWindow = active.days === null ? "all" : active.days;

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

        {active.days === null && spanLabel && (
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
                      title={`${dayjs.utc(bucket.periodStart).format("MMM YYYY")} — ${bucket.achieved} recorded, ${bucket.goalsCompleted} goals completed`}
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
                  {dayjs.utc(buckets[0].periodStart).format("MMM YYYY")}
                </Typography>
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  typical {average}
                </Typography>
                <Typography variant="overline" sx={{ color: "text.secondary" }}>
                  {dayjs.utc(buckets[buckets.length - 1].periodStart).format("MMM YYYY")}
                </Typography>
              </Box>
              {peakBucket && (
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 3 }}>
                  Best {bucketNoun}:{" "}
                  <Typography component="span" variant="body2" sx={{ color: "chart.brass" }}>
                    {dayjs.utc(peakBucket.periodStart).format("MMMM YYYY")} — {peak} recorded
                  </Typography>
                </Typography>
              )}
            </>
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
            Streaks {active.days === null ? "· all time" : `· last ${active.label.toLowerCase()}`}
          </Typography>
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
