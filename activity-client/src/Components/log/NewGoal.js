import React, { useState } from "react";
import { AppBar, Button, IconButton, Grid, TextField, Toolbar, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";

export default function NewGoal({ setToggleNewTaskView }) {
  const [task, setTask] = useState("");
  const [interval, setInterval] = useState("");
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState("");

  const handleChange = (e, setter) => setter(e.target.value);

  return (
    <Grid container sx={{ backgroundColor: "#303030" }}>
      <Grid container item xs={12}>
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
            <Button autoFocus color="inherit" onClick={() => setToggleNewTaskView(false)}>
              Add
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
            <TextField
              fullWidth
              label="Interval"
              value={interval}
              onChange={(e) => handleChange(e, setInterval)}
            />
          </Grid>
          <Grid container item xs={12}>
            <TextField
              fullWidth
              label="Goal"
              value={goal}
              onChange={(e) => handleChange(e, setGoal)}
            />
          </Grid>
          <Grid container item xs={12}>
            <TextField
              fullWidth
              label="Category"
              value={category}
              onChange={(e) => handleChange(e, setCategory)}
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
