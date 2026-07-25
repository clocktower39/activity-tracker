import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Box, Typography, useTheme } from "@mui/material";
import { dayjs, entryKey, getConfiguredWeekStart, progressState } from "../lib/periods";
import { stateColor } from "../design/theme";

const columnLabel = (interval, key, count) => {
  const d = dayjs.utc(key);
  if (interval === "yearly") return d.format("YY");
  if (interval === "monthly") return d.format("MMM").slice(0, 1);
  return count <= 7 ? d.format("dd").slice(0, 1) : d.format("D");
};

const columnTitle = (interval, key) => {
  const d = dayjs.utc(key);
  if (interval === "yearly") return d.format("YYYY");
  if (interval === "monthly") return d.format("MMM YYYY");
  return d.format("MMM D");
};

/**
 * A bar opens at each week boundary in a month of days, each quarter in a year
 * of months, and every column in a run of years. The day-of-week boundary is
 * the account's own, so the bars line up with the weeks the user actually keeps.
 */
const startsBar = (interval, key, index) => {
  if (index === 0) return false;
  const d = dayjs.utc(key);
  if (interval === "yearly") return true;
  if (interval === "monthly") return d.month() % 3 === 0;
  return d.day() === getConfiguredWeekStart();
};

/**
 * The stave: every goal at the finer cadence laid across the period.
 *
 * A reading surface, not an entry surface — cells are too small to be safe tap
 * targets, so recording stays on Today and the row label opens the goal. State
 * is carried by fill height as well as colour, and each row ends with its own
 * total the way a practice chart carries a total per line.
 *
 * `cells` optionally supplies pre-aggregated values keyed "goalId|columnKey",
 * used by the Year view where the underlying rows are a finer cadence than the
 * columns.
 */
