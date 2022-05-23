import React, { useState } from "react";
import useLongPress from "../../Hooks/useLongPress";
import { useDispatch } from "react-redux";
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
  circularProgressClasses,
} from "@mui/material";
import { updateActivityProgress } from "../../Redux/actions";
import GoalDetails from './GoalDetails';

const classes = {
  root: {},
  CircularPercent: {
    fontSize: "16px",
  },
  CircularProgressLabel: {
    fontSize: "13px",
  },
  goalContent: {
    justifyContent: "center",
  },
};

export default function GoalCircularProgress(props) {
  const { category, goal, selectedDate, index, toggleAchievedView, categories } = props;
  const [openDialog, setOpenDialog] = useState(false);

  let currentDayStats = goal.history.filter((day) => day.date === selectedDate)[0];

  if (currentDayStats === undefined) {
    currentDayStats = {
      date: selectedDate,
      targetPerDuration: Number(goal.defaultTarget),
      achieved: 0,
    };
  }
  let progressPercent = Number(
    (currentDayStats.achieved / currentDayStats.targetPerDuration) * 100
  );

  if (progressPercent < 0) {
    progressPercent = 0;
  }
  const dispatch = useDispatch();

  const handleActivityUpdate = (taskIndex, newAchieved) => {
    dispatch(updateActivityProgress(taskIndex, newAchieved, selectedDate));
  };

  const onLongPress = () => {
    setOpenDialog(true)
  };

  const addAchieved = () => {
    handleActivityUpdate(index, 1);
  }

  const removeAchieved = () => {
    if (currentDayStats.achieved - 1 >= 0) {
      handleActivityUpdate(index, -1);
    }
  }

  const defaultOptions = {
    shouldPreventDefault: true,
    delay: 1000,
  };
  const longPressEvent = useLongPress(onLongPress, addAchieved, defaultOptions);

  return goal.category === category && (
    <>
      <Grid container item xs={3}>
        <Grid container item xs={12} sx={classes.goalContent}>
          <IconButton {...longPressEvent}>
            <Box position="relative" display="inline-flex" alignItems={"center"}>
              <CircularProgress
                variant="determinate"
                sx={{
                  color: (theme) => progressPercent <= 100 ? "#ccc" : progressPercent <= 200 ? "#388e3c" : "#0288d1",
                }}
                size={60}
                thickness={5}
                value={100}
              />
              <CircularProgress
                variant="determinate"
                value={progressPercent > 200 ? progressPercent - 200 :progressPercent > 100 ? progressPercent - 100 : progressPercent}
                sx={{
                  color: (theme) => (progressPercent <= 0 ? "#ccc" : progressPercent < 34 ? "#d32f2f" : progressPercent < 51 ? "#f57c00" : progressPercent <= 100 ? "#388e3c" : "#0288d1"),
                  animationDuration: "550ms",
                  position: "absolute",
                  left: 0,
                  [`& .${circularProgressClasses.circle}`]: {
                    strokeLinecap: "round",
                  },
                }}
                size={60}
                thickness={5}
              />
              <Box
                top={0}
                left={0}
                bottom={0}
                right={0}
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Typography variant="overline" component="div" sx={classes.CircularPercent}>
                  {toggleAchievedView ? (`${Math.round(
                    Number((currentDayStats.achieved / currentDayStats.targetPerDuration) * 100)
                  )}%`) : currentDayStats.achieved}
                </Typography>
              </Box>
            </Box>
          </IconButton>
        </Grid>
        <Grid container item xs={12} sx={classes.goalContent}>
          <Typography variant="body2" align="center" sx={classes.CircularProgressLabel}>
            {goal.task}
          </Typography>
        </Grid>
      </Grid>
      <GoalDetails openDialog={openDialog} setOpenDialog={setOpenDialog} goal={goal} stats={currentDayStats} addAchieved={addAchieved} removeAchieved={removeAchieved} progressPercent={progressPercent} categories={categories} selectedDate={selectedDate} />
    </>
  );
}
