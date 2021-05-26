import React from "react";
import {  useSelector } from "react-redux";
import {
  Grid,
  Typography,
} from "@material-ui/core";
import GoalTracker from './GoalTracker';

export const Log = () => {
  const goals = useSelector((state) => state.goals);

  let categories = [];

  goals.forEach((goal) => {
    if (!categories.includes(goal.category)) {
      categories.push(goal.category);
    }
  });

  return (
    <Grid container justify="center">
      {categories.map((category) => {
        return (
          <Grid container item xs={12} justify={"center"}>
            <Grid item xs={12}>
              <Typography variant="body2">{category}</Typography>
            </Grid>
            {goals.map((goal, index) => <GoalTracker goal={goal} index={index} category={category}/>)}
          </Grid>
        );
      })}
    </Grid>
  );
};

export default Log;
