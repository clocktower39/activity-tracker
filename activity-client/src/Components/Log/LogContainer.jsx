import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getActivities } from "../../Redux/actions";
import { Navigate } from "react-router";
import {
  Button,
  Container,
  Dialog,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack, ArrowForward, AddCircle, FilterList, Category, Flaky } from "@mui/icons-material";
import GoalCircularProgress from "./GoalCircularProgress";
import Categories from "./EditCategories";
import NewGoal from "./NewGoal";
import dayjs from "dayjs";

// ----- Styles (MUI sx objects) -------------------------------------------------
const sx = {
  root: { paddingTop: "25px", paddingBottom: "56px", justifyContent: "center" },
  dateRow: { justifyContent: "center", alignItems: "center", gap: 2 },
  paper: { width: "100%", m: "12.5px", p: 0 },
  categoryHeader: {
    bgcolor: "background.categoryBackground",
    width: "100%",
    p: "15px",
    borderRadius: "5px",
  },
  goalsContainer: {
    justifyContent: "center",
    bgcolor: "background.goalContainer",
    borderRadius: "4px",
  },
  toolbar: {
    justifyContent: "center",
    alignItems: "center",
    gap: 1,
    mb: 1,
  },
};

// Utility: best‑effort match for off‑by‑one UTC shifts in legacy data
const matchesSelectedDate = (isoOrDate, selectedYYYYMMDD) => {
  const d = dayjs(isoOrDate);
  return (
    d.format("YYYY-MM-DD") === selectedYYYYMMDD ||
    d.add(1, "day").format("YYYY-MM-DD") === selectedYYYYMMDD
  );
};

