import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
  Paper,
} from "@material-ui/core";
import { AddCircle, RemoveCircle } from "@material-ui/icons";
import { updateActivity } from "../../Redux/actions";
import LogItem from "./LogItem";

export const Log = (props) => {
  const goals = useSelector((state) => state.goals);
  let categories = [];

  goals.forEach((goal) => {
    if (!categories.includes(goal.category)) {
      categories.push(goal.category);
    }
  });

  const dispatch = useDispatch();
  const handleActivityUpdate = (taskIndex, newAchieved) => {
    dispatch(updateActivity(taskIndex, newAchieved));
  };

  return (
    <Grid container justify="center">
      {categories.map((category) => {
        return (
          <Grid container item xs={12} justify={"center"}>
            <Grid item xs={12}>
              <Typography variant="body2">{category}</Typography>
            </Grid>
            {goals.map((goal, index) => {
                let circularProgressPercent = Number(
                    (goal.IconButtonachieved / goal.targetPerDuration) * 100
                );
                if (circularProgressPercent > 100) {
                    circularProgressPercent = 100;
                } else if (circularProgressPercent < 0) {
                    circularProgressPercent = 0;
                }
              return goal.category === category ? (
                <Grid item xs={2}>
                  <IconButton
              onClick={() =>
                goal.achieved > 0
                  ? handleActivityUpdate(index, goal.achieved - 1)
                  : null
              }
            >
              <RemoveCircle />
            </IconButton>
            <Box
              position="relative"
              display="inline-flex"
              alignItems={"center"}
            >
              <CircularProgress
                variant="determinate"
                value={circularProgressPercent}
                size={50}
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
                    Number(
                      (goal.achieved / goal.targetPerDuration) * 100
                    )
                  )}%`}
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={() =>
                handleActivityUpdate(index, goal.achieved + 1)
              }
            >
              <AddCircle />
            </IconButton>
            <Typography variant={"caption"}>
              {goal.achieved}/{goal.targetPerDuration}
            </Typography>
                </Grid>
                
              ) : (
                <></>
              );
            })}
          </Grid>
        );
      })}

      {/* {goals.map((goal, index) => <LogItem goal={goal} achieved={goal.achieved} index={index} key={index} />)} */}
    </Grid>
  );
};

export default Log;
