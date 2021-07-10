import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Grid, TextField, Typography } from "@material-ui/core";
import EditGoal from './EditGoal';

export default function Progress() {
    const goals = useSelector(state => state.goals);
    const [search, setSearch] = useState('');

    const handleChange = (e) => {
        setSearch(e.target.value);
    }

    return (
        <div>
            <TextField label="Search" fullWidth value={search} onChange={handleChange} />
            <Grid container >
                <Grid container item xs={12}>
                        <Grid item xs={3} ><Typography variant="h6" >Task</Typography></Grid>
                        <Grid item xs={3} ><Typography variant="h6" >Category</Typography></Grid>
                        <Grid item xs={3} ><Typography variant="h6" >Target</Typography></Grid>
                        <Grid item xs={3} ><Typography variant="h6" ></Typography></Grid>
                </Grid>
                {goals.filter(goal => search === '' ? true : goal.task === search).map((goal, index) => <EditGoal goal={goal} index={index} />)}
            </Grid>
        </div>
    )
}
