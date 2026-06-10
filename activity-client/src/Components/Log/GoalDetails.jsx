import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, Divider, Grid, IconButton, LinearProgress, Typography } from '@mui/material';
import { Add, Remove, Edit } from '@mui/icons-material';
import dayjs from "dayjs";
import EditGoal from './EditGoal';
import { renderChart } from './Metrics';
import { DateRange } from './Metrics';

const classes = {
    ProgressPercentText: { textAlign: 'center', },
    jCaICenter: { justifyContent: 'center', alignItems: 'center', },
}

export default function GoalDetails({ goal, stats, openDialog, setOpenDialog, addAchieved, removeAchieved, progressPercent, categories, selectedDate }) {
    const [toggleEditTaskView, setToggleEditTaskView] = useState(false);

    const onDialogClose = (e) => setOpenDialog(false);
    const [startDate, setStartDate] = useState(dayjs.utc(selectedDate, "YYYY-MM-DD").subtract(7, 'day').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs.utc(selectedDate, "YYYY-MM-DD").format('YYYY-MM-DD'));


    return (
        <>
            <Dialog
                open={openDialog}
                onClose={onDialogClose}
                fullWidth
            >
                <DialogTitle sx={classes.DialogTitle}>
                    <Grid container size={12} sx={{ justifyContent: 'space-between', alignItems: 'center' }} >
                        <Grid container size={{ xs: 12, sm: 2, }} sx={classes.jCaICenter} ><Typography variant="subtitle1">{dayjs(selectedDate, "YYYY-MM-DD").format("MMM D, YYYY")}</Typography></Grid>
                        <Grid container size={{ xs: 12, sm: 8, }} sx={classes.jCaICenter} ><Typography variant="h4">{goal.task}</Typography></Grid>
                        <Grid container size={{ xs: 12, sm: 2, }} sx={classes.jCaICenter} ><IconButton onClick={() => setToggleEditTaskView(true)} ><Edit /></IconButton></Grid>
                    </Grid>
                </DialogTitle>
                
                <Typography variant="h6" sx={classes.ProgressPercentText}>{progressPercent}%</Typography>
                <LinearProgress variant="determinate" value={progressPercent > 100 ? 100 : progressPercent} />
                <DialogContent>
                    <Grid container >
                        <Grid container size={4} sx={classes.jCaICenter} ><IconButton onClick={removeAchieved}  ><Remove /></IconButton></Grid>
                        <Grid container size={4} sx={classes.jCaICenter} ><Typography >{stats.achieved}</Typography></Grid>
                        <Grid container size={4} sx={classes.jCaICenter} ><IconButton onClick={addAchieved} ><Add /></IconButton></Grid>
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
