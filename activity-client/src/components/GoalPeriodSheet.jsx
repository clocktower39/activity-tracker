import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import EditIcon from "@mui/icons-material/EditOutlined";
import GoalFormDialog from "./GoalFormDialog";
import PeriodBars from "./PeriodBars";
import { recordProgress } from "../features/history/historySlice";
import {
  addPeriods,
  dayjs,
  eachPeriod,
  entryKey,
  isFutureKey,
  normalizeInterval,
  periodLabel,
  progressState,
} from "../lib/periods";
import { stateColor } from "../design/theme";
import { useTheme } from "@mui/material/styles";

const NOUN = { weekly: "week", monthly: "month", yearly: "year" };

const rowLabel = (granularity, key) => {
  const d = dayjs.utc(key);
  return granularity === "monthly" ? d.format("MMMM") : d.format("ddd D MMM");
};

/**
 * One goal, laid across the period the page is showing.
 *
 * The daily sheet answers "how did this go today". On the week, month and year
 * pages the question is different — "how did this go across this period" — and
 * opening the daily sheet there answered it about the first day of the period,
 * which is almost never what was clicked.
 *
 * A row is directly editable when the goal's own cadence matches the row's
 * granularity: days on the week and month pages, months on the year page for a
 * monthly goal. Where a row is an aggregate of finer periods (a daily goal seen
 * by month) there is no single number to edit, so it reads instead and offers a
 * way into the page that can edit it.
 */
