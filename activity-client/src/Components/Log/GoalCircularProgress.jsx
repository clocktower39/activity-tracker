import React, { useState, useEffect, useMemo } from "react";
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
import GoalDetails from "./GoalDetails";
import { getPeriodKey } from "../../utils/intervals";

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

// Strict UTC day equality
const isSamePeriod = (interval, date, selectedDate) =>
  getPeriodKey(interval, date) === getPeriodKey(interval, selectedDate);

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
  
  // Find current day stats (UTC)
  const currentDayStats = useMemo(() => {
    const match = (localHistory || []).find((h) => isSamePeriod(goal.interval, h.date, selectedDate));
    return (
      match || {
        date: getPeriodKey(goal.interval, selectedDate),
        targetPerDuration: Number(goal.defaultTarget) || 0,
        achieved: 0,
      }
    );
  }, [localHistory, selectedDate, goal.defaultTarget, goal.interval]);

  // Progress percent
  const progressPercent = useMemo(() => {
    const target = Number(currentDayStats.targetPerDuration) || 0;
    const achieved = Number(currentDayStats.achieved) || 0;
    if (target <= 0) return 0;
    return Math.max(0, (achieved / target) * 100);
  }, [currentDayStats]);

  const handleActivityUpdate = (newAchieved) => {
    // Optimistically update the local history
    setLocalHistory((prevHistory) => {
      const updatedHistory = [...prevHistory];
      const existingEntryIndex = updatedHistory.findIndex(
        (day) => isSamePeriod(goal.interval, day.date, selectedDate)
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
          date: getPeriodKey(goal.interval, selectedDate),
          targetPerDuration: Number(goal.defaultTarget),
          achieved: newAchieved,
        });
      }

      return updatedHistory;
    });

    // Dispatch Redux action to update the global state
    dispatch(updateActivityProgress(goal._id, newAchieved, selectedDate)).then((res) => {
      setLocalHistory((prevHistory) => {
        const updatedHistory = [...prevHistory];
        const existingEntryIndex = updatedHistory.findIndex(
          (day) => isSamePeriod(goal.interval, day.date, selectedDate)
        );
  
        if (existingEntryIndex !== -1) {
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
        <Grid container size={3}>
          <Grid container size={12} sx={classes.goalContent}>
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
          <Grid container size={12} sx={classes.goalContent}>
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
