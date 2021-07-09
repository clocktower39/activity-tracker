import React from "react";
import useLongPress from '../../Hooks/useLongPress';
import { useDispatch } from "react-redux";
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
} from "@material-ui/core";
import { updateActivityProgress } from "../../Redux/actions";

export default function GoalTracker(props) {

  let currentDayStats = props.goal.history.filter(day => day.date === props.selectedDate)[0];

  if (currentDayStats === undefined) {
    currentDayStats = {
      date: props.selectedDate,
      targetPerDuration: Number(props.goal.defaultTarget),
      achieved: 0,
    }
  }
  let circularProgressPercent = Number(
    (currentDayStats.achieved / currentDayStats.targetPerDuration) * 100
  )


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
    handleActivityUpdate(props.index, 1)
  }

  const onLongPress = () => {
    if (currentDayStats.achieved - 1 >= 0) {
      handleActivityUpdate(props.index, -1)
    }
  };

  const defaultOptions = {
    shouldPreventDefault: true,
    delay: 1000,
  };
  const longPressEvent = useLongPress(onLongPress, onClick, defaultOptions);

  return props.goal.category === props.category ? (
    <Grid container item xs={3}>
      <Grid container item xs={12} justify="center">
        <IconButton
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
        <Typography variant="body2" style={{ fontSize: "12px" }}>
          {props.goal.task}
        </Typography>
      </Grid>
    </Grid>
  ) : (
    <></>
  );
}
