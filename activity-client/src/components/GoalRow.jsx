import { memo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Typography } from "@mui/material";
import Ring from "./Ring";
import { recordProgress } from "../features/history/historySlice";
import { entryKey } from "../lib/periods";

/**
 * One category: a rule, its name, and the rings beneath it.
 *
 * Categories are introduced by a hairline and a label, never wrapped in a card —
 * the rule is the structural device throughout this world.
 */
function GoalRow({ category, goals, date, loading, onOpenGoal }) {
  const dispatch = useDispatch();
  const entries = useSelector((state) => state.history.entries);
  const errors = useSelector((state) => state.history.errors);
  const pending = useSelector((state) => state.history.pending);

  const increment = useCallback(
    (goal) => dispatch(recordProgress({ goal, date, delta: 1 })),
    [dispatch, date]
  );

  const totals = goals.reduce(
    (acc, goal) => {
      const entry = entries[entryKey(goal._id, goal.interval, date)];
      acc.achieved += entry?.achieved ?? 0;
      acc.target += entry?.target ?? (Number(goal.defaultTarget) || 0);
      return acc;
    },
    { achieved: 0, target: 0 }
  );

  const percent = totals.target > 0 ? Math.min(100, (totals.achieved / totals.target) * 100) : 0;

  return (
    <Box component="section" sx={{ mb: 10 }} aria-label={category}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 3, mb: 1 }}>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          {category}
        </Typography>
        <Typography
          variant="overline"
          sx={{ color: percent >= 100 ? "chart.brass" : "text.secondary", ml: "auto" }}
        >
          {totals.achieved}/{totals.target}
        </Typography>
      </Box>

      {/* The rule doubles as this category's progress: it fills as you work. */}
      <Box sx={{ position: "relative", height: 2, bgcolor: "divider", mb: 6 }}>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: percent >= 100 ? "chart.brass" : "chart.vermilion",
            // Scaled rather than resized: animating width lays out the row on
            // every frame, and this fills while rings are being tapped.
            transformOrigin: "left center",
            transform: `scaleX(${percent / 100})`,
            transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(auto-fill, minmax(100px, 1fr))",
            sm: "repeat(auto-fill, minmax(124px, 1fr))",
          },
          gap: 6,
          justifyItems: "center",
          opacity: loading ? 0.5 : 1,
          transition: "opacity 160ms linear",
        }}
      >
        {goals.map((goal) => {
          const key = entryKey(goal._id, goal.interval, date);
          const entry = entries[key];
          return (
            <Ring
              key={goal._id}
              goal={goal}
              achieved={entry?.achieved ?? 0}
              target={entry?.target ?? (Number(goal.defaultTarget) || 0)}
              pending={Boolean(pending[key])}
              error={errors[key] || null}
              onIncrement={() => increment(goal)}
              onOpen={() => onOpenGoal(goal)}
            />
          );
        })}
      </Box>
    </Box>
  );
}

export default memo(GoalRow);
