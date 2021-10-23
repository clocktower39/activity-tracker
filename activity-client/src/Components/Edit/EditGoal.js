import React, { useState } from "react";
import { useDispatch } from 'react-redux';
import { Button, Grid, TextField, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { EditActivity } from "../../Redux/actions";

const useStyles = makeStyles({
    Button:{
        color: '#ffffff',
    },
    TextField: {
      borderBottomColor: '#ccc',
      "& input": {
        color: "#ccc",
      },
      "& label": {
        color: "#ccc",
      },
      "& label.Mui-focused": {
        color: "#ccc",
      },
      "& .MuiOutlinedInput-root": {
        "&.Mui-focused fieldset": {
          borderColor: "#ccc",
        },
      },
      "& .MuiInput-underline:before": {
        borderBottomColor: "white",
      },
      "& .MuiInput-underline:after": {
        borderBottomColor: "white",
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
        <Grid container item xs={12} className={classes.root}>
            <Grid item xs={3} ><TextField className={classes.TextField} value={task} onChange={(e)=>handleChange(e, setTask)} /></Grid>
            <Grid item xs={3} ><TextField className={classes.TextField} value={category} onChange={(e)=>handleChange(e, setCategory)} /></Grid>
            <Grid item xs={3} ><TextField className={classes.TextField} value={defaultTarget} onChange={(e)=>handleChange(e, setDefaultTarget)} /></Grid>
            <Grid item xs={3} ><Button className={classes.Button} onClick={toggleEditMode}>Save</Button></Grid>
        </Grid>
    ):(
        <Grid container item xs={12} className={classes.root}>
            <Grid item xs={3} ><Typography variant="body1">{props.goal.task}</Typography></Grid>
            <Grid item xs={3} ><Typography variant="body1">{props.goal.category}</Typography></Grid>
            <Grid item xs={3} ><Typography variant="body1">{props.goal.defaultTarget}</Typography></Grid>
            <Grid item xs={3} ><Button className={classes.Button} onClick={toggleEditMode}>Edit</Button></Grid>
        </Grid>
    )
}
