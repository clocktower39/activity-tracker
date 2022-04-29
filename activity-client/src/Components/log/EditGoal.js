import React, { useState } from 'react'
import { Button, Drawer, Grid, TextField } from '@mui/material';

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
    }
}

export default function EditGoal({ goal, openDrawer, setOpenDrawer }) {
    const [task, setTask] = useState(goal.task);
    const [interval, setInterval] = useState(goal.interval);
    const [targetPerDuration, setTargetPerDuration] = useState(goal.defaultTarget);
    const [category, setCategory] = useState(goal.category);

    const handleChange = (e, setter) => setter(e.target.value);

    const onDrawerClose = (e) => setOpenDrawer(false);

    return (
        <Drawer
            anchor='bottom'
            open={openDrawer}
            onClose={onDrawerClose}
            sx={{ zIndex: 1300 }}
        >
            <Grid container spacing={1} sx={{ padding: '12.5px 0' }}>
                <Grid container item sx={classes.GridCC}><TextField label="Task" onChange={(e) => handleChange(e, setTask)} value={task} sx={classes.TextField} /></Grid>
                <Grid container item sx={classes.GridCC}><TextField label="Interval" onChange={(e) => handleChange(e, setInterval)} value={interval} sx={classes.TextField} /></Grid>
                <Grid container item sx={classes.GridCC}><TextField label="Goal per Interval" onChange={(e) => handleChange(e, setTargetPerDuration)} value={targetPerDuration} sx={classes.TextField} /></Grid>
                <Grid container item sx={classes.GridCC}><TextField label="Category" onChange={(e) => handleChange(e, setCategory)} value={category} sx={classes.TextField} /></Grid>
                <Grid container item xs={12} spacing={1} sx={classes.GridCC}>
                    <Grid item ><Button variant="contained">Delete</Button></Grid>
                    <Grid item ><Button variant="contained">Save</Button></Grid>
                </Grid>

            </Grid>
        </Drawer>
    )
}
