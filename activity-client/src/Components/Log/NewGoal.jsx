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
import { AddNewActivity } from "../../Redux/actions";
import { INTERVAL_OPTIONS } from "../../utils/intervals";

export default function NewGoal({ categories, setToggleNewTaskView }) {
  const dispatch = useDispatch();
  const [task, setTask] = useState("");
  const [interval, setInterval] = useState(null);
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState("");

  const handleChange = (e, setter) => setter(e.target.value);

  const handleNewActivitySubmit = () => {
    if (task !== "" && interval?.value && goal !== "" && category !== "" && order !== "") {
      dispatch(AddNewActivity({
        task,
        interval: interval.value,
        defaultTarget: goal,
        category,
        order
      }))
      setTask("");
      setGoal("");
      setCategory("");
      setOrder("");
      setInterval(null);
      setToggleNewTaskView(false);
    }
  }

  return (
    <Grid container >
      <Grid container size={12}>
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setToggleNewTaskView(false)}
              aria-label="close"
            >
              <Close />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              New Goal
            </Typography>
            <Button autoFocus color="inherit" onClick={handleNewActivitySubmit}>
              Add
            </Button>
          </Toolbar>
        </AppBar>
      </Grid>
      <Grid container size={12} spacing={1} sx={{ padding: "15px" }}>
        <Grid container size={12} spacing={1}>
          <Grid container size={12}>
            <TextField
              fullWidth
              label="Task"
              value={task}
              onChange={(e) => handleChange(e, setTask)}
            />
          </Grid>
          <Grid container size={12}>
            <Autocomplete
              fullWidth
              value={category}
              options={categories.map((c) => c.category)}
              onChange={(e, getTagProps) => setCategory(getTagProps)}
              renderInput={(params) => <TextField {...params} label="Category" />}
            />
          </Grid>
          <Grid container size={12}>
            <Autocomplete
              fullWidth
              value={interval}
              options={INTERVAL_OPTIONS}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              onChange={(e, option) => setInterval(option)}
              renderInput={(params) => <TextField {...params} label="Interval" />}
            />
          </Grid>
          <Grid container size={12}>
            <TextField
              fullWidth
              label="Goal per Interval"
              value={goal}
              onChange={(e) => handleChange(e, setGoal)}
            />
          </Grid>
          <Grid container size={12}>
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
