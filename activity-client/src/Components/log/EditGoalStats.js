import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, Divider, Grid, IconButton, LinearProgress, Typography } from '@mui/material';
import { Add, Remove, Edit } from '@mui/icons-material';
import EditGoal from './EditGoal';
import { renderChart } from '../Metrics/Metrics'

const classes = {
    DialogTitle: { display: 'flex', justifyContent: 'center', alignItems: 'center', 'h4, h6':{ color: 'black' } },
    ProgressPercentText: { textAlign: 'center', color: 'black', },
    jCaICenter: { justifyContent: 'center', alignItems: 'center', },
}

export default function EditGoalStats({ goal, stats, openDialog, setOpenDialog, addAchieved, removeAchieved, progressPercent, categories, selectedDate }) {
    const [toggleEditTaskView, setToggleEditTaskView] = useState(false);

    const onDialogClose = (e) => setOpenDialog(false);
    let startDate = new Date(selectedDate).setDate(new Date(selectedDate).getDate() - 6);

    return (
        <>
            <Dialog
                open={openDialog}
                onClose={onDialogClose}
                fullWidth
            >

                <DialogTitle sx={classes.DialogTitle}>
                    <Grid container sx={{ justifyContent: 'space-between', alignItems: 'center'}} >
                        <Grid item container xs={12} sm={2} sx={classes.jCaICenter} ><Typography variant="subtitle1">{selectedDate}</Typography></Grid>
                        <Grid item container xs={12} sm={8} sx={classes.jCaICenter} ><Typography variant="h4">{goal.task}</Typography></Grid>
                        <Grid item container xs={12} sm={2} sx={classes.jCaICenter} ><IconButton onClick={()=>setToggleEditTaskView(true)} ><Edit /></IconButton></Grid>
                    </Grid>
                    
                    
                </DialogTitle>
                <Typography variant="h6" sx={classes.ProgressPercentText}>{progressPercent}%</Typography>
                <LinearProgress variant="determinate" value={progressPercent > 100 ? 100 : progressPercent} />
                <DialogContent>
                    <Grid container >
                        <Grid container item xs={4} sx={classes.jCaICenter} ><IconButton onClick={removeAchieved} ><Remove /></IconButton></Grid>
                        <Grid container item xs={4} sx={classes.jCaICenter} ><Typography>{stats.achieved}</Typography></Grid>
                        <Grid container item xs={4} sx={classes.jCaICenter} ><IconButton onClick={addAchieved}><Add /></IconButton></Grid>
                    </Grid>
                    <Divider sx={{ margin: '15px 0px' }} />
                    <Typography variant="h5" sx={{ textAlign: "center" }}>7 day history</Typography>
                    {renderChart(goal, 400, 250, startDate, new Date(selectedDate))}
                </DialogContent>
                <Dialog open={toggleEditTaskView} onClose={() => setToggleEditTaskView(false)} >
                    <EditGoal goal={goal} categories={categories} setToggleEditTaskView={setToggleEditTaskView}/>
                </Dialog>
            </Dialog>
        </>
    )
}