export default function Stave({ goals, columns, interval, groups, cells, onOpenGoal }) {
  const theme = useTheme();
  const chart = theme.palette.chart;
  const entries = useSelector((state) => state.history.entries);

  const rows = useMemo(() => {
    if (groups && groups.length > 0) return groups;
    return [{ category: null, goals }];
  }, [groups, goals]);

  const valueFor = (goal, column) => {
    if (cells) {
      const cell = cells[`${goal._id}|${column}`];
      return { achieved: cell?.achieved ?? 0, target: cell?.target ?? 0 };
    }
    const entry = entries[entryKey(goal._id, goal.interval, column)];
    return {
      achieved: entry?.achieved ?? 0,
      target: entry?.target ?? (Number(goal.defaultTarget) || 0),
    };
  };

  if (!goals || goals.length === 0 || columns.length === 0) return null;

  const dense = columns.length > 14;
  const gridTemplate = `minmax(112px, 1.3fr) repeat(${columns.length}, minmax(14px, 1fr)) 44px`;

  const renderRow = (goal) => {
    let hit = 0;

    const cellNodes = columns.map((column, index) => {
      const { achieved, target } = valueFor(goal, column);
      const state = progressState(achieved, target, goal.trackingMode);
      if (target > 0 && achieved >= target) hit += 1;

      // Fill height carries the same information as colour, so the row can be
      // read without relying on telling vermilion from brass.
      const ratio = target > 0 ? Math.min(1, achieved / target) : achieved > 0 ? 1 : 0;

      return (
        <Box
          key={column}
          role="img"
          aria-label={`${goal.task}, ${columnTitle(interval, column)}: ${achieved} of ${target}`}
          title={`${columnTitle(interval, column)} — ${achieved}/${target}`}
          sx={{
            position: "relative",
            height: 22,
            bgcolor: "chart.empty",
            opacity: state === "empty" ? 0.22 : 1,
            // A bar line opens each new bar, exactly as it does in a score.
            borderLeft: startsBar(interval, column, index) ? "1px solid" : "none",
            borderColor: "chart.rule",
          }}
        >
          {ratio > 0 && (
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: `${Math.max(12, ratio * 100)}%`,
                bgcolor: stateColor(chart, state),
              }}
            />
          )}
          {state === "over" && (
            <Box
              sx={{
                position: "absolute",
                top: 2,
                left: "50%",
                width: 2,
                height: 4,
                ml: "-1px",
                bgcolor: "chart.ink",
              }}
            />
          )}
        </Box>
      );
    });

    return (
      <Box key={goal._id} sx={{ display: "grid", gridTemplateColumns: gridTemplate, alignItems: "center", gap: "2px", mb: "2px" }}>
        {/* Only a button when there is somewhere to go. Pinned left so the row
            stays identifiable once a long stave is scrolled. */}
        <Box
          component={onOpenGoal ? "button" : "span"}
          type={onOpenGoal ? "button" : undefined}
          onClick={onOpenGoal ? () => onOpenGoal(goal) : undefined}
          title={goal.task}
          sx={{
            position: "sticky",
            left: 0,
            zIndex: 2,
            bgcolor: "background.default",
            textAlign: "left",
            border: 0,
            cursor: onOpenGoal ? "pointer" : "default",
            p: 0,
            pr: 3,
            minHeight: 28,
            display: "flex",
            alignItems: "center",
            color: "text.primary",
            fontFamily: "inherit",
            fontSize: "0.8125rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            ...(onOpenGoal ? { "&:hover": { color: chart.vermilion } } : {}),
          }}
        >
          {goal.task}
        </Box>
        {cellNodes}
        {/* The practice chart's total per line. Pinned right so it survives the
            scroll on a long stave — a total you have to scroll to find is not
            doing its job. */}
        <Typography
          variant="overline"
          align="right"
          sx={{
            position: "sticky",
            right: 0,
            zIndex: 2,
            bgcolor: "background.default",
            borderLeft: "1px solid",
            borderColor: "divider",
            color: hit === columns.length ? "chart.brass" : "text.secondary",
            pl: 2,
            lineHeight: "22px",
          }}
        >
          {hit}/{columns.length}
        </Typography>
      </Box>
    );
  };

  return (
    <Box component="section" sx={{ mb: 12 }}>
      <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
        Across the {{ yearly: "years", monthly: "months" }[interval] || "days"}
      </Typography>
      <Box sx={{ height: 2, bgcolor: "divider", mb: 5 }} />

      {/* Wide content scrolls inside its own box; the page never scrolls sideways. */}
      <Box sx={{ overflowX: "auto", pb: 2, mx: -2, px: 2 }}>
        <Box sx={{ minWidth: dense ? columns.length * 18 + 200 : "100%" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: gridTemplate, alignItems: "center", gap: "2px", mb: 2 }}>
            <Box sx={{ position: "sticky", left: 0, zIndex: 2, bgcolor: "background.default" }} />
            {columns.map((key, index) => (
              <Typography
                key={key}
                variant="overline"
                align="center"
                sx={{
                  color: "text.secondary",
                  fontSize: dense ? "0.5625rem" : "0.6875rem",
                  lineHeight: 1,
                  borderLeft: startsBar(interval, key, index) ? "1px solid" : "none",
                  borderColor: "chart.rule",
                }}
              >
                {columnLabel(interval, key, columns.length)}
              </Typography>
            ))}
            <Typography
              variant="overline"
              align="right"
              sx={{
                position: "sticky",
                right: 0,
                zIndex: 2,
                bgcolor: "background.default",
                borderLeft: "1px solid",
                borderColor: "divider",
                color: "text.secondary",
                pl: 2,
              }}
            >
              hit
            </Typography>
          </Box>

          {rows.map((group) => (
            <Box key={group.category || "all"} sx={{ mb: group.category ? 5 : 0 }}>
              {group.category && (
                <>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                      mb: 1,
                      mt: 2,
                      // Rides along with the pinned label column.
                      position: "sticky",
                      left: 0,
                      width: "fit-content",
                      bgcolor: "background.default",
                      pr: 2,
                    }}
                  >
                    {group.category}
                  </Typography>
                  <Box sx={{ height: 1, bgcolor: "divider", mb: 2 }} />
                </>
              )}
              {group.goals.map(renderRow)}
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 5, mt: 4, flexWrap: "wrap" }}>
        {[
          ["partial", "in progress"],
          ["complete", "target reached"],
          ["over", "past target"],
        ].map(([state, label]) => (
          <Box key={state} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 12, height: 12, bgcolor: stateColor(chart, state) }} />
            <Typography variant="overline" sx={{ color: "text.secondary" }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
