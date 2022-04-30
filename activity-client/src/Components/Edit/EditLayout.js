import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, Divider, Grid, Button, Paper, TextField } from "@mui/material";
import EditGoal from "./EditGoal";
import { AddNewActivity } from "../../Redux/actions";

const classes = {
  root: {
    height: "100%",
    marginTop: "25px",
    paddingBottom: "75px",
    color: "white",
    backgroundColor: "#303030",
  },
};

export default function EditLayout() {
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
    setSearch(e.target.value);
  };

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
      <Grid
        container
        component={Paper}
        className={classes.root}
        sx={{  }}
      >
        <Grid container item xs={12} sx={{ padding: "12.5px", justifyContent: "center" }}>
          <Grid item xs={12} sm={6} container>
            <TextField label="Search" value={search} fullWidth onChange={handleSearch} />
          </Grid>
        </Grid>
        {goals.map((goal, index) =>
          new RegExp(search, "i").test(goal.task) ? (
            <EditGoal goal={goal} index={index} key={`EditLayout-${index}`} />
          ) : null
        )}

        <Grid container item xs={6} sm={4} sx={{ padding: "15px 0px", justifyContent: "center" }}>
          <Grid
            container
            item
            xs={10}
            spacing={1}
            sx={{ border: "1px solid", borderRadius: "5px", justifyContent: "center" }}
          >
            <Grid item xs={12} container sx={{ justifyContent: "center", alignContent: "center" }}>
              <TextField
                label="Task"
                value={newTask}
                onChange={(e) => handleNewEntryFields(e, setNewTask)}
              />
            </Grid>
            <Grid item xs={12} container sx={{ justifyContent: "center", alignContent: "center" }}>
              <Divider sx={{ borderColor: "rgba(255, 255, 255, .2)", width: "60%" }} />
            </Grid>
            <Grid item xs={12} container sx={{ justifyContent: "center", alignContent: "center" }}>
              <TextField
                label="Category"
                value={newCategory}
                onChange={(e) => handleNewEntryFields(e, setNewCategory)}
              />
            </Grid>
            <Grid item xs={12} container sx={{ justifyContent: "center", alignContent: "center" }}>
              <Divider sx={{ borderColor: "rgba(255, 255, 255, .2)", width: "45%" }} />
            </Grid>
            <Grid item xs={12} container sx={{ justifyContent: "center", alignContent: "center" }}>
              <TextField
                label="Target"
                value={newTarget}
                onChange={(e) => handleNewEntryFields(e, setNewTarget)}
              />
            </Grid>
            <Grid item xs={12} container sx={{ justifyContent: "center", alignContent: "center" }}>
              <Divider sx={{ borderColor: "rgba(255, 255, 255, .2)", width: "30%" }} />
            </Grid>
            <Grid item xs={12} container sx={{ justifyContent: "center", alignContent: "center" }}>
              <Button onClick={handleAddClick}>
                Add
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
