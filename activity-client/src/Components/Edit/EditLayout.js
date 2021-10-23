import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Grid, IconButton, TextField, Typography } from "@mui/material";
import { makeStyles } from '@mui/styles';
import EditGoal from './EditGoal';
import { AddCircle } from '@mui/icons-material';
import { AddNewActivity } from "../../Redux/actions";

const useStyles = makeStyles({
    root: {
        color: '#ffffff',
    },
    TableHead:{
        paddingBottom: '12.5px',
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

});

export default function EditLayout() {
    const classes = useStyles();
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
        })).then(()=>{
            setNewTask('');
            setNewCategory('');
            setNewTarget('');
        })
    }

    return (
        <div className={classes.root}>
            <Grid container >
                <Grid container item xs={12} className={classes.TableHead}>
                        <Grid item xs={3} ><Typography variant="h6" >Task</Typography></Grid>
                        <Grid item xs={3} ><Typography variant="h6" >Category</Typography></Grid>
                        <Grid item xs={3} ><Typography variant="h6" >Target</Typography></Grid>
                        <Grid item xs={3} ><Typography variant="h6" ></Typography></Grid>
                </Grid>
                {goals.map((goal, index) => <EditGoal goal={goal} index={index} />)}

                <Grid container item xs={12}>
                    <Grid item xs={3} ><TextField className={classes.TextField} label="Task" value={newTask} onChange={(e)=>handleNewEntryFields(e, setNewTask)} /></Grid>
                    <Grid item xs={3} ><TextField className={classes.TextField} label="Category" value={newCategory} onChange={(e)=>handleNewEntryFields(e, setNewCategory)} /></Grid>
                    <Grid item xs={3} ><TextField className={classes.TextField} label="Target" value={newTarget} onChange={(e)=>handleNewEntryFields(e, setNewTarget)} /></Grid>
                    <Grid item xs={3} ><IconButton onClick={handleAddClick}><AddCircle style={{color: '#ffffff'}} /></IconButton></Grid>
                </Grid>
            </Grid>
        </div>
    )
}