export default function GoalPeriodSheet({
  goal,
  pageInterval,
  periodKey,
  columns,
  granularity,
  cells,
  // Review spans an arbitrary range rather than one named period, so it passes
  // its own title and noun instead of letting them be derived from a cadence.
  title,
  spanNoun,
  onClose,
  onDrillDown,
}) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const chart = theme.palette.chart;
  const entries = useSelector((state) => state.history.entries);
  const pending = useSelector((state) => state.history.pending);
  const [editing, setEditing] = useState(false);

  // Aggregated cells mean the row spans more of the goal's periods than one, so
  // the number shown is a sum and cannot be written back to.
  const editable = !cells && rowMatchesGoal(granularity, goal?.interval);

  const rows = useMemo(() => {
    if (!goal) return [];
    const perPeriodTarget = Number(goal.defaultTarget) || 0;

    return columns.map((key) => {
      if (cells) {
        // An aggregated row covers many of the goal's periods, and the stored
        // target only counts periods that have a row. Expressing "January" as
        // 0/6 because two stray rows exist is meaningless, so the target is the
        // one the goal actually carried across the whole span — which is also
        // what the unaggregated rows below do when a period has no row yet.
        const value = cells[`${goal._id}|${key}`];
        const spanEnd = addPeriods(granularity === "monthly" ? "monthly" : "daily", key, 1)
          .subtract(1, "day")
          .format("YYYY-MM-DD");
        const periods = eachPeriod(goal.interval, key, spanEnd, 400).length;
        return {
          key,
          achieved: value?.achieved ?? 0,
          target: periods * perPeriodTarget,
          future: isFutureKey(key),
        };
      }

      const value = entries[entryKey(goal._id, goal.interval, key)];
      return {
        key,
        achieved: value?.achieved ?? 0,
        target: value?.target ?? perPeriodTarget,
        future: isFutureKey(key),
      };
    });
  }, [goal, columns, cells, entries, granularity]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.achieved += row.achieved;
          acc.target += row.target;
          if (row.target > 0 && row.achieved >= row.target) acc.hit += 1;
          if (!row.future) acc.elapsed += 1;
          return acc;
        },
        { achieved: 0, target: 0, hit: 0, elapsed: 0 }
      ),
    [rows]
  );

  if (!goal) return null;

  const percent = totals.target > 0 ? Math.round((totals.achieved / totals.target) * 100) : 0;
  const series = rows.map((row) => ({
    key: row.key,
    achieved: row.achieved,
    target: row.target,
    current: false,
  }));

  return (
    <>
      <Dialog
        open={Boolean(goal) && !editing}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        aria-labelledby="goal-period-title"
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, p: 6, pb: 4 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
                {goal.category} · {title || periodLabel(pageInterval, periodKey)}
              </Typography>
              <Typography id="goal-period-title" variant="h3" sx={{ wordBreak: "break-word" }}>
                {goal.task}
              </Typography>
            </Box>
            <IconButton onClick={() => setEditing(true)} aria-label="Edit this goal" size="small">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={onClose} aria-label="Close" size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ height: 1, bgcolor: "divider" }} />

          {/* The period's headline: what this goal did over the whole span. */}
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 6, px: 6, py: 6, flexWrap: "wrap" }}>
            <Box>
              <Typography
                sx={{
                  fontFamily: (t) => t.typography.h1.fontFamily,
                  fontSize: "3rem",
                  lineHeight: 1,
                  fontWeight: 500,
                  color: percent >= 100 ? "chart.brass" : "chart.vermilion",
                }}
              >
                {totals.achieved}
              </Typography>
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                of {totals.target} {spanNoun || `this ${NOUN[pageInterval]}`}
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: (t) => t.typography.h1.fontFamily,
                  fontSize: "1.375rem",
                  fontWeight: 500,
                  color: "text.primary",
                }}
              >
                {totals.hit}/{columns.length}
              </Typography>
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                {granularity === "monthly" ? "months" : "days"} hit
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: (t) => t.typography.h1.fontFamily,
                  fontSize: "1.375rem",
                  fontWeight: 500,
                  color: "text.primary",
                }}
              >
                {percent}%
              </Typography>
              <Typography variant="overline" sx={{ color: "text.secondary" }}>
                of target
              </Typography>
            </Box>
          </Box>

          <Box sx={{ px: 6, pb: 6 }}>
            <PeriodBars series={series} interval={granularity} trackingMode={goal.trackingMode} />
          </Box>

          <Box sx={{ height: 1, bgcolor: "divider" }} />

          <Box sx={{ maxHeight: 320, overflowY: "auto" }}>
            {rows.map((row) => {
              const state = progressState(row.achieved, row.target, goal.trackingMode);
              const key = entryKey(goal._id, goal.interval, row.key);
              return (
                <Box
                  key={row.key}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    px: 6,
                    py: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    opacity: row.future ? 0.45 : 1,
                  }}
                >
                  {/* A hairline in the row's own state, so the list scans like
                      the stave it was opened from. */}
                  <Box
                    aria-hidden
                    sx={{
                      width: 3,
                      alignSelf: "stretch",
                      bgcolor: state === "empty" ? "chart.empty" : stateColor(chart, state),
                      opacity: state === "empty" ? 0.3 : 1,
                    }}
                  />
                  <Typography variant="body2" sx={{ flexGrow: 1, color: "text.primary" }}>
                    {rowLabel(granularity, row.key)}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: (t) => t.typography.h1.fontFamily,
                      color: state === "empty" ? "text.secondary" : "text.primary",
                      minWidth: 56,
                      textAlign: "right",
                    }}
                  >
                    {row.achieved}
                    <Typography component="span" variant="overline" sx={{ color: "text.secondary" }}>
                      /{row.target}
                    </Typography>
                  </Typography>

                  {editable ? (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        aria-label={`Remove one from ${goal.task} on ${rowLabel(granularity, row.key)}`}
                        disabled={row.achieved <= 0 || Boolean(pending[key])}
                        onClick={() => dispatch(recordProgress({ goal, date: row.key, delta: -1 }))}
                        sx={{ border: "1px solid", borderColor: "divider" }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={`Add one to ${goal.task} on ${rowLabel(granularity, row.key)}`}
                        disabled={Boolean(pending[key])}
                        onClick={() => dispatch(recordProgress({ goal, date: row.key, delta: 1 }))}
                        sx={{ border: "1px solid", borderColor: "divider" }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    onDrillDown && (
                      <Button
                        size="small"
                        onClick={() => onDrillDown(row.key)}
                        sx={{ color: "text.secondary", minWidth: 0 }}
                      >
                        Open
                      </Button>
                    )
                  )}
                </Box>
              );
            })}
          </Box>

          {!editable && (
            <Typography variant="body2" sx={{ color: "text.secondary", px: 6, py: 4 }}>
              These are totals for each {granularity === "monthly" ? "month" : "period"}, added up
              from this goal&apos;s {NOUN[normalizeInterval(goal.interval)] || "daily"} entries, so
              there is no single number to adjust here. Open a{" "}
              {granularity === "monthly" ? "month" : "period"} to change what is in it.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      <GoalFormDialog
        open={editing}
        goal={goal}
        onClose={() => setEditing(false)}
        onDeleted={() => {
          setEditing(false);
          onClose();
        }}
      />
    </>
  );
}

/**
 * Whether one row covers exactly one of the goal's own periods, which is what
 * makes the value on that row a thing you can edit rather than a sum.
 * An unscheduled goal ("none") still buckets by day, so it counts as daily.
 */
function rowMatchesGoal(granularity, interval) {
  const normalized = normalizeInterval(interval);
  return granularity === "monthly"
    ? normalized === "monthly"
    : normalized === "daily" || normalized === "none";
}
