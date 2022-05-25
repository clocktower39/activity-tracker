import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  AppBar,
  Autocomplete,
  Button,
  IconButton,
  Grid,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { EditActivity } from "../../Redux/actions";

export default function EditGoal({ goal, setToggleEditTaskView, categories }) {
  const dispatch = useDispatch();
  const [task, setTask] = useState(goal.task);
  const [interval, setInterval] = useState(goal.interval);
  const [defaultTarget, setDefaultTarget] = useState(goal.defaultTarget);
  const [category, setCategory] = useState(goal.category);
  const [order, setOrder] = useState(goal.order);

  const handleChange = (e, setter) => setter(e.target.value);

  const saveChanges = () => {
    if (task !== "" && category !== "" && defaultTarget !== "") {
      dispatch(
        EditActivity(goal._id, {
          task,
          category,
          defaultTarget,
          order,
        })
      );
    }
  };

  const intervalOptions = ["Daily", "Weekly", "Monthly", "Yearly"];

  return (
    <Grid container >
      <Grid container item xs={12}>
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setToggleEditTaskView(false)}
              aria-label="close"
            >
              <Close />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Edit: {goal.task}
            </Typography>
            <Button autoFocus color="inherit" onClick={saveChanges}>
              Save
            </Button>
          </Toolbar>
        </AppBar>
      </Grid>
      <Grid container item xs={12} spacing={1} sx={{ padding: "15px" }}>
        <Grid container item xs={12} spacing={1}>
          <Grid container item xs={12}>
            <TextField
              fullWidth
              label="Task"
              value={task}
              onChange={(e) => handleChange(e, setTask)}
            />
          </Grid>
          <Grid container item xs={12}>
            <Autocomplete
              fullWidth
              value={category}
              options={categories.map((c) => c.category)}
              onChange={(e, getTagProps) => setCategory(getTagProps)}
              renderInput={(params) => <TextField {...params} label="Category" />}
            />
          </Grid>
          <Grid container item xs={12}>
            <Autocomplete
              fullWidth
              value={interval}
              options={intervalOptions}
              onChange={(e, getTagProps) => setInterval(getTagProps)}
              renderInput={(params) => <TextField {...params} label="Interval" />}
            />
          </Grid>
          <Grid container item xs={12}>
            <TextField
              fullWidth
              label="Goal per Interval"
              value={defaultTarget}
              onChange={(e) => handleChange(e, setDefaultTarget)}
            />
          </Grid>
          <Grid container item xs={12}>
            <TextField
              fullWidth
              label="Order"
              value={order}
              onChange={(e) => handleChange(e, setOrder)}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
