import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Grid, IconButton, TextField, Typography } from "@material-ui/core";
import EditGoal from './EditGoal';
import { AddCircle } from '@material-ui/icons';
import { AddNewActivity } from "../../Redux/actions";

export default function EditLayout() {
    const dispatch = useDispatch();
    const goals = useSelector(state => state.goals);
    const [newTask, setNewTask] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newTarget, setNewTarget] = useState('');

    const handleNewEntryFields = (e, setter) => {
        setter(e.target.value);
    }

    const handleAddClick = () => {
        dispatch(AddNewActivity({
            task: newTask,
            category: newCategory,
            defaultTarget: newTarget
        }))
    }

    return (
        <div>
            <Grid container >
                <Grid container item xs={12}>
                        <Grid item xs={3} ><Typography variant="h6" >Task</Typography></Grid>
                        <Grid item xs={3} ><Typography variant="h6" >Category</Typography></Grid>
                        <Grid item xs={3} ><Typography variant="h6" >Target</Typography></Grid>
                        <Grid item xs={3} ><Typography variant="h6" ></Typography></Grid>
                </Grid>
                {goals.map((goal, index) => <EditGoal goal={goal} index={index} />)}

                <Grid container item xs={12}>
                    <Grid item xs={3} ><TextField label="Task" value={newTask} onChange={(e)=>handleNewEntryFields(e, setNewTask)} fullWidth/></Grid>
                    <Grid item xs={3} ><TextField label="Category" value={newCategory} onChange={(e)=>handleNewEntryFields(e, setNewCategory)} fullWidth/></Grid>
                    <Grid item xs={3} ><TextField label="Target" value={newTarget} onChange={(e)=>handleNewEntryFields(e, setNewTarget)} fullWidth/></Grid>
                    <Grid item xs={3} ><IconButton onClick={handleAddClick}><AddCircle /></IconButton></Grid>
                </Grid>
            </Grid>
        </div>
    )
}
