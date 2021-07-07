import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Grid, TextField } from "@material-ui/core";

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
                {goals.filter(goal => search === '' ? true : goal.task === search).map((goal, index) => (
                    <Grid container item xs={12}>
                        <Grid item xs={6} >{goal.task}</Grid>
                        <Grid item xs={6} >{goal.category}</Grid>
                    </Grid>
                ))}
            </Grid>
        </div>
    )
}
