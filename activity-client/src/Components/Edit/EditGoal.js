import React, { useState } from "react";
import { useDispatch } from 'react-redux';
import { Button, Divider, Grid, TextField, Typography } from '@mui/material';
import { EditActivity } from "../../Redux/actions";


export default function EditGoal(props) {
  const { goal } = props;
  const dispatch = useDispatch();
  const [editMode, setEditMode] = useState(false);
  const [task, setTask] = useState(goal.task);
  const [category, setCategory] = useState(goal.category);
  const [defaultTarget, setDefaultTarget] = useState(goal.defaultTarget);

  const handleChange = (e, setter) => {
    setter(e.target.value);
  }

  const toggleEditMode = () => {
    editMode ? dispatch(EditActivity(goal.task, {
      task,
      category,
      defaultTarget
    })).then(() => setEditMode(prev => !prev)) : setEditMode(prev => !prev);
  }

  return editMode ? (
    <>
      <Grid container item xs={6} sm={4} sx={{ padding: '15px 0px',justifyContent: 'center', }} >
        <Grid container item xs={10} spacing={1} sx={{ border: '1px solid', borderRadius: '5px', justifyContent: 'center',}} >
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center', }} ><TextField label="Task" value={task} onChange={(e) => handleChange(e, setTask)} /></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center', }}><Divider sx={{ borderColor: 'rgba(255, 255, 255, .2)', width: '60%', }} /></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center', }} ><TextField label="Category" value={category} onChange={(e) => handleChange(e, setCategory)} /></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center', }}><Divider sx={{ borderColor: 'rgba(255, 255, 255, .2)', width: '45%', }} /></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center', }} ><TextField label="Goal" value={defaultTarget} onChange={(e) => handleChange(e, setDefaultTarget)} /></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center', }}><Divider sx={{ borderColor: 'rgba(255, 255, 255, .2)', width: '30%', }} /></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center', }} ><Button onClick={toggleEditMode}>Save</Button></Grid>
        </Grid>
      </Grid>
    </>
  ) : (
    <>
      <Grid container item xs={6} sm={4} sx={{ padding: '15px 0px',justifyContent: 'center', }} >
        <Grid container item xs={10} spacing={1} sx={{ border: '1px solid', borderRadius: '5px', justifyContent: 'center',}} >
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center' }} ><Typography textAlign="center" variant="h5">{goal.task}</Typography></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center' }}><Divider sx={{ borderColor: 'rgba(255, 255, 255, .2)', width: '60%', }} /></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center' }} ><Typography textAlign="center" variant="body1">{goal.category}</Typography></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center' }}><Divider sx={{ borderColor: 'rgba(255, 255, 255, .2)', width: '45%', }} /></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center' }} ><Typography textAlign="center" variant="body2">{goal.defaultTarget}</Typography></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center' }}><Divider sx={{ borderColor: 'rgba(255, 255, 255, .2)', width: '30%', }} /></Grid>
          <Grid item xs={12} container sx={{ justifyContent: 'center', alignContent: 'center' }} ><Button onClick={toggleEditMode}>Edit</Button></Grid>
        </Grid>
      </Grid>
    </>
  )
}
