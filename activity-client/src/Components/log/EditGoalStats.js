import React from 'react'
import { Dialog, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Typography } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

const classes = {
    DialogTitle: { color: 'black', textAlign: 'center', },
    ProgressPercentText: { textAlign: 'center', },
    DialogContentGridItems: { justifyContent: 'center', alignItems: 'center', },
}

export default function EditGoalStats({ goal, stats, open, setOpen, addAchieved, removeAchieved, progressPercent }) {

    const onClose = (e) => setOpen(false)
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
        >

            <DialogTitle sx={classes.DialogTitle}>{goal.task}</DialogTitle>
            <Typography sx={classes.ProgressPercentText}>{progressPercent}%</Typography>
            <LinearProgress variant="determinate" value={progressPercent > 100 ? 100 : progressPercent}/>
            <DialogContent>
                <Grid container >
                    <Grid container item xs={4} sx={classes.DialogContentGridItems} ><IconButton onClick={removeAchieved} ><Remove /></IconButton></Grid>
                    <Grid container item xs={4} sx={classes.DialogContentGridItems} ><Typography>{stats.achieved}</Typography></Grid>
                    <Grid container item xs={4} sx={classes.DialogContentGridItems} ><IconButton onClick={addAchieved}><Add /></IconButton></Grid>
                </Grid>
                <Grid container >
                    <Grid container item ></Grid>
                </Grid>
            </DialogContent>

        </Dialog>
    )
}
