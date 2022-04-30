import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { Autocomplete, Button, Drawer, Grid, TextField } from '@mui/material';
import { EditActivity } from "../../Redux/actions";

const classes = {
    GridCC: { justifyContent: 'center', alignItems: 'center', },
    TextField: {
        "& input": {
            color: "black",
        },
        "& label": {
            color: "black",
        },
        "& label.Mui-focused": {
            color: "black",
        },
        "& .MuiOutlinedInput-root": {
            "&.Mui-focused fieldset": {
                borderColor: "black",
            },
        },
        "& .MuiInput-underline:before": {
            borderBottomColor: "black",
        },
        "& .MuiInput-underline:after": {
            borderBottomColor: "black",
        },
        "& .MuiNativeSelect-select": {
            color: 'black',
        },
        "& .MuiNativeSelect-select option": {
            color: 'black',
        },
        "& .MuiSvgIcon-root": {
            color: 'black',
        },
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: 'black',
        },
        "& .MuiOutlinedInput-notchedOutline:hover": {
            borderColor: 'black',
        }
    },
}

export default function EditGoal({ goal, openDrawer, setOpenDrawer, categories }) {
    const dispatch = useDispatch();
    const [task, setTask] = useState(goal.task);
    const [interval, setInterval] = useState(goal.interval);
    const [defaultTarget, setDefaultTarget] = useState(goal.defaultTarget);
    const [category, setCategory] = useState(goal.category);

    const handleChange = (e, setter) => setter(e.target.value);

    const onDrawerClose = (e) => setOpenDrawer(false);

    const saveChanges = () => {
        if (task !== '' && category !== '' && defaultTarget !== '') {
            console.log("goal")
            console.log(goal._id)
            dispatch(EditActivity(goal._id, {
                task,
                category,
                defaultTarget,
            }))
        }
    }

    const intervalOptions = [
        'Daily',
        'Weekly',
        'Monthly',
        'Yearly',
    ];

    return (
        <Drawer
            anchor='bottom'
            open={openDrawer}
            onClose={onDrawerClose}
            sx={{ zIndex: 1300 }}
        >
            <Grid container spacing={1} sx={{ padding: '12.5px 0' }}>
                <Grid container item sx={classes.GridCC}><TextField label="Task" onChange={(e) => handleChange(e, setTask)} value={task} sx={classes.TextField} /></Grid>
                <Grid container item sx={classes.GridCC}>
                    <Autocomplete
                        value={interval}
                        options={intervalOptions}
                        onChange={(e, getTagProps) => setInterval(getTagProps)}
                        renderInput={(params) => <TextField sx={{ ...classes.TextField, width: 227 }} {...params} label="Interval" />}
                    />
                </Grid>
                <Grid container item sx={classes.GridCC}><TextField label="Goal per Interval" onChange={(e) => handleChange(e, setDefaultTarget)} value={defaultTarget} sx={classes.TextField} /></Grid>
                <Grid container item sx={classes.GridCC}>
                    <Autocomplete
                        value={category}
                        options={categories}
                        onChange={(e, getTagProps) => setCategory(getTagProps)}
                        renderInput={(params) => <TextField sx={{ ...classes.TextField, width: 227 }} {...params} label="Category" />}
                    />
                </Grid>
                <Grid container item xs={12} spacing={1} sx={classes.GridCC}>
                    <Grid item ><Button variant="contained">Delete</Button></Grid>
                    <Grid item ><Button variant="contained" onClick={saveChanges}>Save</Button></Grid>
                </Grid>

            </Grid>
        </Drawer>
    )
}
