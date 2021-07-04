import React from "react";
import { useSelector } from "react-redux";
import { Grid, Paper, TextField, Typography, makeStyles } from "@material-ui/core";
import GoalTracker from "./GoalTracker";

const useStyles = makeStyles({
  root: {
    paddingBottom: '56px',
  },
  Paper: {
    width: "100%",
    margin: "12.5px",
  },
  categoryBackground: {
    backgroundColor: '#f3f3f3',
    width: '100%',
    height: '100%',
    padding: '15px',
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
    <Grid container justify="center" className={classes.root}>
      <Grid item xs={12} container justify="center">
        <TextField
          id="date"
          label="Date"
          type="date"

          //late in day will show tomorrow due to timezone, need to fix later
          defaultValue={new Date().toISOString().substr(0,10)}
          className={classes.textField}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>
      {categories.map((category, i) => {
        return (
          <Paper variant="outlined" className={classes.Paper}>
            <Grid
              container
              item
              xs={12}
              justify={"center"}
              key={`${category}-${i}`}
            >
              <Grid item xs={12} className={classes.categoryBackground} >
                <Typography variant="h6">{category}</Typography>
              </Grid>
              {goals.map((goal, index) => (
                <GoalTracker
                  key={`${goal.task}-${index}`}
                  goal={goal}
                  index={index}
                  category={category}
                />
              ))}
            </Grid>
          </Paper>
        );
      })}
    </Grid>
  );
};

export default Log;
