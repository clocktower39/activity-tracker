import React from "react";
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
import { makeStyles } from "@mui/styles";
import { updateActivityProgress } from "../../Redux/actions";

const useStyles = makeStyles({
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
});

export default function GoalTracker(props) {
  const classes = useStyles();
  let currentDayStats = props.goal.history.filter((day) => day.date === props.selectedDate)[0];

  if (currentDayStats === undefined) {
    currentDayStats = {
      date: props.selectedDate,
      targetPerDuration: Number(props.goal.defaultTarget),
      achieved: 0,
    };
  }
  let circularProgressPercent = Number(
    (currentDayStats.achieved / currentDayStats.targetPerDuration) * 100
  );

  if (circularProgressPercent > 100) {
    circularProgressPercent = 100;
  } else if (circularProgressPercent < 0) {
    circularProgressPercent = 0;
  }
  const dispatch = useDispatch();

  const handleActivityUpdate = (taskIndex, newAchieved) => {
    dispatch(updateActivityProgress(taskIndex, newAchieved, props.selectedDate));
  };

  const onClick = () => {
    handleActivityUpdate(props.index, 1);
  };

  const onLongPress = () => {
    if (currentDayStats.achieved - 1 >= 0) {
      handleActivityUpdate(props.index, -1);
    }
  };

  const defaultOptions = {
    shouldPreventDefault: true,
    delay: 1000,
  };
  const longPressEvent = useLongPress(onLongPress, onClick, defaultOptions);

  return props.goal.category === props.category ? (
    <Grid container item xs={3}>
      <Grid container item xs={12} className={classes.goalContent}>
        <IconButton {...longPressEvent}>
          <Box position="relative" display="inline-flex" alignItems={"center"}>
            <CircularProgress
              variant="determinate"
              sx={{
                color: (theme) => theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
              }}
              size={60}
              thickness={5}
              value={100}
            />
            <CircularProgress
              variant="determinate"
              disableShrink
              value={circularProgressPercent === 0 ? -0 : circularProgressPercent}
              sx={{
                color: (theme) => (theme.palette.mode === "light" ? "#1a90ff" : "#308fe8"),
                animationDuration: "550ms",
                position: "absolute",
                left: 0,
                [`& .${circularProgressClasses.circle}`]: {
                  strokeLinecap: "round",
                },
              }}
              size={60}
              thickness={5}
              style={
                circularProgressPercent <= 0
                  ? { color: "#ccc" }
                  : circularProgressPercent < 34
                  ? { color: "red" }
                  : circularProgressPercent < 51
                  ? { color: "yellow" }
                  : { color: "green" }
              }
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
              <Typography variant="overline" component="div" className={classes.CircularPercent}>
                {props.toggleAchievedView?(`${Math.round(
                  Number((currentDayStats.achieved / currentDayStats.targetPerDuration) * 100)
                )}%`):currentDayStats.achieved}
              </Typography>
            </Box>
          </Box>
        </IconButton>
      </Grid>
      <Grid container item xs={12} className={classes.goalContent}>
        <Typography variant="body2" align="center" className={classes.CircularProgressLabel}>
          {props.goal.task}
        </Typography>
      </Grid>
    </Grid>
  ) : (
    <></>
  );
}
