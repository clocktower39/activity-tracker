import React from "react";
import {  useSelector } from "react-redux";
import {
  Grid,
  Paper,
  Typography,
  makeStyles
} from "@material-ui/core";
import GoalTracker from './GoalTracker';

const useStyles = makeStyles({
  Paper:{
    width: '100%',
    padding: '12.5px',
  }
});

export const Log = () => {
  const classes = useStyles();
  const goals = useSelector((state) => state.goals);

  let categories = [];

  goals.forEach((goal) => {
    if (!categories.includes(goal.category)) {
      categories.push(goal.category);
    }
  });

  return (
    <Grid container justify="center">
      {categories.map((category, i) => {
        return (
          <Paper variant="outlined" className={classes.Paper}>
            <Grid container item xs={12} justify={"center"} key={`${category}-${i}`} >
              <Grid item xs={12}>
                <Typography variant="h6">{category}</Typography>
              </Grid>
              {goals.map((goal, index) => <GoalTracker key={`${goal.task}-${index}`} goal={goal} index={index} category={category}/>)}
            </Grid>
          </Paper>
        );
      })}
    </Grid>
  );
};

export default Log;
