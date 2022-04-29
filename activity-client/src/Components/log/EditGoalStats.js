import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, Grid, IconButton, LinearProgress, Typography } from '@mui/material';
import { Add, Remove, Edit } from '@mui/icons-material';
import EditGoal from './EditGoal';

const classes = {
    DialogTitle: { color: 'black', textAlign: 'center', },
    ProgressPercentText: { textAlign: 'center', },
    jCaICenter: { justifyContent: 'center', alignItems: 'center', },
}

export default function EditGoalStats({ goal, stats, openDialog, setOpenDialog, addAchieved, removeAchieved, progressPercent }) {
    const [openDrawer, setOpenDrawer] = useState(false);

    const onDialogClose = (e) => setOpenDialog(false);
    const handleDrawerOpen = () => setOpenDrawer(true);

    return (
        <>
            <Dialog
                open={openDialog}
                onClose={onDialogClose}
                fullWidth
            >

                <DialogTitle sx={classes.DialogTitle}>{goal.task}</DialogTitle>
                <Typography sx={classes.ProgressPercentText}>{progressPercent}%</Typography>
                <LinearProgress variant="determinate" value={progressPercent > 100 ? 100 : progressPercent} />
                <DialogContent>
                    <Grid container >
                        <Grid container item xs={4} sx={classes.jCaICenter} ><IconButton onClick={removeAchieved} ><Remove /></IconButton></Grid>
                        <Grid container item xs={4} sx={classes.jCaICenter} ><Typography>{stats.achieved}</Typography></Grid>
                        <Grid container item xs={4} sx={classes.jCaICenter} ><IconButton onClick={addAchieved}><Add /></IconButton></Grid>
                    </Grid>
                    <Grid container sx={classes.jCaICenter} >
                        <IconButton onClick={handleDrawerOpen} ><Edit /></IconButton>
                    </Grid>
                </DialogContent>

                <EditGoal goal={goal} openDrawer={openDrawer} setOpenDrawer={setOpenDrawer} />

            </Dialog>
        </>
    )
}
