import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Grid, IconButton, Paper, TextField } from "@mui/material";
import { makeStyles } from "@mui/styles";
import EditGoal from "./EditGoal";
import { AddCircle } from "@mui/icons-material";
import { AddNewActivity } from "../../Redux/actions";

const useStyles = makeStyles({
  root: {
    height: "100%",
    marginTop: "25px",
    paddingBottom: "75px",
  },
});

export default function EditLayout() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const goals = useSelector((state) => state.goals);
  const [search, setSearch] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const handleNewEntryFields = (e, setter) => {
    setter(e.target.value);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value)
  }

  const handleAddClick = () => {
    dispatch(
      AddNewActivity({
        task: newTask,
        category: newCategory,
        defaultTarget: newTarget,
      })
    ).then(() => {
      setNewTask("");
      setNewCategory("");
      setNewTarget("");
    });
  };

  return (
    <Container maxWidth="md">
      <Grid container component={Paper} className={classes.root} sx={{ color: 'white', backgroundColor: '#303030',}} >
        <Grid container item xs={12} sx={{ padding: "12.5px", justifyContent: 'center',}}>
          <Grid item xs={12} sm={6} container>
            <TextField label="Search" value={search} fullWidth onChange={handleSearch} />
          </Grid>
        </Grid>
        {goals.map((goal, index) => new RegExp(search, 'i').test(goal.task)?<EditGoal goal={goal} index={index} key={`EditLayout-${index}`}/>:null)}

        <Grid container item xs={12} style={{padding: '15px 15px 0px 15px',}}>
          <Grid item xs={4}>
            <TextField
              className={classes.TextField}
              label="Task"
              value={newTask}
              onChange={(e) => handleNewEntryFields(e, setNewTask)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              className={classes.TextField}
              label="Category"
              value={newCategory}
              onChange={(e) => handleNewEntryFields(e, setNewCategory)}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              className={classes.TextField}
              label="Target"
              value={newTarget}
              onChange={(e) => handleNewEntryFields(e, setNewTarget)}
            />
          </Grid>
          <Grid item xs={1}>
            <IconButton onClick={handleAddClick}>
              <AddCircle />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
