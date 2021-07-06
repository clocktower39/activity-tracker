import React from "react";
import { useLongPress } from "react-use";
import { useDispatch } from "react-redux";
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
} from "@material-ui/core";
import { updateActivity } from "../../Redux/actions";

export default function GoalTracker(props) {

  let currentDayStats = props.goal.history.filter(day => day.date === props.selectedDate)[0];

  let circularProgressPercent = (currentDayStats === undefined)?
  currentDayStats = {
    date: props.selectedDate,
    targetPerDuration: 0,
    achieved: 0,
  }
  :Number(
    (currentDayStats.achieved / currentDayStats.targetPerDuration) * 100
  )


  if (circularProgressPercent > 100) {
    circularProgressPercent = 100;
  } else if (circularProgressPercent < 0) {
    circularProgressPercent = 0;
  }
  const dispatch = useDispatch();

  const handleActivityUpdate = (taskIndex, newAchieved) => {
    dispatch(updateActivity(taskIndex, newAchieved));
  };

  const onClick = () => {
    handleActivityUpdate(props.index, props.goal.achieved + 1)
  }

  const onLongPress = () => {
      if(props.goal.achieved - 1 > 0){
        handleActivityUpdate(props.index, props.goal.achieved - 2)
      }
  };

  const defaultOptions = {
    isPreventDefault: true,
    delay: 1000,
  };
  const longPressEvent = useLongPress(onLongPress, defaultOptions);

  return props.goal.category === props.category ? (
    <Grid container item xs={3}>
      <Grid container item xs={12} justify="center">
        <IconButton
          onMouseDownCapture={onClick}
          {...longPressEvent}
        >
          <Box position="relative" display="inline-flex" alignItems={"center"}>
            <CircularProgress
              variant="determinate"
              value={
                circularProgressPercent === 0 ? -0 : circularProgressPercent
              }
              size={50}
              style={
                circularProgressPercent <= 0
                  ? { color: "#ccc" }
                  : circularProgressPercent < 51
                  ? { color: "yellow" }
                  : { color: "green"}
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
              <Typography
                variant="caption"
                component="div"
                color="textSecondary"
              >
                {`${Math.round(
                  Number((currentDayStats.achieved / currentDayStats.targetPerDuration) * 100)
                )}%`}
              </Typography>
            </Box>
          </Box>
        </IconButton>
      </Grid>
      <Grid container item xs={12} justify="center">
        <Typography variant="body2" style={{ fontSize: "10px" }}>
          {props.goal.task}
        </Typography>
      </Grid>
    </Grid>
  ) : (
    <></>
  );
}
