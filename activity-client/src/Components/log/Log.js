import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Redirect } from "react-router-dom";
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
import GoalTracker from "./GoalTracker";
import Categories from "./Categories";
import NewGoal from "./NewGoal";

const classes = {
  root: {
    paddingTop: "25px",
    paddingBottom: "56px",
    justifyContent: "center",
  },
  dateContainer: {
    justifyContent: "center",
  },
  Paper: {
    width: "100%",
    margin: "12.5px",
    backgroundColor: "#303030",
    color: "#000000",
  },
  categoryBackground: {
    backgroundColor: "#1B1B1B",
    width: "100%",
    height: "100%",
    padding: "15px",
    borderRadius: "5px",
  },
  goalContainer: {
    justifyContent: "center",
    backgroundColor: "#303030",
    borderRadius: "4px",
  },
  ArrowButton: {
    color: "#fff",
  },
};

  // format a Date object like ISO
export const dateToISOLikeButLocal = (date) => {
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const msLocal = date.getTime() - offsetMs;
    const dateLocal = new Date(msLocal);
    const iso = dateLocal.toISOString();
    const isoLocal = iso.slice(0, 19);
    return isoLocal;
  };
  
  
export const adjustDays = (date, days) => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const Log = () => {
  const goals = useSelector((state) => state.goals);
  const user = useSelector((state) => state.user);
  const categories = useSelector((state) => state.categories);
  const [toggleAchievedView, setToggleAchievedView] = useState(true);
  const [toggleCategoryView, setToggleCategoryView] = useState(false);
  const [toggleNewTaskView, setToggleNewTaskView] = useState(false);

  // set the log date to today
  const [selectedDate, setSelectedDate] = useState(dateToISOLikeButLocal(new Date()).substr(0, 10));

  // handles when arrow buttons are clicked
  const changeDate = (change) => {
    let newDate = new Date(selectedDate).setDate(new Date(selectedDate).getDate() + change);
    setSelectedDate(new Date(newDate).toISOString().substr(0, 10));
  };

  // gathers daily history for calculating progress percentages
  let allGoalsStatsToday = goals
    .map((goal) => ({
      history: goal.history,
      category: goal.category,
      defaultTarget: goal.defaultTarget,
    }))
    .map((goal) => {
      // filteredHistory will return an array with a single object of the selected date
      const filteredHistory = goal.history.filter((day) => day.date === selectedDate)[0];
      // if filteredHistory is null, it will use the filler history
      const fillerHistory = {
        date: selectedDate,
        targetPerDuration: goal.defaultTarget,
        achieved: 0,
      };
      return {
        stats: filteredHistory ? filteredHistory : fillerHistory,
        category: goal.category,
        defaultTarget: goal.defaultTarget,
      };
    });

  let goalCategories = [];

  goals.forEach((goal) => {
    if (!goalCategories.includes(goal.category)) {
      goalCategories.push(goal.category);
    }
  });

  const getCategoryProgress = (c) => {
    let categoryHistory = allGoalsStatsToday.filter((goal) => goal.category === c);
    let achievedTotal = 0;
    let goalTotal = 0;

    categoryHistory.forEach((goal) => {
      achievedTotal += goal.stats.achieved;
      goalTotal += goal.stats.targetPerDuration;
    });

    return (achievedTotal / goalTotal) * 100;
  };

  return !user ? (
    <Redirect to={{ pathname: "/login" }} />
  ) : (
    <Container maxWidth="md">
      <Grid container sx={classes.root}>
        <Grid item xs={12} container sx={classes.dateContainer}>
          <Button onClick={() => changeDate(-1)} sx={classes.ArrowButton}>
            <ArrowBack sx={{ color: "#F9F9F9" }} />
          </Button>
          <TextField
            id="date"
            label="Date"
            type="date"
            variant="standard"
            value={selectedDate}
            sx={classes.TextField}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <Button onClick={() => changeDate(1)} sx={classes.ArrowButton}>
            <ArrowForward sx={{ color: "#F9F9F9" }} />
          </Button>
        </Grid>
        <Dialog open={toggleCategoryView} onClose={() => setToggleCategoryView(false)} >
          <Categories categories={categories} setToggleCategoryView={setToggleCategoryView}/>
        </Dialog>
        <Dialog open={toggleNewTaskView} onClose={() => setToggleNewTaskView(false)} >
          <NewGoal categories={categories} setToggleNewTaskView={setToggleNewTaskView}/>
        </Dialog>
        <Grid container item sx={{ justifyContent: 'center', alignItems: 'center', }}>
          <Grid item sx={{justifyContent: 'center', alignItems: 'center', }}>
            <IconButton color="primary" size="large" onClick={() => null} >
              <FilterList sx={{color: "#FFF"}} />
            </IconButton>
          </Grid>
          <Grid item sx={{justifyContent: 'center', alignItems: 'center', }}>
            <IconButton color="primary" size="large" onClick={() => setToggleCategoryView((prev) => !prev)} >
              <Category sx={{color: "#FFF"}} />
            </IconButton>
          </Grid>
          <Grid item sx={{justifyContent: 'center', alignItems: 'center', }}>
            <IconButton color="primary" size="large" onClick={() => setToggleNewTaskView((prev) => !prev)} >
              <AddCircle sx={{color: "#FFF"}} />
            </IconButton>
          </Grid>
          <Grid item sx={{justifyContent: 'center', alignItems: 'center', }}>
            <IconButton color="primary" size="large" onClick={() => setToggleAchievedView((prev) => !prev)} >
              <Flaky sx={{color: "#FFF"}} />
            </IconButton>
          </Grid>
        </Grid>
        {categories.sort((a, b) => a.order - b.order).map((category) => {
          let categoryPercent = getCategoryProgress(category.category);
          return (
            <Paper variant="outlined" sx={classes.Paper} key={category.category}>
              <Grid container item xs={12} sx={classes.goalContainer}>
                <Grid item xs={12} sx={classes.categoryBackground}>
                  <Typography variant="h6">{category.category}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={isNaN(categoryPercent) ? 0 : categoryPercent}
                  />
                </Grid>
                {goals.sort((a, b) => a.order - b.order).map((goal, index) => (
                  <GoalTracker
                    key={`${goal.task}-${index}`}
                    goal={goal}
                    index={index}
                    category={category.category}
                    selectedDate={selectedDate}
                    toggleAchievedView={toggleAchievedView}
                    categories={categories}
                  />
                ))}
              </Grid>
            </Paper>
          );
        })}
      </Grid>
    </Container>
  );
};

export default Log;
