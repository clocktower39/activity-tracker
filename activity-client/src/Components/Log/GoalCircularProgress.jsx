import React, { useState, useEffect } from "react";
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
import dayjs from "dayjs";
import { updateActivityProgress } from "../../Redux/actions";
import GoalDetails from "./GoalDetails";

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
  const dispatch = useDispatch();
  const { category, goal, selectedDate, toggleAchievedView, categories, history } = props;
  const [openDialog, setOpenDialog] = useState(false);

  // Local history to manage optimistic updates
  const [localHistory, setLocalHistory] = useState(goal.history);

  useEffect(() => {
    // Sync local history with Redux state whenever goal.history changes
    setLocalHistory(history);
  }, [history]);

  // Find the current day's stats
  const currentDayStats = localHistory.find(
    (day) => dayjs(day.date).add(1, "day").format("YYYY-MM-DD") === selectedDate
  ) ||
    localHistory.find((day) => dayjs(day.date).format("YYYY-MM-DD") === selectedDate) || {
      date: selectedDate,
      targetPerDuration: Number(goal.defaultTarget),
      achieved: 0,
    };

  // Calculate progress percentage
  const progressPercent = Math.max(
    (currentDayStats.achieved / currentDayStats.targetPerDuration) * 100,
    0
  );

  const handleActivityUpdate = (newAchieved) => {
    // Optimistically update the local history
    setLocalHistory((prevHistory) => {
      const updatedHistory = [...prevHistory];
      const existingEntryIndex = updatedHistory.findIndex(
        (day) => dayjs(day.date).add(1, "day").format("YYYY-MM-DD") === selectedDate
      );

      if (existingEntryIndex !== -1) {
        // Update existing entry
        updatedHistory[existingEntryIndex] = {
          ...updatedHistory[existingEntryIndex],
          achieved: updatedHistory[existingEntryIndex].achieved + newAchieved,
        };
      } else {
        // Add new entry
        updatedHistory.push({
          date: selectedDate,
          targetPerDuration: Number(goal.defaultTarget),
          achieved: newAchieved,
        });
      }

      return updatedHistory;
    });

    // Dispatch Redux action to update the global state
    dispatch(updateActivityProgress(goal._id, newAchieved, selectedDate)).then((res) => {
      setLocalHistory((prevHistory) => {
        console.log("ran")
        const updatedHistory = [...prevHistory];
        const existingEntryIndex = updatedHistory.findIndex(
          (day) => dayjs(day.date).format("YYYY-MM-DD") === selectedDate
        );
  
        if (existingEntryIndex !== -1) {
          console.log("found")
          // Update existing entry
          updatedHistory[existingEntryIndex] = {
            ...res.historyItem,
          };
        }
  
        return updatedHistory;
      });
    });
  };

  const onLongPress = () => {
    setOpenDialog(true);
  };

  const addAchieved = () => {
    handleActivityUpdate(1);
  };

  const removeAchieved = () => {
    if (currentDayStats.achieved - 1 >= 0) {
      handleActivityUpdate(-1);
    }
  };

  const defaultOptions = {
    shouldPreventDefault: true,
    delay: 1000,
  };
  const longPressEvent = useLongPress(onLongPress, addAchieved, defaultOptions);

  return (
    goal.category === category && (
      <>
        <Grid container item xs={3}>
          <Grid container item xs={12} sx={classes.goalContent}>
            <IconButton {...longPressEvent}>
              <Box position="relative" display="inline-flex" alignItems={"center"}>
                <CircularProgress
                  variant="determinate"
                  color={
                    progressPercent <= 100
                      ? "grey"
                      : progressPercent <= 200
                      ? "success"
                      : "secondary"
                  }
                  size={60}
                  thickness={5}
                  value={100}
                  sx={{ animationDuration: "0ms" }}
                />
                <CircularProgress
                  variant="determinate"
                  value={
                    progressPercent > 200
                      ? progressPercent - 200
                      : progressPercent > 100
                      ? progressPercent - 100
                      : progressPercent
                  }
                  color={
                    progressPercent <= 0
                      ? "grey"
                      : progressPercent <= 34
                      ? "error"
                      : progressPercent < 51
                      ? "warning"
                      : progressPercent <= 100
                      ? "success"
                      : "primary"
                  }
                  sx={{
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
                    {toggleAchievedView
                      ? `${Math.round(progressPercent)}%`
                      : currentDayStats.achieved}
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
        <GoalDetails
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
          goal={goal}
          stats={currentDayStats}
          addAchieved={addAchieved}
          removeAchieved={removeAchieved}
          progressPercent={progressPercent}
          categories={categories}
          selectedDate={selectedDate}
        />
      </>
    )
  );
}
