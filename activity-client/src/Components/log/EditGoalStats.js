import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, Divider, Grid, IconButton, LinearProgress, Typography } from '@mui/material';
import { Add, Remove, Edit } from '@mui/icons-material';
import EditGoal from './EditGoal';
import { renderChart } from '../Metrics/Metrics';
import { dateToISOLikeButLocal, adjustDays } from '../Log/Log';
import { DateRange } from '../Metrics/Metrics';

const classes = {
    DialogTitle: { display: 'flex', justifyContent: 'center', alignItems: 'center', },
    ProgressPercentText: { textAlign: 'center', },
    jCaICenter: { justifyContent: 'center', alignItems: 'center', },
    ColorWhite: { color: '#f3f3f3', },
}

export default function EditGoalStats({ goal, stats, openDialog, setOpenDialog, addAchieved, removeAchieved, progressPercent, categories, selectedDate }) {
    const [toggleEditTaskView, setToggleEditTaskView] = useState(false);

    const onDialogClose = (e) => setOpenDialog(false);
    const [startDate, setStartDate] = useState(dateToISOLikeButLocal(adjustDays(new Date(selectedDate), -7)).substr(0, 10));
    const [endDate, setEndDate] = useState(dateToISOLikeButLocal(new Date(selectedDate)).substr(0, 10));

    return (
        <>
            <Dialog
                open={openDialog}
                onClose={onDialogClose}
                fullWidth
                sx={{ '& .MuiDialog-paper':{backgroundColor: "#303030",} }}
            >

                <DialogTitle sx={classes.DialogTitle}>
                    <Grid container sx={{ justifyContent: 'space-between', alignItems: 'center' }} >
                        <Grid item container xs={12} sm={2} sx={classes.jCaICenter} ><Typography variant="subtitle1">{selectedDate}</Typography></Grid>
                        <Grid item container xs={12} sm={8} sx={classes.jCaICenter} ><Typography variant="h4">{goal.task}</Typography></Grid>
                        <Grid item container xs={12} sm={2} sx={classes.jCaICenter} ><IconButton onClick={() => setToggleEditTaskView(true)} sx={ classes.ColorWhite } ><Edit /></IconButton></Grid>
                    </Grid>


                </DialogTitle>
                <Typography variant="h6" sx={classes.ProgressPercentText}>{progressPercent}%</Typography>
                <LinearProgress variant="determinate" value={progressPercent > 100 ? 100 : progressPercent} />
                <DialogContent>
                    <Grid container >
                        <Grid container item xs={4} sx={classes.jCaICenter} ><IconButton onClick={removeAchieved} sx={ classes.ColorWhite } ><Remove /></IconButton></Grid>
                        <Grid container item xs={4} sx={classes.jCaICenter} ><Typography sx={ classes.ColorWhite } >{stats.achieved}</Typography></Grid>
                        <Grid container item xs={4} sx={classes.jCaICenter} ><IconButton onClick={addAchieved} sx={ classes.ColorWhite } ><Add /></IconButton></Grid>
                    </Grid>
                    <Divider sx={{ margin: '15px 0px' }} />
                    <Typography variant="h6" sx={{ textAlign: "center" }}>History</Typography>
                    <DateRange startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
                    {renderChart(goal, 400, 250, startDate, endDate)}
                </DialogContent>
                <Dialog open={toggleEditTaskView} onClose={() => setToggleEditTaskView(false)} >
                    <EditGoal goal={goal} categories={categories} setToggleEditTaskView={setToggleEditTaskView} />
                </Dialog>
            </Dialog>
        </>
    )
}
