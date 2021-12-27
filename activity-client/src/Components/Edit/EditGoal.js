import React, { useState } from "react";
import { useDispatch } from 'react-redux';
import { Button, Divider, Grid, TextField, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { EditActivity } from "../../Redux/actions";

const useStyles = makeStyles({
    root: {
      padding: '15px 15px 0px 15px',
    },
    Button:{
        color: '#000',
    },
    TextField: {
      borderBottomColor: '#000',
      "& input": {
        color: "#000",
      },
      "& label": {
        color: "#000",
      },
      "& label.Mui-focused": {
        color: "#000",
      },
      "& .MuiOutlinedInput-root": {
        "&.Mui-focused fieldset": {
          borderColor: "#000",
        },
      },
      "& .MuiInput-underline:before": {
        borderBottomColor: "#000",
      },
      "& .MuiInput-underline:after": {
        borderBottomColor: "#000",
      },
    },
})

export default function EditGoal(props) {
    const classes = useStyles();
    const dispatch = useDispatch();
    const [editMode, setEditMode] = useState(false);
    const [task, setTask] = useState(props.goal.task);
    const [category, setCategory] = useState(props.goal.category);
    const [defaultTarget, setDefaultTarget] = useState(props.goal.defaultTarget);

    const handleChange = (e, setter) => {
        setter(e.target.value);
    }

    const toggleEditMode = () => {
        editMode?dispatch(EditActivity(props.index, {
            task,
            category,
            defaultTarget
        })).then(()=>setEditMode(!editMode)):setEditMode(!editMode);
    }

    return editMode?(
      <>
        <Grid container item xs={12} className={classes.root}>
            <Grid item xs={4} ><TextField className={classes.TextField} value={task} onChange={(e)=>handleChange(e, setTask)} /></Grid>
            <Grid item xs={4} ><TextField className={classes.TextField} value={category} onChange={(e)=>handleChange(e, setCategory)} /></Grid>
            <Grid item xs={2} ><TextField className={classes.TextField} value={defaultTarget} onChange={(e)=>handleChange(e, setDefaultTarget)} /></Grid>
            <Grid item xs={2} ><Button className={classes.Button} onClick={toggleEditMode}>Save</Button></Grid>
        </Grid>
        <Grid item xs={12} style={{padding: "7.5px"}}><Divider /></Grid>
      </>
    ):(
      <>
        <Grid container item xs={12} className={classes.root}>
            <Grid item xs={4} ><Typography variant="body1">{props.goal.task}</Typography></Grid>
            <Grid item xs={4} ><Typography variant="body1">{props.goal.category}</Typography></Grid>
            <Grid item xs={2} ><Typography variant="body1">{props.goal.defaultTarget}</Typography></Grid>
            <Grid item xs={2} ><Button className={classes.Button} onClick={toggleEditMode}>Edit</Button></Grid>
        </Grid>
        <Grid item xs={12} style={{padding: "7.5px"}}><Divider /></Grid>
      </>
    )
}
