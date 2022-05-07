import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, Divider, Grid, IconButton, LinearProgress, Typography } from '@mui/material';
import { Add, Remove, Edit } from '@mui/icons-material';
import EditGoal from './EditGoal';
import { renderChart } from '../Metrics/Metrics'

const classes = {
    DialogTitle: { display: 'flex', justifyContent: 'center', alignItems: 'center', 'h4':{ color: 'black' } },
    ProgressPercentText: { textAlign: 'center', color: 'black', },
    jCaICenter: { justifyContent: 'center', alignItems: 'center', },
}

export default function EditGoalStats({ goal, stats, openDialog, setOpenDialog, addAchieved, removeAchieved, progressPercent, categories, selectedDate }) {
    const [openDrawer, setOpenDrawer] = useState(false);

    const onDialogClose = (e) => setOpenDialog(false);
    const handleDrawerOpen = () => setOpenDrawer(true);
    let startDate = new Date(selectedDate).setDate(new Date(selectedDate).getDate() - 6);

    return (
        <>
            <Dialog
                open={openDialog}
                onClose={onDialogClose}
                fullWidth
            >

                <DialogTitle sx={classes.DialogTitle}>
                    <Typography variant="h4">{goal.task}</Typography>
                    <IconButton onClick={handleDrawerOpen} ><Edit /></IconButton>
                </DialogTitle>
                <Typography variant="h6" sx={classes.ProgressPercentText}>{progressPercent}%</Typography>
                <LinearProgress variant="determinate" value={progressPercent > 100 ? 100 : progressPercent} />
                <DialogContent>
                    <Grid container >
                        <Grid container item xs={4} sx={classes.jCaICenter} ><IconButton onClick={removeAchieved} ><Remove /></IconButton></Grid>
                        <Grid container item xs={4} sx={classes.jCaICenter} ><Typography>{stats.achieved}</Typography></Grid>
                        <Grid container item xs={4} sx={classes.jCaICenter} ><IconButton onClick={addAchieved}><Add /></IconButton></Grid>
                    </Grid>
                    <Divider />
                    <Typography variant="h5" sx={{ textAlign: "center" }}>7 day history</Typography>
                    {renderChart(goal, 400, 250, startDate, new Date(selectedDate))}
                </DialogContent>
                <EditGoal goal={goal} openDrawer={openDrawer} setOpenDrawer={setOpenDrawer} categories={categories} />
            </Dialog>
        </>
    )
}
