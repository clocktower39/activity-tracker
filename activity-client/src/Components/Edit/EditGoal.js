import React, { useState } from "react";
import { useDispatch } from 'react-redux';
import { Button, Grid, TextField, Typography } from "@material-ui/core";
import { EditActivity } from "../../Redux/actions";

export default function EditGoal(props) {
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
        <Grid container item xs={12}>
            <Grid item xs={3} ><TextField value={task} onChange={(e)=>handleChange(e, setTask)} /></Grid>
            <Grid item xs={3} ><TextField value={category} onChange={(e)=>handleChange(e, setCategory)} /></Grid>
            <Grid item xs={3} ><TextField value={defaultTarget} onChange={(e)=>handleChange(e, setDefaultTarget)} /></Grid>
            <Grid item xs={3} ><Button onClick={toggleEditMode}>Save</Button></Grid>
        </Grid>
    ):(
        <Grid container item xs={12}>
            <Grid item xs={3} ><Typography variant="body1">{props.goal.task}</Typography></Grid>
            <Grid item xs={3} ><Typography variant="body1">{props.goal.category}</Typography></Grid>
            <Grid item xs={3} ><Typography variant="body1">{props.goal.defaultTarget}</Typography></Grid>
            <Grid item xs={3} ><Button onClick={toggleEditMode}>Edit</Button></Grid>
        </Grid>
    )
}