export default function LogContainer() {
  const dispatch = useDispatch();

  // ----- Redux state -----
  const goals = useSelector((state) => state.goals || []);
  const user = useSelector((state) => state.user);
  const categories = useSelector((state) => state.categories || []);

  // ----- Local UI state -----
  const [showAchieved, setShowAchieved] = useState(true);
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false);
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);
  const [sortByCategory, setSortByCategory] = useState(true);
  const [loading, setLoading] = useState(true);

  // Default date = today (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => dayjs().format("YYYY-MM-DD"));

  // Fetch activities when date changes (keeps the original +1 day behavior for legacy UTC)
  useEffect(() => {
    dispatch(getActivities(dayjs(selectedDate).add(1, "day").format("YYYY-MM-DD")));
  }, [dispatch, selectedDate]);

  // ----- Handlers -----
  const handleSelectedDateChange = useCallback((e) => {
    const value = e?.target?.value;
    if (value) setSelectedDate(value);
  }, []);

  const changeDate = useCallback((deltaDays) => {
    setSelectedDate((prev) => dayjs(prev).add(deltaDays, "day").format("YYYY-MM-DD"));
  }, []);

  const toggleSort = useCallback(() => setSortByCategory((p) => !p), []);

  // ----- Derived data ----------------------------------------------------------
  const visibleGoals = useMemo(() => goals.filter((g) => !g.hidden), [goals]);

  const perGoalStatsToday = useMemo(() => {
    return visibleGoals.map((goal) => {
      // find match for selected day in this goal's history
      const match = (goal.history || []).find((h) => matchesSelectedDate(h.date, selectedDate));
      const fallback = {
        date: selectedDate,
        targetPerDuration: goal.defaultTarget ?? 0,
        achieved: 0,
      };
      return {
        goalId: goal._id,
        task: goal.task,
        category: goal.category,
        defaultTarget: goal.defaultTarget ?? 0,
        stats: match || fallback,
      };
    });
  }, [visibleGoals, selectedDate]);

  const categoryTotals = useMemo(() => {
    // { [category]: { achieved: number, target: number } }
    return perGoalStatsToday.reduce((acc, g) => {
      const key = g.category || "Uncategorized";
      if (!acc[key]) acc[key] = { achieved: 0, target: 0 };
      acc[key].achieved += Number(g.stats.achieved || 0);
      acc[key].target += Number(g.stats.targetPerDuration || 0);
      return acc;
    }, {});
  }, [perGoalStatsToday]);

  const getCategoryProgress = useCallback(
    (cat) => {
      const t = categoryTotals[cat];
      if (!t || !t.target) return 0;
      return Math.min(100, Math.max(0, (t.achieved / t.target) * 100));
    },
    [categoryTotals, selectedDate]
  );

  const allProgress = useMemo(() => {
    const totals = Object.values(categoryTotals).reduce(
      (acc, t) => ({ achieved: acc.achieved + t.achieved, target: acc.target + t.target }),
      { achieved: 0, target: 0 }
    );
    if (!totals.target) return 0;
    return Math.min(100, Math.max(0, (totals.achieved / totals.target) * 100));
  }, [categoryTotals, selectedDate]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [categories]
  );

  const goalsSortedByOrder = useMemo(
    () => [...visibleGoals].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [visibleGoals]
  );

  const goalsSortedByTask = useMemo(
    () => [...visibleGoals].sort((a, b) => (a.task || "").localeCompare(b.task || "")),
    [visibleGoals]
  );

  // ----- Guards -----
  if (!user) return <Navigate to={{ pathname: "/login" }} />;

  // ----- Render ----------------------------------------------------------------
  return (
    <Container maxWidth="md">
      <Grid container sx={sx.root}>
        {/* Date controls */}
        <Grid container size={12} sx={sx.dateRow}>
          <Button onClick={() => changeDate(-1)} aria-label="Previous day">
            <ArrowBack color="action" />
          </Button>
          <TextField
            id="date"
            label="Date"
            type="date"
            variant="standard"
            value={selectedDate}
            onChange={handleSelectedDateChange}
            InputLabelProps={{ shrink: true }}
          />
          <Button onClick={() => changeDate(1)} aria-label="Next day">
            <ArrowForward color="action" />
          </Button>
        </Grid>

        {/* Dialogs */}
        <Dialog open={showCategoriesDialog} onClose={() => setShowCategoriesDialog(false)}>
          <Categories categories={categories} setToggleCategoryView={setShowCategoriesDialog} />
        </Dialog>
        <Dialog open={showNewGoalDialog} onClose={() => setShowNewGoalDialog(false)}>
          <NewGoal categories={categories} setToggleNewTaskView={setShowNewGoalDialog} />
        </Dialog>

        {/* Toolbar */}
        <Grid container size={12} sx={sx.toolbar}>
          <IconButton size="large" onClick={toggleSort} aria-label="Toggle sort">
            <FilterList color="action" />
          </IconButton>
          <IconButton size="large" onClick={() => setShowCategoriesDialog((p) => !p)} aria-label="Edit categories">
            <Category color="action" />
          </IconButton>
          <IconButton size="large" onClick={() => setShowNewGoalDialog((p) => !p)} aria-label="Add goal">
            <AddCircle color="action" />
          </IconButton>
          <IconButton size="large" onClick={() => setShowAchieved((p) => !p)} aria-label="Toggle achieved view">
            <Flaky color="action" />
          </IconButton>
        </Grid>

        {/* Content */}
        {sortByCategory ? (
          // Grouped by category
          sortedCategories.map((cat) => {
            const percent = getCategoryProgress(cat.category);
            const goalsInCat = goalsSortedByOrder.filter((g) => g.category === cat.category);
            if (goalsInCat.length === 0) return null;
            return (
              <Paper variant="outlined" sx={sx.paper} key={`cat-${cat.category}`}>
                <Grid container size={12} sx={sx.goalsContainer}>
                  <Grid size={12} sx={sx.categoryHeader}>
                    <Typography variant="h6">{cat.category}</Typography>
                    <LinearProgress variant="determinate" value={Number.isFinite(percent) ? percent : 0} />
                  </Grid>

                  {goalsInCat.map((goal, index) => (
                    <GoalCircularProgress
                      key={goal._id || `${goal.task}-${index}`}
                      goal={goal}
                      history={goal.history}
                      index={index}
                      category={cat.category}
                      selectedDate={selectedDate}
                      toggleAchievedView={showAchieved}
                      categories={categories}
                    />
                  ))}
                </Grid>
              </Paper>
            );
          })
        ) : (
          // Flat list (alphabetical)
          <Paper variant="outlined" sx={sx.paper}>
            <Grid container size={12} sx={sx.goalsContainer}>
              <Grid size={12} sx={sx.categoryHeader}>
                <Typography variant="h6">All</Typography>
                <LinearProgress variant="determinate" value={allProgress} />
              </Grid>

              {goalsSortedByTask.map((goal, index) => (
                <GoalCircularProgress
                  key={goal._id || `${goal.task}-${index}`}
                  goal={goal}
                  history={goal.history}
                  index={index}
                  category={goal.category}
                  selectedDate={selectedDate}
                  toggleAchievedView={showAchieved}
                  categories={categories}
                />
              ))}
            </Grid>
          </Paper>
        )}
      </Grid>
    </Container>
  );
}
