import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Container, Typography } from "@mui/material";
import TempoLine from "../components/TempoLine";
import Ring from "../components/Ring";
import GoalSheet from "../components/GoalSheet";
import Stave from "../components/Stave";
import EmptyState from "../components/EmptyState";
import { selectGoalsStatus, selectVisibleGoals } from "../features/goals/goalsSlice";
import {
  fetchMatrix,
  fetchRange,
  recordProgress,
  selectMatrix,
} from "../features/history/historySlice";
import { useAutoFetch } from "../hooks/useAutoFetch";
import { useTodayKey } from "../hooks/useTodayKey";
import {
  addPeriods,
  dayjs,
  eachPeriod,
  entryKey,
  getPeriodKey,
  getPeriodStart,
  isFutureKey,
  periodLabel,
  todayKey,
} from "../lib/periods";

const NOUN = { weekly: "week", monthly: "month", yearly: "year" };

/**
 * One cadence, two halves.
 *
 * Above: goals kept at this cadence, as rings — the same gesture as Today.
 * Below: the stave, every finer-grained goal laid across the period.
 *
 * Week and Month lay days across the period and read the cached rows directly.
 * A year of days would be thousands of rows, so Year lays months across the
 * period and reads a server-side goal x month rollup instead.
 */
export default function PeriodView({ interval }) {
  const dispatch = useDispatch();
  const goals = useSelector(selectVisibleGoals);
  const goalsStatus = useSelector(selectGoalsStatus);
  const entries = useSelector((state) => state.history.entries);
  const errors = useSelector((state) => state.history.errors);
  const pending = useSelector((state) => state.history.pending);

  const today = useTodayKey();
  const [anchor, setAnchor] = useState(todayKey);
  const [openGoal, setOpenGoal] = useState(null);

  const periodStart = getPeriodStart(interval, anchor);
  const periodKey = periodStart.format("YYYY-MM-DD");
  const isYear = interval === "yearly";
  const innerInterval = isYear ? "monthly" : "daily";

  const bounds = useMemo(() => {
    const to = addPeriods(interval, periodStart, 1).subtract(1, "day").format("YYYY-MM-DD");
    return { from: periodKey, to };
  }, [interval, periodKey, periodStart]);

  // Week and Month want the raw rows; Year wants the rollup. Asking for both
  // would defeat the point of the rollup.
  useAutoFetch(() => {
    if (isYear) {
      dispatch(fetchMatrix({ ...bounds, bucket: "month" }));
      // Yearly goals themselves are few, and their rows feed the rings above.
      dispatch(fetchRange({ ...bounds, interval: "yearly" }));
    } else {
      dispatch(fetchRange(bounds));
    }
  }, [bounds.from, bounds.to, isYear]);

  const matrixRows = useSelector(selectMatrix("month", bounds.from, bounds.to));

  const columns = useMemo(
    () => eachPeriod(innerInterval, bounds.from, bounds.to).map((d) => d.format("YYYY-MM-DD")),
    [innerInterval, bounds.from, bounds.to]
  );

  /** "goalId|columnKey" -> { achieved, target }, for the Year stave. */
  const matrixCells = useMemo(() => {
    if (!isYear || !matrixRows) return null;
    const out = {};
    matrixRows.forEach((row) => {
      const key = `${row.goalId}|${dayjs.utc(row.periodStart).format("YYYY-MM-DD")}`;
      out[key] = { achieved: row.achieved, target: row.target };
    });
    return out;
  }, [isYear, matrixRows]);

  const cadenceGoals = useMemo(
    () => goals.filter((goal) => goal.interval === interval),
    [goals, interval]
  );

  // Year shows every finer cadence; Week and Month show the daily goals whose
  // periods line up with their day columns.
  const staveGoals = useMemo(
    () =>
      goals.filter((goal) =>
        isYear ? goal.interval !== "yearly" : goal.interval === "daily" || goal.interval === "none"
      ),
    [goals, isYear]
  );

  const staveGroups = useMemo(() => {
    const map = new Map();
    staveGoals.forEach((goal) => {
      const key = goal.category || "Uncategorised";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(goal);
    });
    return [...map.entries()].map(([category, items]) => ({ category, goals: items }));
  }, [staveGoals]);

  const totals = useMemo(() => {
    let achieved = 0;
    let target = 0;

    cadenceGoals.forEach((goal) => {
      const entry = entries[entryKey(goal._id, goal.interval, periodKey)];
      achieved += entry?.achieved ?? 0;
      target += entry?.target ?? (Number(goal.defaultTarget) || 0);
    });

    if (isYear) {
      (matrixRows || []).forEach((row) => {
        achieved += row.achieved;
        target += row.target;
      });
    } else {
      staveGoals.forEach((goal) => {
        columns.forEach((column) => {
          const entry = entries[entryKey(goal._id, goal.interval, column)];
          achieved += entry?.achieved ?? 0;
          target += entry?.target ?? (Number(goal.defaultTarget) || 0);
        });
      });
    }
    return { achieved, target };
  }, [cadenceGoals, staveGoals, entries, periodKey, columns, isYear, matrixRows]);

  const shift = useCallback(
    (count) =>
      setAnchor((prev) =>
        addPeriods(interval, getPeriodStart(interval, prev), count).format("YYYY-MM-DD")
      ),
    [interval]
  );

  const isCurrent = periodKey === getPeriodKey(interval, today);
  const inFuture = isFutureKey(periodKey);
  const nothingToShow = cadenceGoals.length === 0 && staveGoals.length === 0;

  return (
    <>
      <TempoLine
        sublabel={isCurrent ? `This ${NOUN[interval]}` : inFuture ? "Ahead" : "Looking back"}
        label={periodLabel(interval, periodKey)}
        achieved={totals.achieved}
        target={totals.target}
        onPrevious={() => shift(-1)}
        onNext={() => shift(1)}
        previousLabel={`Previous ${NOUN[interval]}`}
        nextLabel={`Next ${NOUN[interval]}`}
        // Nothing has been recorded past the current period, so stop there.
        nextDisabled={isCurrent}
        onToday={() => setAnchor(today)}
        todayDisabled={isCurrent}
      />

      <Container maxWidth="md">
        {goalsStatus === "ready" && nothingToShow && (
          <EmptyState
            title="Nothing to show for this cadence yet"
            body="Add a goal, or change an existing one's cadence, and it will appear here."
          />
        )}

        {cadenceGoals.length > 0 && (
          <Box component="section" sx={{ mb: 12 }}>
            <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
              Kept by the {NOUN[interval]}
            </Typography>
            <Box sx={{ height: 2, bgcolor: "divider", mb: 6 }} />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(auto-fill, minmax(100px, 1fr))",
                  sm: "repeat(auto-fill, minmax(124px, 1fr))",
                },
                gap: 6,
                justifyItems: "center",
              }}
            >
              {cadenceGoals.map((goal) => {
                const key = entryKey(goal._id, goal.interval, periodKey);
                const entry = entries[key];
                return (
                  <Ring
                    key={goal._id}
                    goal={goal}
                    achieved={entry?.achieved ?? 0}
                    target={entry?.target ?? (Number(goal.defaultTarget) || 0)}
                    pending={Boolean(pending[key])}
                    error={errors[key] || null}
                    onIncrement={() => dispatch(recordProgress({ goal, date: periodKey, delta: 1 }))}
                    onOpen={() => setOpenGoal(goal)}
                  />
                );
              })}
            </Box>
          </Box>
        )}

        {staveGoals.length > 0 && (
          <Stave
            goals={staveGoals}
            groups={staveGroups}
            columns={columns}
            interval={innerInterval}
            cells={matrixCells}
            onOpenGoal={setOpenGoal}
          />
        )}
      </Container>

      <GoalSheet goal={openGoal} date={periodKey} onClose={() => setOpenGoal(null)} />
    </>
  );
}
