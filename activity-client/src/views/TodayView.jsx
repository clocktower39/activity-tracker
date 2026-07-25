import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Container, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TempoLine from "../components/TempoLine";
import GoalRow from "../components/GoalRow";
import GoalSheet from "../components/GoalSheet";
import GoalFormDialog from "../components/GoalFormDialog";
import EmptyState from "../components/EmptyState";
import { selectGoalsStatus, selectGroupedGoals } from "../features/goals/goalsSlice";
import { fetchDate, selectDateStatus } from "../features/history/historySlice";
import { dayjs, entryKey, periodLabel, todayKey } from "../lib/periods";
import { useAutoFetch } from "../hooks/useAutoFetch";

export default function TodayView() {
  const dispatch = useDispatch();
  const groups = useSelector(selectGroupedGoals);
  const goalsStatus = useSelector(selectGoalsStatus);

  const [date, setDate] = useState(todayKey);
  const [openGoal, setOpenGoal] = useState(null);
  const [showNewGoal, setShowNewGoal] = useState(false);

  const dateStatus = useSelector(selectDateStatus(date));
  const entries = useSelector((state) => state.history.entries);

  // Cached: revisiting a date the session has already seen costs no request.
  useAutoFetch(() => dispatch(fetchDate(date)), [date]);

  const shift = useCallback((days) => {
    setDate((prev) => dayjs.utc(prev).add(days, "day").format("YYYY-MM-DD"));
  }, []);

  const totals = useMemo(() => {
    let achieved = 0;
    let target = 0;
    groups.forEach((group) => {
      group.goals.forEach((goal) => {
        const entry = entries[entryKey(goal._id, goal.interval, date)];
        achieved += entry?.achieved ?? 0;
        target += entry?.target ?? (Number(goal.defaultTarget) || 0);
      });
    });
    return { achieved, target };
  }, [groups, entries, date]);

  const isToday = date === todayKey();
  const hasGoals = groups.length > 0;

  return (
    <>
      <TempoLine
        sublabel={isToday ? "Today" : dayjs.utc(date).isAfter(dayjs.utc()) ? "Ahead" : "Looking back"}
        label={periodLabel("daily", date)}
        achieved={totals.achieved}
        target={totals.target}
        onPrevious={() => shift(-1)}
        onNext={() => shift(1)}
        previousLabel="Previous day"
        nextLabel="Next day"
        // Nothing has been recorded tomorrow, so there is nowhere to page to.
        nextDisabled={isToday}
        onToday={() => setDate(todayKey())}
        todayDisabled={isToday}
      />

      <Container maxWidth="md">
        {goalsStatus === "loading" && <SkeletonChart />}

        {goalsStatus === "error" && (
          <EmptyState
            title="Couldn't load your goals"
            body="The server didn't answer. Your recorded progress is safe."
            actionLabel="Try again"
            onAction={() => window.location.reload()}
          />
        )}

        {goalsStatus === "ready" && !hasGoals && (
          <EmptyState
            title="Nothing to practise yet"
            body="Add your first goal and it will appear here every day, waiting for a tap."
            actionLabel="Add a goal"
            onAction={() => setShowNewGoal(true)}
          />
        )}

        {goalsStatus === "ready" &&
          groups.map((group) => (
            <GoalRow
              key={group.category}
              category={group.category}
              goals={group.goals}
              date={date}
              loading={dateStatus === "loading"}
              onOpenGoal={setOpenGoal}
            />
          ))}

        {goalsStatus === "ready" && hasGoals && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setShowNewGoal(true)}
              sx={{ color: "text.secondary" }}
            >
              Add a goal
            </Button>
          </Box>
        )}

        {dateStatus === "error" && (
          <Typography variant="body2" sx={{ color: "chart.vermilion", textAlign: "center", mt: 6 }}>
            Couldn&apos;t load this day&apos;s progress. The counts below may be out of date.
          </Typography>
        )}
      </Container>

      <GoalSheet goal={openGoal} date={date} onClose={() => setOpenGoal(null)} />
      <GoalFormDialog open={showNewGoal} onClose={() => setShowNewGoal(false)} />
    </>
  );
}

/** Skeleton at the real geometry, so nothing jumps when data lands. */
function SkeletonChart() {
  return (
    <Box aria-hidden sx={{ opacity: 0.4 }}>
      {[0, 1].map((group) => (
        <Box key={group} sx={{ mb: 10 }}>
          <Box sx={{ height: 1, bgcolor: "divider", mb: 4 }} />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[0, 1, 2, 3].map((item) => (
              <Box
                key={item}
                sx={{
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  border: "1px solid",
                  borderColor: "chart.empty",
                }}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
