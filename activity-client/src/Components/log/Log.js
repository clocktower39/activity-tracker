import React, { useState } from "react";
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
  const dateToISOLikeButLocal = (date) => {
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const msLocal =  date.getTime() - offsetMs;
    const dateLocal = new Date(msLocal);
    const iso = dateLocal.toISOString();
    const isoLocal = iso.slice(0, 19);
    return isoLocal;
}

  const [selectedDate, setSelectedDate] = useState(dateToISOLikeButLocal(new Date()).substr(0,10));

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

          defaultValue={selectedDate}
          className={classes.textField}
          onChange={(e)=> setSelectedDate(e.target.value)}
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
                  selectedDate={selectedDate}
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
